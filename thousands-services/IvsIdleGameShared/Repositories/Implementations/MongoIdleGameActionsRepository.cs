using IvsIdleGameShared.Models;
using IvsIdleGameShared.Repositories.Interfaces;
using IvsIdleGameShared.Configuration;
using MongoDB.Driver;

namespace IvsIdleGameShared.Repositories.Implementations
{
    public class MongoIdleGameActionsRepository : IIdleGameActionsRepository
    {
        private readonly IMongoCollection<StoredIdleEvent> _eventIdleEventsCollection;

        public MongoIdleGameActionsRepository(IMongoDbSettings mongoDbSettings)
        {
            MongoClient client = new MongoClient(mongoDbSettings.ConnectionUri);
            IMongoDatabase database = client.GetDatabase(mongoDbSettings.DatabaseName);
            _eventIdleEventsCollection = database.GetCollection<StoredIdleEvent>(mongoDbSettings.EventIdleEventsCollectionName);
        }

        public async Task AddIdleGameAction(StoredIdleEvent storedIdleEvent)
        {
            try
            {
                await _eventIdleEventsCollection.InsertOneAsync(storedIdleEvent);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"AddIdleGameAction Error: {ex.Message}");
                return;
            }
        }
    }
}
