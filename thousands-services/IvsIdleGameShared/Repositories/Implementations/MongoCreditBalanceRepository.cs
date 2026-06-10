using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Amazon.SecurityToken.Model;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Models.Boost;
using IvsIdleGameShared.Models.Market;
using IvsIdleGameShared.Repositories.Interfaces;
using MongoDB.Bson;
using MongoDB.Driver;
using PubnubApi;
using StackExchange.Redis;

namespace IvsIdleGameShared.Repositories.Implementations
{
    public class MongoCreditBalanceRepository : ICreditBalanceRepository
    {
        private readonly MongoClient _client;
        private readonly IMongoCollection<CreditBalance> _creditBalanceCollection;
        private readonly IMongoCollection<CreditTransaction> _creditTransactionCollection;

        public MongoCreditBalanceRepository(IMongoDbSettings mongoDbSettings)
        {
            _client = new MongoClient(mongoDbSettings.ConnectionUri);
            IMongoDatabase database = _client.GetDatabase(mongoDbSettings.DatabaseName);
            _creditBalanceCollection = database.GetCollection<CreditBalance>(mongoDbSettings.CreditBalanceCollectionName);
            _creditTransactionCollection = database.GetCollection<CreditTransaction>(mongoDbSettings.CreditTransactionCollectionName);
        }

        public async Task<bool> AddCreditTransaction(string userId, string transactionId, int amount, string currency, string paymentMethod, string paymentGateway,
            string? paymentGatewayTransactionId, int refundedAmount, string status, string? creditType, string? stageId, int? segment, int? skyboxTier)
        {
            try
            {
                CreditTransaction newCreditTransaction = new CreditTransaction()
                {
                    UserId = ObjectId.Parse(userId),
                    Status = status,
                    TransactionId = transactionId,
                    Amount = amount,
                    Currency = currency,
                    PaymentMethod = paymentMethod,
                    PaymentGateway = paymentGateway,
                    PaymentGatewayTransactionId = paymentGatewayTransactionId,
                    RefundedAmount = refundedAmount,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    Version = 0,
                    CreditType = creditType,
                    StageId = stageId,
                    Segment = segment,
                    SkyboxTier = skyboxTier
                };

                Console.WriteLine(JsonSerializer.Serialize(newCreditTransaction));

                await _creditTransactionCollection.InsertOneAsync(newCreditTransaction);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"AddCreditTransaction Error: {ex.Message}");
                return false;
            }

            return true;
        }

        public async Task<List<CreditTransactionOutput>> GetCreditTransactions(string userId)
        {
            var pipeline = new List<BsonDocument>();

            var matchConditions = new BsonDocument();

            // Add userId filter if provided
            if (!string.IsNullOrEmpty(userId) && ObjectId.TryParse(userId, out ObjectId userIdObjectId))
            {
                matchConditions.Add("userId", userIdObjectId);
            }
            else //userId is required, so return empty array if not provided
            {
                return new List<CreditTransactionOutput>();
            }

            //Sort by startTime
            pipeline.Add(new BsonDocument("$sort", new BsonDocument("createdAt", -1)));

            // Only add `$match` if there are conditions
            if (matchConditions.ElementCount > 0)
            {
                pipeline.Add(new BsonDocument("$match", matchConditions));
            }

            var result = await _creditTransactionCollection.AggregateAsync<CreditTransactionOutput>(pipeline);

            var resultList = await result.ToListAsync();

            Console.WriteLine(JsonSerializer.Serialize(resultList));

            return resultList;
        }

        public async Task<int> GetCreditBalance(string userId)
        {
            try
            {
                var filter = Builders<CreditBalance>.Filter.Eq("userId", ObjectId.Parse(userId));
                var creditBalance = await _creditBalanceCollection.Find(filter).FirstOrDefaultAsync();

                return creditBalance?.Balance ?? 0;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"UpdateCreditBalance Error: {ex.Message}");
                return -1;
            }
        }

        public async Task<bool> SpendCredits(string userId, int creditsToSpend)
        {
            using var session = await _client.StartSessionAsync();
            session.StartTransaction();

            try
            {
                var filter = Builders<CreditBalance>.Filter.Eq("userId", ObjectId.Parse(userId));
                var userCreditBalance = await _creditBalanceCollection.Find(filter).FirstOrDefaultAsync();

                if (userCreditBalance == null || userCreditBalance.Balance < creditsToSpend)
                {
                    // Not enough credits or user not found
                    await session.AbortTransactionAsync();
                    return false;
                }

                var update = Builders<CreditBalance>.Update.Inc(u => u.Balance, 0 - creditsToSpend);
                await _creditBalanceCollection.UpdateOneAsync(session, filter, update);

                await session.CommitTransactionAsync();
                return true;
            }
            catch (Exception ex)
            {
                await session.AbortTransactionAsync();
                Console.WriteLine($"UpdateCreditBalance Error: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> UpdateCreditBalance(string userId, int changeInCreditBalance)
        {
            try
            {
                var filter = Builders<CreditBalance>.Filter.Eq("userId", ObjectId.Parse(userId));
                var updateIncrement = Builders<CreditBalance>.
                    Update
                    .Set("updatedAt", DateTime.UtcNow)
                    .SetOnInsert("userId", ObjectId.Parse(userId))
                    .SetOnInsert("createdAt", DateTime.UtcNow)
                    .SetOnInsert("__v", 0)
                    .Inc("balance", changeInCreditBalance);
                await _creditBalanceCollection.UpdateOneAsync(filter, updateIncrement,
                    new UpdateOptions() { IsUpsert = true });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"UpdateCreditBalance Error: {ex.Message}");
                return false;
            }

            return true;
        }

        public async Task<bool> UpdateTransactionStatus(string transactionId, string status, string paymentGatewayTransactionId)
        {
            try
            {
                var filter = Builders<CreditTransaction>.Filter.Eq("transactionId", transactionId);
                var updateStatus = Builders<CreditTransaction>.Update.Set("status", status)
                    .Set("paymentGatewayTransactionId", paymentGatewayTransactionId);
                var result = await _creditTransactionCollection.UpdateOneAsync(filter, updateStatus);

                if (result.ModifiedCount < 1)
                {
                    return false;
                }

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"UpdateTransactionStatus Error: {ex.Message}");
                return false;
            }
        }

        public async Task<List<CreditTransaction>> GetSkyboxPurchaseCreditTransactions(string stageId, int segment)
        {
            try
            {
                FilterDefinition<CreditTransaction> filter =
                    Builders<CreditTransaction>.Filter.Eq("stageId", stageId)
                    & Builders<CreditTransaction>.Filter.Eq("segment", segment)
                    & Builders<CreditTransaction>.Filter.Eq("creditType", "skybox_purchase");

                return await _creditTransactionCollection.Find(filter).ToListAsync();
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
                throw;
            }
        }
    }
}
