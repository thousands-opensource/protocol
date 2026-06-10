using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Amazon.SecurityToken.Model;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Models.Market;
using IvsIdleGameShared.Repositories.Interfaces;
using MongoDB.Bson;
using MongoDB.Driver;

namespace IvsIdleGameShared.Repositories.Implementations
{
    public class MongoMarketRepository : IMarketRepository
    {
        private readonly IMongoCollection<MarketTransaction> _marketTransactionsCollection;
        private readonly IMongoCollection<UserCoin> _userCoinsCollection;

        public MongoMarketRepository(IMongoDbSettings mongoDbSettings)
        {
            MongoClient client = new MongoClient(mongoDbSettings.ConnectionUri);
            IMongoDatabase database = client.GetDatabase(mongoDbSettings.DatabaseName);
            _marketTransactionsCollection = database.GetCollection<MarketTransaction>(mongoDbSettings.MarketTransactionsCollectionName);
            _userCoinsCollection = database.GetCollection<UserCoin>(mongoDbSettings.UserCoinsCollectionName);
        }

        public async Task<UserCoin?> AddCoinToUser(string userId, string coinName, int quantity, decimal avgPurchasePricePerCoin, UserCoin? userCoins)
        {
            //Get their current user-coins document if we didn't send one in
            userCoins ??= await GetUserCoins(userId);

            bool hasAUserCoinsDocument = (userCoins != null);
            bool hasARowForThisCoinAlready = false;
            decimal newAvgPurchasePrice = 0;
            if (hasAUserCoinsDocument && userCoins?.CoinHoldings != null)
            {
                foreach (var userCoin in userCoins.CoinHoldings)
                {
                    if (userCoin.CoinName == coinName)
                    {
                        hasARowForThisCoinAlready = true;
                        decimal decimalQuantity = quantity;
                        decimal decimalPreviousQuantity = userCoin.Quantity;
                        //Handle divide by zero
                        if (decimalPreviousQuantity + decimalQuantity == 0)
                        {
                            newAvgPurchasePrice = 0;
                        }
                        else
                        {
                            newAvgPurchasePrice =
                                ((decimalPreviousQuantity * userCoin.AvgPurchasePrice) + (decimalQuantity * avgPurchasePricePerCoin)) /
                                (decimalPreviousQuantity + decimalQuantity);
                        }
                        

                        Console.WriteLine($"{decimalPreviousQuantity * userCoin.AvgPurchasePrice} + {decimalQuantity * avgPurchasePricePerCoin} / {decimalPreviousQuantity + decimalQuantity}");

                        //Update the value in userCoin because we are going to return that back to the API caller
                        userCoin.Quantity += quantity;
                        userCoin.AvgPurchasePrice = newAvgPurchasePrice;
                    }
                }
            }

            try
            {
                if (hasARowForThisCoinAlready) //We have a document and a row for this coin.  Combine the two.
                {
                    Console.WriteLine("We have a document and a row for this coin.  Combine the two.");

                    var filterIncrement = Builders<UserCoin>.Filter.Eq("userId", userId)
                                          & Builders<UserCoin>.Filter.Eq("coinHoldings.coinName", coinName);
                    var updateIncrement = Builders<UserCoin>.Update
                        .Inc("coinHoldings.$.quantity",  quantity)
                        .Set("coinHoldings.$.avgPurchasePrice", newAvgPurchasePrice);

                    var resultIncrement = await _userCoinsCollection.UpdateOneAsync(filterIncrement, updateIncrement);

                    if (resultIncrement.ModifiedCount > 0)
                    {
                        Console.WriteLine($"Updated coinHoldings successfully for: {coinName} {quantity} {newAvgPurchasePrice}");
                    }
                    else
                    {
                        Console.WriteLine($"Error updating coinHoldings for: {coinName} {quantity} {newAvgPurchasePrice}");
                    }
                }
                else if (hasAUserCoinsDocument) //We have a document, but no row for this coin yet
                {
                    Console.WriteLine("We have a document, but no row for this coin yet.");

                    var newCoinHolding = new CoinHolding()
                    {
                        CoinName = coinName,
                        Quantity = quantity,
                        AvgPurchasePrice = avgPurchasePricePerCoin
                    };

                    var filterAdd = Builders<UserCoin>.Filter.Eq("userId", userId);
                    var updateAdd = Builders<UserCoin>.Update.Push("coinHoldings", newCoinHolding);

                    var resultAddCoinHolding = await _userCoinsCollection.UpdateOneAsync(filterAdd, updateAdd);

                    if (resultAddCoinHolding.ModifiedCount > 0)
                    {
                        userCoins.AddCoinHolding(newCoinHolding);

                        Console.WriteLine($"Added coinHoldings successfully for: {coinName} {quantity} {newAvgPurchasePrice}");
                    }
                    else
                    {
                        Console.WriteLine($"Error adding coinHoldings for: {coinName} {quantity} {newAvgPurchasePrice}");
                    }
                }
                else //We don't have a document yet
                {
                    Console.WriteLine("We don't have a document yet.");

                    var newUserCoins = new UserCoin()
                    {
                        UserId = userId,
                        CoinHoldings = new CoinHolding[]
                        {
                            new CoinHolding()
                            {
                                CoinName = coinName,
                                Quantity = quantity,
                                AvgPurchasePrice = avgPurchasePricePerCoin
                            }
                        }
                    };
                    await _userCoinsCollection.InsertOneAsync(newUserCoins);

                    return newUserCoins;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"AddCoinToUser Error: {ex.Message}");
                return null;
            }

            return userCoins;
        }

        public async Task<UserCoin?> GetUserCoins(string userId)
        {
            try
            {
                var filter = Builders<UserCoin>.Filter.Eq("userId", userId);
                var creditBalance = await _userCoinsCollection.Find(filter).FirstOrDefaultAsync();
                if (creditBalance != null)
                {
                    return creditBalance;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"GetUserCoins Error: {ex.Message}");
            }

            return null;
        }

        public async Task<bool> DoesUserHaveEnoughCoins(string userId, string coinName, int quantity)
        {
            UserCoin userCoin = await GetUserCoins(userId);

            if (String.IsNullOrEmpty(userCoin.UserId)
                || userCoin.CoinHoldings == null
                || userCoin.CoinHoldings.Length < 1)
            {
                return false;
            }

            foreach (var coin in userCoin.CoinHoldings)
            {
                if (coin.CoinName == coinName && coin.Quantity >= quantity)
                {
                    return true;
                }
            }

            return false;
        }

        public async Task<bool> AddMarketTransaction(string userId, long timestamp, string coinName, string orderType, int quantity, decimal totalValue, decimal tax)
        {
            try
            {
                var marketTransaction = new MarketTransaction()
                {
                    UserId = userId,
                    CoinName = coinName,
                    OrderType = orderType,
                    Quantity = quantity,
                    TotalValue = totalValue,
                    Tax = tax
                };
                await _marketTransactionsCollection.InsertOneAsync(marketTransaction);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"AddMarketTransaction Error: {ex.Message}");
                return false;
            }

            return true;
        }
    }
}
