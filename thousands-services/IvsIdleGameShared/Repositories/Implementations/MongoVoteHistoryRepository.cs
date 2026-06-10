using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Models.Boost;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using IvsIdleGameShared.Models.Vote;
using IvsIdleGameShared.Repositories.Interfaces;
using IvsIdleGameShared.Models.Market;
using MongoDB.Bson;
using PubnubApi;

namespace IvsIdleGameShared.Repositories.Implementations
{
    public class MongoVoteHistoryRepository : IVoteHistoryRepository
    {
        private readonly IMongoCollection<VoteHistory> _voteHistoryCollection;

        public MongoVoteHistoryRepository(IMongoDbSettings mongoDbSettings)
        {
            MongoClient client = new MongoClient(mongoDbSettings.ConnectionUri);
            IMongoDatabase database = client.GetDatabase(mongoDbSettings.DatabaseName);
            _voteHistoryCollection = database.GetCollection<VoteHistory>(mongoDbSettings.VoteHistoryCollectionName);
        }

        public async Task<bool> AddVoteHistory(VoteHistory voteHistory)
        {
            try
            {
                await _voteHistoryCollection.InsertOneAsync(voteHistory);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"MongoVoteHistoryRepository - Error adding VoteHistory: {ex.Message}");
                return false;
            }

            return true;
        }

        public async Task<List<VoteHistory>?> GetVoteHistory(string stageId)
        {
            try
            {
                var filter = Builders<VoteHistory>.Filter.Eq("stageId", ObjectId.Parse(stageId));
                var sort = Builders<VoteHistory>.Sort.Descending(d => d.CreatedAt);
                var voteHistory = await _voteHistoryCollection.Find(filter).Sort(sort).ToListAsync();

                return voteHistory;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"MongoVoteHistoryRepository - Error getting VoteHistory for stageId: {stageId}: {ex.Message}");
                return null;
            }
        }
    }
}
