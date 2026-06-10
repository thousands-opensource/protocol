using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Repositories.Interfaces;
using MongoDB.Bson;
using MongoDB.Driver;

namespace IvsIdleGameShared.Repositories.Implementations
{
    public class MongoEventRepository : IEventRepository
    {
        private readonly IMongoCollection<Event> _eventCollection;

        public MongoEventRepository(IMongoDbSettings mongoDbSettings)
        {
            MongoClient client = new MongoClient(mongoDbSettings.ConnectionUri);
            IMongoDatabase database = client.GetDatabase(mongoDbSettings.DatabaseName);
            _eventCollection = database.GetCollection<Event>(mongoDbSettings.EventsCollectionName);
        }

        public async Task<Event?> GetEventFromVendorEventId(string vendorEventId)
        {
            FilterDefinition<Event> filter = Builders<Event>.Filter.Eq("beamableEventId", vendorEventId);
            return await _eventCollection.Find(filter).FirstOrDefaultAsync();
        }

        public async Task<bool> IncrementCurrentSegment(string stageId, int amountToIncrement)
        {
            FilterDefinition<Event> filter = Builders<Event>.Filter.Eq("_id", ObjectId.Parse(stageId));
            var updateIncrement = Builders<Event>.
                Update
                .Set("updatedAt", DateTime.UtcNow)
                .Inc("currentSegment", amountToIncrement);
            await _eventCollection.UpdateOneAsync(filter, updateIncrement);

            return true;
        }
    }
}
