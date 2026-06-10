using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Repositories.Interfaces;
using PubnubApi;
using StackExchange.Redis;

namespace IvsIdleGameShared.Repositories.Implementations
{
    public class RedisQueueRepository : IQueueRepository
    {
        private readonly IDatabase _redisDb;

        public RedisQueueRepository(IRedisDbProvider redisDbProvider)
        {
            _redisDb = redisDbProvider.database;
        }

        private string GetBeginningOfLineKey(string queueId)
        {
            return $"queue-beginning-of-line-{queueId}";
        }

        private string GetEndOfLineKey(string queueId)
        {
            return $"queue-end-of-line-{queueId}";
        }

        private string GetUsersInLineKey(string queueId)
        {
            return $"queue-users-in-line-{queueId}";
        }

        private string GetUsersInLineByPositionKey(string queueId)
        {
            return $"queue-users-in-line-position-{queueId}";
        }

        public async Task<int> GetBeginningOfLine(string queueId)
        {
            string key = GetBeginningOfLineKey(queueId);

            RedisValue redisValue = await _redisDb.StringGetAsync(key);

            if (redisValue.HasValue)
            {
                if (int.TryParse(redisValue, out int outputBeginningOfLine))
                {
                    return outputBeginningOfLine;
                }
            }

            return -1;
        }

        public async Task<int> SetBeginningOfLine(string queueId, int newBeginningOfLine)
        {
            string key = GetBeginningOfLineKey(queueId);

            await _redisDb.StringSetAsync(key, newBeginningOfLine, expiry: TimeSpan.FromHours(24));

            return newBeginningOfLine;
        }

        public async Task<int> IncrementBeginningOfLine(string queueId, int incrementAmount)
        {
            string key = GetBeginningOfLineKey(queueId);

            int newBeginningOfLine = (int)await _redisDb.StringIncrementAsync(key, incrementAmount);
            await _redisDb.KeyExpireAsync(key, TimeSpan.FromHours(24));

            return newBeginningOfLine;
        }

        public async Task<int> GetEndOfLine(string queueId)
        {
            string key = GetEndOfLineKey(queueId);

            RedisValue redisValue = await _redisDb.StringGetAsync(key);

            if (redisValue.HasValue)
            {
                if (int.TryParse(redisValue, out int outputEndOfLine))
                {
                    return outputEndOfLine;
                }
            }

            return 0;
        }

        public async Task<int> IncrementEndOfLine(string queueId, int incrementAmount)
        {
            string key = GetEndOfLineKey(queueId);

            int newEndOfLine = (int)await _redisDb.StringIncrementAsync(key, incrementAmount);
            await _redisDb.KeyExpireAsync(key, TimeSpan.FromHours(24));

            return newEndOfLine;
        }

        public async Task<bool> AddUserToLine(string queueId, string userId, int placeInLine)
        {
            string key = GetUsersInLineKey(queueId);

            await _redisDb.HashSetAsync(key, userId, placeInLine);
            await _redisDb.KeyExpireAsync(key, TimeSpan.FromHours(24));

            string keyByPosition = GetUsersInLineByPositionKey(queueId);

            await _redisDb.HashSetAsync(keyByPosition, placeInLine, userId);
            await _redisDb.KeyExpireAsync(keyByPosition, TimeSpan.FromHours(24));

            return true;
        }

        public async Task<int> GetUserPlaceInLine(string queueId, string userId)
        {
            string key = GetUsersInLineKey(queueId);

            RedisValue redisValue = await _redisDb.HashGetAsync(key, userId);

            if (redisValue.HasValue)
            {
                if (int.TryParse(redisValue, out int outputPlaceInLine))
                {
                    return outputPlaceInLine;
                }
            }

            return -1;
        }

        public async Task<string> GetUserInPlaceInLine(string queueId, int placeInLine)
        {
            string keyByPosition = GetUsersInLineByPositionKey(queueId);

            RedisValue redisValue = await _redisDb.HashGetAsync(keyByPosition, placeInLine);

            if (redisValue.HasValue)
            {
                return redisValue.ToString();
            }

            return "";
        }
    }
}
