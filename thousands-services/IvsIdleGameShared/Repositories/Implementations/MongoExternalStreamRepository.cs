using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Models.ExternalStreams;
using IvsIdleGameShared.Models.Skybox;
using IvsIdleGameShared.Repositories.Interfaces;
using MongoDB.Bson;
using MongoDB.Driver;
using PubnubApi.EventEngine.Presence.Events;

namespace IvsIdleGameShared.Repositories.Implementations
{
    public class MongoExternalStreamRepository : IExternalStreamRepository
    {
        private readonly IMongoCollection<GiftEvent> _giftEventsCollection;
        private readonly IMongoCollection<ExternalStream> _externalStreamsCollection;
        private readonly IMongoCollection<ExternalStreamStats> _externalStreamStatsCollection;

        public MongoExternalStreamRepository(IMongoDbSettings mongoDbSettings)
        {
            MongoClient client = new MongoClient(mongoDbSettings.ConnectionUri);
            IMongoDatabase database = client.GetDatabase(mongoDbSettings.DatabaseName);
            _giftEventsCollection = database.GetCollection<GiftEvent>(mongoDbSettings.GiftEventsCollectionName);
            _externalStreamsCollection = database.GetCollection<ExternalStream>(mongoDbSettings.ExternalStreamsCollectionName);
            _externalStreamStatsCollection = database.GetCollection<ExternalStreamStats>(mongoDbSettings.ExternalStreamStatsCollectionName);
        }

        public async Task<bool> AddExternalStream(ExternalStream externalStream)
        {
            try
            {
                var now = DateTime.UtcNow;
                externalStream.CreatedAt ??= now;
                externalStream.UpdatedAt ??= now;
                externalStream.Version ??= 0;
                await _externalStreamsCollection.InsertOneAsync(externalStream);
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"AddExternalStream Error: {ex.Message}");
                return false;
            }
        }

        public async Task<List<ExternalStream>?> GetAllActiveExternalStreams()
        {
            try
            {
                var filter = Builders<ExternalStream>.Filter.Eq(s => s.EndDate, null);
                return await _externalStreamsCollection.Find(filter).ToListAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"GetAllActiveExternalStreams Error: {ex.Message}");
                return null;
            }
        }

        public async Task<bool> UpdateExternalStreamSetAmountEarned(string id, decimal newAmountEarned)
        {
            var filter = Builders<ExternalStream>.Filter.Eq(s => s.Id, id);
            var update = Builders<ExternalStream>.Update.Set(s => s.AmountEarned, newAmountEarned);

            var result = await _externalStreamsCollection.UpdateOneAsync(filter, update);

            return result.ModifiedCount > 0;
        }

        public async Task<bool> UpdateExternalStreamSetEndDate(string id, DateTime endDate)
        {
            var filter = Builders<ExternalStream>.Filter.Eq(s => s.Id, id);
            var update = Builders<ExternalStream>.Update
                .Set(s => s.EndDate, endDate)
                .Set(s => s.UpdatedAt, DateTime.UtcNow);

            var result = await _externalStreamsCollection.UpdateOneAsync(filter, update);

            return result.ModifiedCount > 0;
        }

        public async Task<bool> UpdateExternalStreamSetThumbnailAndViewerCount(string id, string thumbnail, int viewerCount)
        {
            var filter = Builders<ExternalStream>.Filter.Eq(s => s.Id, id);
            var update = Builders<ExternalStream>.Update
                .Set(s => s.Thumbnail, thumbnail)
                .Set(s => s.ViewerCount, viewerCount)

                .Set(s => s.UpdatedAt, DateTime.UtcNow);

            var result = await _externalStreamsCollection.UpdateOneAsync(filter, update);

            return result.ModifiedCount > 0;
        }

        public async Task<bool> AddExternalStreamStats(ExternalStreamStats externalStreamStats)
        {
            try
            {
                await _externalStreamStatsCollection.InsertOneAsync(externalStreamStats);
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"AddExternalStreamStats Error: {ex.Message}");
                return false;
            }
        }

        public async Task<List<ExternalStreamStats>> GetExternalStreamStatsByDateRange(DateTime startDate, DateTime endDate)
        {
            try
            {
                var filter = Builders<ExternalStreamStats>.Filter.And(
                    Builders<ExternalStreamStats>.Filter.Gte(s => s.CreatedAt, startDate),
                    Builders<ExternalStreamStats>.Filter.Lte(s => s.CreatedAt, endDate)
                );

                return await _externalStreamStatsCollection.Find(filter).ToListAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"GetExternalStreamStatsByDateRange Error: {ex.Message}");
                return null;
            }
        }

        public async Task<bool> AddGiftEvent(GiftEvent giftEvent)
        {
            try
            {
                await _giftEventsCollection.InsertOneAsync(giftEvent);
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"AddGiftEvent Error: {ex.Message}");
                return false;
            }
        }
    }
}
