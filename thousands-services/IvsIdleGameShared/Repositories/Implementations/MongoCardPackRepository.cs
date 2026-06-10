using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Models.Market;
using IvsIdleGameShared.Models.Metagame;
using IvsIdleGameShared.Models.Skybox;
using IvsIdleGameShared.Repositories.Interfaces;
using MongoDB.Bson;
using MongoDB.Driver;
using PubnubApi;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Repositories.Implementations
{
    public class MongoCardPackRepository : ICardPackRepository
    {
        private readonly IMongoCollection<CardPack> _cardPackCollection;
        private readonly IMongoCollection<CardPackVault> _cardPackVaultCollection;

        public MongoCardPackRepository(IMongoDbSettings mongoDbSettings)
        {
            MongoClient client = new MongoClient(mongoDbSettings.ConnectionUri);
            IMongoDatabase database = client.GetDatabase(mongoDbSettings.DatabaseName);
            _cardPackCollection = database.GetCollection<CardPack>(mongoDbSettings.CardPacksCollectionName);
            _cardPackVaultCollection = database.GetCollection<CardPackVault>(mongoDbSettings.CardPackVaultsCollectionName);
        }

        public async Task<bool> AddCardPack(CardPack cardPack)
        {
            try
            {
                await _cardPackCollection.InsertOneAsync(cardPack);
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"AddCardPack Error: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> IncrementCardPackVaultAmount(int houseId, decimal amountToIncrement)
        {
            try
            {
                var filter = Builders<CardPackVault>.Filter.Eq("houseId", houseId);
                var updateIncrement = Builders<CardPackVault>.Update
                    .Set("updatedAt", DateTime.UtcNow)
                    .SetOnInsert("houseId", houseId)
                    .SetOnInsert("createdAt", DateTime.UtcNow)
                    .SetOnInsert("__v", 0)
                    .Inc("amount", (int)Math.Round(amountToIncrement * 100.0M));  //Convert to integer as cents (multiply by 100)
                await _cardPackVaultCollection.UpdateOneAsync(filter, updateIncrement,
                    new UpdateOptions() { IsUpsert = true });

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"IncrementCardPackVaultAmount Error: {ex.Message}");
                return false;
            }
        }
    }
}
