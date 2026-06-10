using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using IvsIdleGameShared.Models.Prediction;
using IvsIdleGameShared.Models.Vote;
using IvsIdleGameShared.Repositories.Interfaces;
using MongoDB.Bson;
using NetTopologySuite.Triangulate;
using StackExchange.Redis;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace IvsIdleGameShared.Repositories.Implementations
{
    public class RedisVoteRepository : IVoteRepository
    {
        private readonly IDatabase _redisDb;

        public RedisVoteRepository(IRedisDbProvider redisDbProvider)
        {
            _redisDb = redisDbProvider.database;
        }

        public string GetActiveVotingKeyName(string eventId)
        {
            return $"vote-active-{eventId}";
        }

        public string GetVotingSetupKeyName(string eventId, string voteId)
        {
            return $"vote-setup-{eventId}-{voteId}";
        }

        public string GetVotesKeyName(string eventId, string voteId)
        {
            return $"vote-votes-{eventId}-{voteId}";
        }

        public async Task<bool> AddActiveVoting(string eventId, Guid voteId)
        {
            string key = GetActiveVotingKeyName(eventId);

            ActiveVoting activeVoting = new ActiveVoting
            {
                VoteId = voteId
            };

            await _redisDb.StringSetAsync(key, JsonSerializer.Serialize(activeVoting), expiry: TimeSpan.FromHours(24));

            return true;
        }

        public async Task<ActiveVoting?> GetActiveVoting(string eventId)
        {
            string key = GetActiveVotingKeyName(eventId);
            RedisValue redisValue = await _redisDb.StringGetAsync(key);

            if (redisValue.HasValue)
            {
                string jsonString = redisValue.ToString();

                if (!string.IsNullOrEmpty(jsonString))
                {
                    ActiveVoting? activeVoting = JsonSerializer.Deserialize<ActiveVoting>(jsonString);

                    if (activeVoting != null)
                    {
                        return activeVoting;
                    }
                }
            }

            return null;
        }

        public async Task<bool> RemoveActiveVoting(string eventId)
        {
            string key = GetActiveVotingKeyName(eventId);
            await _redisDb.KeyDeleteAsync(key);
            
            return true;
        }

        public async Task<bool> AddVoteConfig(string eventId, string voteId, VoteConfig voteConfig)
        {
            string key = GetVotingSetupKeyName(eventId, voteId);

            await _redisDb.StringSetAsync(key, JsonSerializer.Serialize(voteConfig));

            return true;
        }

        public async Task<VoteConfig?> GetVoteConfig(string eventId, string voteId)
        {
            string key = GetVotingSetupKeyName(eventId, voteId);

            RedisValue redisValue = await _redisDb.StringGetAsync(key);

            if (redisValue.HasValue)
            {
                string jsonString = redisValue.ToString();

                if (!string.IsNullOrEmpty(jsonString))
                {
                    VoteConfig? voteConfig = JsonSerializer.Deserialize<VoteConfig>(jsonString);

                    if (voteConfig != null)
                    {
                        return voteConfig;
                    }
                }
            }

            return null;
        }

        public async Task<bool> AddVote(string eventId, string userId, string voteId, string voteOption)
        {
            string key = GetVotesKeyName(eventId, voteId);

            StoredVote storedVote = new StoredVote
            {
                UserId = userId,
                VoteOption = voteOption
            };

            await _redisDb.ListRightPushAsync(key, JsonSerializer.Serialize(storedVote));

            return true;
        }

        public async Task<List<StoredVote>> GetVotes(string eventId, string voteId)
        {
            string key = GetVotesKeyName(eventId, voteId);

            RedisValue[] redisValues = await _redisDb.ListRangeAsync(key, 0, -1); //Get all items in list.  It should never be that large.

            var outputList = new List<StoredVote>();

            foreach (var value in redisValues)
            {
                if (value.IsNullOrEmpty)
                {
                    continue;
                }

                string? valueString = value;
                if (!string.IsNullOrWhiteSpace(valueString))
                {
                    try
                    {
                        var item = JsonSerializer.Deserialize<StoredVote>(valueString);
                        if (item != null)
                        {
                            outputList.Add(item);
                        }
                    }
                    catch (JsonException jsonException)
                    {
                        Console.WriteLine($"Failed to deserialize Votes: {jsonException.Message}");
                    }
                }
            }

            return outputList;
        }
    }
}
