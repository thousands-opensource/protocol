using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Models.Boost;
using IvsIdleGameShared.Models.Leaderboard;
using IvsIdleGameShared.Repositories.Interfaces;
using PubnubApi;
using StackExchange.Redis;
using static System.Formats.Asn1.AsnWriter;

namespace IvsIdleGameShared.Repositories.Implementations
{
    public class RedisLeaderboardRepository : ILeaderboardRepository
    {
        private readonly IDatabase _redisDb;
        private const decimal GoldenRatio = 1.618M;

        public RedisLeaderboardRepository(IRedisDbProvider redisDbProvider)
        {
            _redisDb = redisDbProvider.database;
        }

        private string GetUserToScoreMappingKey(string eventId)
        {
            return $"leaderboard-usertoscore-{eventId}";
        }

        private string GetScoreToRankMappingKey(string eventId)
        {
            return $"leaderboard-scoretorank-{eventId}";
        }

        private string GetScoreCountKey(string eventId)
        {
            return $"leaderboard-scorecount-{eventId}";
        }

        public async Task<bool> AddScoreToRankMappingSortedSet(string eventId, int score, int rank)
        {
            string key = GetScoreToRankMappingKey(eventId);

            Console.WriteLine($"AddScoreToRankMappingSortedSet: {score} {rank}");

            await _redisDb.SortedSetAddAsync(key, score, rank);

            return true;
        }

        public async Task<double> IncrementUserIdToScoreMappingSortedSet(string eventId, string userId, int incrementAmount)
        {
            string key = GetUserToScoreMappingKey(eventId);

            double newScore = await _redisDb.SortedSetIncrementAsync(key, userId, incrementAmount);

            return newScore;
        }

        public async Task<bool> IncrementUserIdsToScoresMappingSortedSet(string eventId, List<Boost> boosts)
        {
            string key = GetUserToScoreMappingKey(eventId);

            List<Task> incrementTasks = new List<Task>();
            IBatch batch = _redisDb.CreateBatch();
            foreach (Boost boost in boosts)
            {
                //Rally Points is equal to the credits spent (Boost Price) plus the prediction bonus (Bonus Amount)
                decimal rallyPoints = boost.BoostPrice + boost.BoostAmount;

                //If this rally was in a skybox, then it gets a 10% bonus
                decimal skyboxPersonalBonusPoints = (boost.SkyboxId != null ? rallyPoints * 0.1M : 0M);

                //We add Rally Points plus any optional Skybox Personal Bonus Points and then multiply the whole thing by the Golden Ratio
                int totalPoints = (int)Math.Round((rallyPoints + skyboxPersonalBonusPoints) * GoldenRatio);

                //Increment the value in the sorted set
                incrementTasks.Add(_redisDb.SortedSetIncrementAsync(key, boost.UserId, totalPoints));
            }
            batch.Execute();
            await Task.WhenAll(incrementTasks.ToArray());

            return true;
        }

        public async Task<long> GetUserIdRank(string eventId, string userId)
        {
            string key = GetUserToScoreMappingKey(eventId);

            long? rank = await _redisDb.SortedSetRankAsync(key, userId, Order.Descending);

            if (rank == null)
            {
                return -1;
            }

            return rank.Value;
        }

        public async Task<List<UserScore>> GetTopThreeUserScores(string eventId)
        {
            var outputUserScoreList = new List<UserScore>();

            string userToScoreMappingKey = GetUserToScoreMappingKey(eventId);

            SortedSetEntry[] sortedSetEntriesByRank = await _redisDb.SortedSetRangeByRankWithScoresAsync(userToScoreMappingKey, 0, 2, Order.Descending);

            Console.WriteLine("UserIds: ");
            int currentRank = 1;
            foreach (var sortedSetEntry in sortedSetEntriesByRank)
            {
                Console.WriteLine("UserId: " + sortedSetEntry.Element.ToString() + " | Score: " + sortedSetEntry.Score);

                outputUserScoreList.Add(new UserScore() {
                    UserId = sortedSetEntry.Element.ToString(),
                    Score = (int)sortedSetEntry.Score,
                    Rank = currentRank
                });
                currentRank++;
            }

            return outputUserScoreList;
        }

        public async Task<long> IncrementScoreCount(string eventId, int score, int incrementAmount)
        {
            string key = GetScoreCountKey(eventId);

            long scoreCount = await _redisDb.HashIncrementAsync(key, score, incrementAmount);

            return scoreCount;
        }

        public async Task<List<UserScore>> GetThreeScoresAroundUser(string eventId, string userId)
        {
            Console.WriteLine("Starting GetThreeScoresAroundUser...");

            var outputUserScoreList = new List<UserScore>();

            string userToScoreMappingKey = GetUserToScoreMappingKey(eventId);
            var redisValueRank = await _redisDb.SortedSetRankAsync(userToScoreMappingKey, userId, Order.Descending);

            if (redisValueRank == null)
            {
                Console.WriteLine($"Failed to get rank for userId: {userId}");
                return new List<UserScore>();
            }

            Console.WriteLine($"GetThreeScoresAroundUser Rank: {redisValueRank.Value.ToString()}");

            int userRank = (int)redisValueRank.Value;
            int minRank = userRank - 1;
            int maxRank = userRank + 1;
            if (userRank < 1)
            {
                minRank = userRank;
            }

            SortedSetEntry[] sortedSetEntriesByRank = await _redisDb.SortedSetRangeByRankWithScoresAsync(userToScoreMappingKey, minRank, maxRank, Order.Descending);

            Console.WriteLine("UserIds: ");
            int currentRank = minRank + 1;
            foreach (var sortedSetEntry in sortedSetEntriesByRank)
            {
                Console.WriteLine("GetThreeScoresAroundUser UserId: " + sortedSetEntry.Element.ToString() + " | Score: " + sortedSetEntry.Score);

                outputUserScoreList.Add(new UserScore()
                {
                    UserId = sortedSetEntry.Element.ToString(),
                    Score = (int)sortedSetEntry.Score,
                    Rank = currentRank
                });
                currentRank++;
            }

            return outputUserScoreList;
        }

        public async Task<List<UserScore>> GetAllScores(string eventId)
        {
            string userToScoreMappingKey = GetUserToScoreMappingKey(eventId);

            SortedSetEntry[] sortedSetEntriesByRank = await _redisDb.SortedSetRangeByRankWithScoresAsync(userToScoreMappingKey, 0, -1, Order.Descending);

            var outputUserScoreList = new List<UserScore>();
            int currentRank = 1;
            foreach (var sortedSetEntry in sortedSetEntriesByRank)
            {
                outputUserScoreList.Add(new UserScore()
                {
                    UserId = sortedSetEntry.Element.ToString(),
                    Score = (int)sortedSetEntry.Score,
                    Rank = currentRank
                });
                currentRank++;
            }

            return outputUserScoreList;
        }
    }
}
