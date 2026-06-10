using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using IvsIdleGameShared.Models.Market;
using IvsIdleGameShared.Repositories.Interfaces;
using IvsIdleGameShared.Services.Interfaces;
using NetTopologySuite.Operation.Distance;

namespace IvsIdleGameShared.Services.Implementations
{
    public class MarketService : IMarketService
    {
        private readonly IMarketCache _marketCache;
        private readonly IMarketRepository _marketRepository;
        private readonly ICreditBalanceRepository _creditBalanceRepository;
        private readonly ILeaderboardService _leaderboardService;
        private readonly long _eventStartTime = 1734632392440;

        public MarketService(IMarketCache marketCache, IMarketRepository marketRepository, ICreditBalanceRepository creditBalanceRepository, 
            ILeaderboardService leaderboardService)
        {
            _marketCache = marketCache;
            _marketRepository = marketRepository;
            _creditBalanceRepository = creditBalanceRepository;
            _leaderboardService = leaderboardService;
        }

        public async Task<List<CoinHoldingWithCurrentPrice>> GetMyCoins(string userId)
        {
            List<CoinHoldingWithCurrentPrice> coinHoldingWithCurrentPriceList = new List<CoinHoldingWithCurrentPrice>();

            var userCoins = await _marketRepository.GetUserCoins(userId);

            if (userCoins == null || userCoins.CoinHoldings == null)
            {
                return coinHoldingWithCurrentPriceList;
            }

            foreach (var coinHolding in userCoins.CoinHoldings)
            {
                if (!coinHolding.CoinName.StartsWith("BUTTON_"))
                {
                    CoinHoldingWithCurrentPrice coin = new CoinHoldingWithCurrentPrice()
                    {
                        CoinHolding = coinHolding,
                        CurrentPrice = new CoinPrice()
                    };
                    coinHoldingWithCurrentPriceList.Add(coin);
                }
            }

            return coinHoldingWithCurrentPriceList;
        }

        public async Task<PriceQuote> GetPriceQuote(string userId, string coinName, int quantity, string orderType, string formula)
        {
            string capitalizedCoinName = coinName.ToUpper();

            DateTimeOffset dto = new DateTimeOffset(DateTime.UtcNow);
            long currentTimestamp = dto.ToUnixTimeMilliseconds();
            long time = currentTimestamp - _eventStartTime;

            //Get the supply from market cache
            int supply = await _marketCache.GetSupply(capitalizedCoinName);

            //If this is a sell order, make sure the supply is available to sell
            if (orderType == "sell" && quantity > supply)
            {
                //There isn't enough supply to get a price quote for
                return new PriceQuote()
                {
                    UserId = userId,
                    OrderType = orderType,
                    CoinPrice = new CoinPrice(),
                    Quantity = -1,
                    Tax = -1,
                    Timestamp = currentTimestamp
                };
            }

            CoinPrice orderCoinPrice = InternalGetPriceQuote(capitalizedCoinName, supply, quantity, orderType, time, formula);

            decimal tax = 0;

            //This is Streamcoins, so charge a tax
            if (formula != "1/x^n")
            {
                tax = (decimal)Math.Ceiling(orderCoinPrice.Price * 0.01M);
            }

            if (orderType == "buy")
            {
                //Check to make sure the user can afford the transaction
                int creditBalance = await _creditBalanceRepository.GetCreditBalance(userId);

                Console.WriteLine($"Credit Balance: {creditBalance}");

                if (creditBalance < orderCoinPrice.Price + tax)
                {
                    //The user doesn't have enough credits to complete this trade
                    return new PriceQuote()
                    {
                        UserId = userId,
                        OrderType = orderType,
                        CoinPrice = orderCoinPrice,
                        Quantity = -1,
                        Tax = tax,
                        Timestamp = currentTimestamp
                    };
                }
            }
            else if (orderType == "sell")
            {
                bool doesUserHaveEnoughCoins = await _marketRepository.DoesUserHaveEnoughCoins(userId, capitalizedCoinName, quantity);
                if (!doesUserHaveEnoughCoins)
                {
                    Console.WriteLine("Doesn't have enough coins.");

                    //The user doesn't have enough holdings of this coinName to complete this trade
                    return new PriceQuote()
                    {
                        UserId = userId,
                        OrderType = orderType,
                        CoinPrice = orderCoinPrice,
                        Quantity = -1,
                        Tax = tax,
                        Timestamp = currentTimestamp
                    };
                }
            }
            else
            {
                //Invalid orderType
                return new PriceQuote()
                {
                    UserId = userId,
                    OrderType = orderType,
                    CoinPrice = orderCoinPrice,
                    Quantity = -1,
                    Tax = tax,
                    Timestamp = currentTimestamp
                };
            }

            PriceQuote outputPriceQuote = new PriceQuote()
            {
                UserId = userId,
                OrderType = orderType,
                CoinPrice = orderCoinPrice,
                Quantity = quantity,
                Tax = tax,
                Timestamp = currentTimestamp
            };

            //Store the price quote in the market cache
            bool success = await _marketCache.StorePriceQuote(outputPriceQuote);

            return (success ? outputPriceQuote : new PriceQuote());
        }

        public async Task<List<CoinPrice>> GetTopCoins()
        {
            return await _marketCache.GetTopCoinPrices();
        }

        public async Task<PlaceOrderResult> PlaceOrder(string eventId, string userId, Guid priceQuoteGuid, string coinName, int quantity, string orderType, string formula)
        {
            string capitalizedCoinName = coinName.ToUpper();

            PriceQuote priceQuote = await _marketCache.GetPriceQuote(priceQuoteGuid);

            //We were unable to find the price quote (it could be expired), return WasOrderPlaced as false
            if (priceQuote.Timestamp < 1)
            {
                PriceQuote newPriceQuote = await GetPriceQuote(userId, capitalizedCoinName, quantity, orderType, formula);

                return new PlaceOrderResult()
                {
                    WasOrderPlaced = false,
                    ErrorMessage = "The previous price quote expired.  Please confirm or cancel your order with the updated price quote.",
                    PriceQuote = newPriceQuote
                };
            }

            //If the userId doesn't match
            if (userId != priceQuote.UserId)
            {
                Console.WriteLine($"Incoming userId: {userId} does not match the userId in the stored price quote: {priceQuote.UserId}");
                return new PlaceOrderResult()
                {
                    WasOrderPlaced = false,
                    ErrorMessage = "Incoming userId does not match the userId in the stored price quote!"
                };
            }

            //Get creditBalance and userCoins for buy and sell orders so we can return them back in PlaceOrderResult
            int creditBalance = await _creditBalanceRepository.GetCreditBalance(userId);
            var userCoins = await _marketRepository.GetUserCoins(userId);

            decimal previousPurchasePricePerCoin = 0;
            if (priceQuote.OrderType == "buy")
            {
                //Check to make sure the user can afford the transaction
                if (creditBalance < priceQuote.CoinPrice.Price + priceQuote.Tax)
                {
                    //The user doesn't have enough credits to complete this trade
                    return new PlaceOrderResult()
                    {
                        WasOrderPlaced = false,
                        ErrorMessage = "Not enough credits to complete the transaction!"
                    };
                }
            }
            else //Sell order
            {
                //Make sure the user has the coins to sell
                if (userCoins == null || userCoins.CoinHoldings == null)
                {
                    return new PlaceOrderResult()
                    {
                        WasOrderPlaced = false,
                        ErrorMessage = "You don't have the coins to sell!"
                    };
                }

                int quantityOfCoins = 0;
                foreach (var coinHolding in userCoins.CoinHoldings)
                {
                    if (coinHolding.CoinName == capitalizedCoinName)
                    {
                        quantityOfCoins = coinHolding.Quantity;
                        previousPurchasePricePerCoin = coinHolding.AvgPurchasePrice;
                        break;
                    }
                }

                if (quantityOfCoins < 1)
                {
                    return new PlaceOrderResult()
                    {
                        WasOrderPlaced = false,
                        ErrorMessage = "You don't have enough coins to sell!"
                    };
                }
            }

            //Generate current timestamp for this transaction
            DateTimeOffset dto = new DateTimeOffset(DateTime.UtcNow);
            long currentTimestamp = dto.ToUnixTimeMilliseconds();
            long time = currentTimestamp - _eventStartTime;

            //Record the market transaction - priceQuote.CoinPrice.Price is the total cost for all quantity
            await _marketRepository.AddMarketTransaction(priceQuote.UserId, currentTimestamp, priceQuote.CoinPrice.CoinName, priceQuote.OrderType, priceQuote.Quantity, 
                priceQuote.CoinPrice.Price, priceQuote.Tax);

            Console.WriteLine("Added the Market Transaction");

            //Take/give credits from users
            int amountToDebitFromUser = 0;
            if (orderType == "buy")
            {
                //We take from the buy the price and the tax
                amountToDebitFromUser = (int)Math.Ceiling(priceQuote.CoinPrice.Price + priceQuote.Tax);
            }
            else //Sell order
            {
                //We give the seller the Price minus the tax
                amountToDebitFromUser = (int)Math.Ceiling(priceQuote.Tax - priceQuote.CoinPrice.Price);
            }

            bool successfullyUpdatedCreditBalance = await _creditBalanceRepository.UpdateCreditBalance(userId, 0 - amountToDebitFromUser);

            Console.WriteLine($"Amount to Debit from User: {amountToDebitFromUser}");

            if (successfullyUpdatedCreditBalance)
            {
                Console.WriteLine("Successfully updated Credit Balance");
            }

            //If this is a sell order, calculate profit and update the score
            if (priceQuote.OrderType == "sell")
            {
                //Gain score
                int scoreChange = (0 - amountToDebitFromUser) - (int)(quantity * previousPurchasePricePerCoin);

                Console.WriteLine($"scoreChange: {scoreChange} = {0 - amountToDebitFromUser} - ({quantity} * {previousPurchasePricePerCoin})");
                if (scoreChange > 0)
                {
                    await _leaderboardService.IncrementScore(eventId, userId, scoreChange);
                }
                else //For testing give 1 score for any sell
                {
                    await _leaderboardService.IncrementScore(eventId, userId, 1);
                }

                quantity = 0 - quantity;
            }

            //Add coin to users holdings
            decimal averagePricePerCoin = Math.Round((decimal)amountToDebitFromUser / priceQuote.Quantity, 2);
            Console.WriteLine($"averagePricePerCoin: {averagePricePerCoin}");
            var updateUserCoins = await _marketRepository.AddCoinToUser(priceQuote.UserId,
                priceQuote.CoinPrice.CoinName, quantity, averagePricePerCoin, userCoins);

            if (updateUserCoins != null)
            {
                Console.WriteLine("Successfully added coin to holdings");
            }

            //This is the Wildcard chat app, so calculate how much we need to increase the supply to raise the price by the required amount
            if (formula == "1/x^n")
            {
                //Get the supply from market cache
                int supply = await _marketCache.GetSupply(capitalizedCoinName);
                decimal roundedTime = Math.Ceiling((decimal)time / 5000.0M);

                int amountToIncreasePrice = (int)priceQuote.CoinPrice.Price;
                quantity = ((int)roundedTime - supply) - (int)Math.Ceiling((100 * Math.Sqrt(amountToIncreasePrice)) / amountToIncreasePrice);

                //Calculate score gain
                int scoreChange = 0;
                if (priceQuote.CoinPrice.CoinName == "BUTTON_1.1X")
                {
                    scoreChange = 6;
                }
                else if (priceQuote.CoinPrice.CoinName == "BUTTON_1.5X")
                {
                    scoreChange = 30;
                }
                else if (priceQuote.CoinPrice.CoinName == "BUTTON_2X")
                {
                    scoreChange = 60;
                }

                await _leaderboardService.IncrementScore(eventId, userId, scoreChange);
            }

            //Increment/Decrement the supply so the next price quote that comes in is at an adjusted price
            int newSupply = await _marketCache.IncrementSupply(priceQuote.CoinPrice.CoinName, quantity);
            Console.WriteLine($"New supply: {newSupply}");

            //Remove the price quote so it cannot be used a second time as an exploit for lower prices.
            Task awaitTaskRemovePrice = _marketCache.RemovePriceQuote(priceQuoteGuid);

            //Update the Coin Prices sorted list cache
            Task awaitTaskCalculateAndStoreCoinPrice = CalculateAndStoreCoinPriceAsync(priceQuote.CoinPrice.CoinName, newSupply, time, formula);

            Task.WaitAll(awaitTaskRemovePrice, awaitTaskCalculateAndStoreCoinPrice);

            Console.WriteLine($"Removed the previous price quote for this user and updated the coin prices list cache");

            PlaceOrderResult placeOrderResult = new PlaceOrderResult()
            {
                WasOrderPlaced = true,
                PriceQuote = priceQuote,
                UpdatedCredits = creditBalance - amountToDebitFromUser,
                UpdatedUserCoins = updateUserCoins,
                UpdatedSupply = newSupply
            };

            return placeOrderResult;
        }


        private CoinPrice InternalGetPriceQuote(string coinName, int supply, int quantity, string orderType, long time, string formula)
        {
            int definiteIntegralStart = 0;
            int definiteIntegralEnd = 0;
            decimal price = 0;
            decimal roundedPrice = 0;

            Console.WriteLine($"definiteIntegralStart: {definiteIntegralStart} - definiteIntegralEnd: {definiteIntegralEnd}");

            if (formula == "x^2")
            {
                if (orderType == "buy")
                {
                    definiteIntegralStart = supply;
                    definiteIntegralEnd = supply + quantity;
                }
                else
                {
                    definiteIntegralStart = supply - quantity;
                    definiteIntegralEnd = supply;
                }

                //This formula is the definite integral for the bonding curve 1 + 0.001x^2
                price = (decimal)((definiteIntegralEnd + (0.0003 * (Math.Pow(definiteIntegralEnd, 3)))) -
                                  (definiteIntegralStart + (0.0003 * (Math.Pow(definiteIntegralStart, 3)))));
            }
            else if (formula == "1/x^n")
            {
                int basePrice = 0;
                if (coinName == "BUTTON_1.1X")
                {
                    basePrice = 80;
                }
                else if (coinName == "BUTTON_1.5X")
                {
                    basePrice = 400;
                }
                else if (coinName == "BUTTON_2X")
                {
                    basePrice = 800;
                }

                decimal roundedTime = Math.Ceiling((decimal)time / 5000.0M);
                //This formula follows the curve 1 / x^2
                price = (decimal)((1 / Math.Pow(0.01 * ((double)roundedTime - supply), 2)) + basePrice);
            }

            Console.WriteLine($"price: {price}");

            //Since credits are only whole numbers, round up to 0 decimals.  Keeping the output as decimal for future compatibility.
            roundedPrice = Math.Ceiling(price);
            price = roundedPrice;

            Console.WriteLine($"roundedPrice: {roundedPrice}");

            return new CoinPrice()
            {
                CoinName = coinName,
                Price = price
            };
        }

        private Task CalculateAndStoreCoinPriceAsync(string coinName, int supply, long time, string formula)
        {
            CoinPrice spotCoinPrice = InternalGetPriceQuote(coinName, supply, 1, "buy", time, formula);

            return _marketCache.SetCoinPrice(spotCoinPrice);
        }
    }
}

