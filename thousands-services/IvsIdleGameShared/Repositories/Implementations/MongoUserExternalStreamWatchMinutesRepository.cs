using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Models.ExternalStreams;
using IvsIdleGameShared.Repositories.Interfaces;
using MongoDB.Driver;

namespace IvsIdleGameShared.Repositories.Implementations
{
    public class MongoUserExternalStreamWatchMinutesRepository : IUserExternalStreamWatchMinutesRepository
    {
        private readonly IMongoCollection<UserExternalStreamWatchMinutes> _watchMinutesCollection;

        public MongoUserExternalStreamWatchMinutesRepository(IMongoDbSettings mongoDbSettings)
        {
            MongoClient client = new MongoClient(mongoDbSettings.ConnectionUri);
            IMongoDatabase database = client.GetDatabase(mongoDbSettings.DatabaseName);
            _watchMinutesCollection = database.GetCollection<UserExternalStreamWatchMinutes>(
                mongoDbSettings.UserExternalStreamWatchMinutesCollectionName);
        }

        public async Task<bool> UpsertUserExternalStreamWatchMinutesTotal(UserExternalStreamWatchMinutes watchMinutes)
        {
            try
            {
                var filter = Builders<UserExternalStreamWatchMinutes>.Filter.And(
                    Builders<UserExternalStreamWatchMinutes>.Filter.Eq(x => x.UserId, watchMinutes.UserId),
                    Builders<UserExternalStreamWatchMinutes>.Filter.Eq(x => x.ExternalStreamId, watchMinutes.ExternalStreamId)
                );

                var update = Builders<UserExternalStreamWatchMinutes>.Update
                    .Set(x => x.MinutesWatched, watchMinutes.MinutesWatched)
                    .Set(x => x.PeriodStartUtc, watchMinutes.PeriodStartUtc)
                    .Set(x => x.PeriodEndUtc, watchMinutes.PeriodEndUtc)
                    .Set(x => x.SessionId, watchMinutes.SessionId)
                    .Set(x => x.Placement, watchMinutes.Placement)
                    .Set(x => x.UserAgentHash, watchMinutes.UserAgentHash)
                    .SetOnInsert(x => x.CreatedAt, DateTime.UtcNow)
                    .SetOnInsert(x => x.Id, watchMinutes.Id);

                var options = new UpdateOptions { IsUpsert = true };
                var result = await _watchMinutesCollection.UpdateOneAsync(filter, update, options);
                return result.ModifiedCount > 0 || result.UpsertedId != null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"UpsertUserExternalStreamWatchMinutesTotal Error: {ex.Message}");
                return false;
            }
        }
    }
}
