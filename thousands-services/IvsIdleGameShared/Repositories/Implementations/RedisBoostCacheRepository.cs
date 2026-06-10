using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Repositories.Interfaces;
using Microsoft.Extensions.Logging;
using PubnubApi;
using StackExchange.Redis;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Repositories.Implementations
{
    public class RedisBoostCacheRepository : IBoostCacheRepository
    {
        private readonly IDatabase _redisDb;

        public RedisBoostCacheRepository(IRedisDbProvider redisDbProvider)
        {
            _redisDb = redisDbProvider.database;
        }

        public string GetTotalBoostRedisKeyFromEventIdAndBoostName(string eventId, string boostName, string boostSegment)
        {
            return $"shared-boost-total-{eventId}-{boostSegment}-{boostName}";
        }

        public string GetTotalSpentRedisKeyFromEventIdAndBoostName(string eventId, string boostName, string boostSegment)
        {
            return $"shared-spent-total-{eventId}-{boostSegment}-{boostName}";
        }

        public string GetSharedBoostComboMultiplierRedisKeyFromEventIdAndBoostName(string eventId, string boostName, string boostSegment)
        {
            return $"shared-boost-combo-{eventId}-{boostSegment}-{boostName}";
        }

        public string GetPersonalBoostProgressRedisKeyFromEventIdUserIdAndBoostName(string eventId, string userId, string boostName, string boostSegment)
        {
            return $"personal-boost-progress-{eventId}-{boostSegment}-{userId}-{boostName}";
        }

        public string GetPersonalProgressStartTimeRedisKeyFromEventIdUserId(string eventId, string userId, string boostName, string boostSegment)
        {
            return $"personal-boost-start-time-{eventId}-{boostSegment}-{userId}-{boostName}";
        }

        public string GetPersonalProgressTotalDelayTimeRedisKeyFromEventIdUserId(string eventId, string userId, string boostName, string boostSegment)
        {
            return $"personal-boost-delay-time-{eventId}-{boostSegment}-{userId}-{boostName}";
        }

        public string GetLastTriggeredEffectTimeRedisKeyFromEventIdUserId(string eventId, string boostSegment)
        {
            return $"shared-last-triggered-effect-time-{eventId}-{boostSegment}";
        }
        
        public async Task<int> GetSharedBoostComboMultiplier(string eventId, string boostName, string boostSegment)
        {
            string key = GetSharedBoostComboMultiplierRedisKeyFromEventIdAndBoostName(eventId, boostName, boostSegment);

            RedisValue redisValue = await _redisDb.StringGetAsync(key);

            if (redisValue.HasValue)
            {
                string stringValue = redisValue.ToString();

                if (!string.IsNullOrEmpty(stringValue) && Int32.TryParse(stringValue, out int intValue))
                {
                    return intValue;
                }
            }

            return 0;
        }

        public async Task<int> IncrementSharedBoostComboMultiplier(string eventId, string boostName, string boostSegment, int incrementAmount)
        {
            string key = GetSharedBoostComboMultiplierRedisKeyFromEventIdAndBoostName(eventId, boostName, boostSegment);

            int newTotal = (int)await _redisDb.StringIncrementAsync(key, incrementAmount);

            return newTotal;
        }

        public async Task<int> GetPersonalBoostProgress(string eventId, string userId, string boostName, string boostSegment)
        {
            string key = GetPersonalBoostProgressRedisKeyFromEventIdUserIdAndBoostName(eventId, userId, boostName, boostSegment);

            RedisValue redisValue = await _redisDb.StringGetAsync(key);

            if (redisValue.HasValue)
            {
                string stringValue = redisValue.ToString();

                if (!string.IsNullOrEmpty(stringValue) && Int32.TryParse(stringValue, out int intValue))
                {
                    return intValue;
                }
            }

            return 0;
        }

        public async Task<bool> IncrementPersonalBoostProgress(string eventId, string userId, string boostName, string boostSegment, int incrementProgressAmount)
        {
            string key = GetPersonalBoostProgressRedisKeyFromEventIdUserIdAndBoostName(eventId, userId, boostName, boostSegment);

            await _redisDb.StringIncrementAsync(key, incrementProgressAmount);

            return true;
        }

        public async Task<int> GetTotalBoost(string eventId, string boostName, string boostSegment)
        {
            string key = GetTotalBoostRedisKeyFromEventIdAndBoostName(eventId, boostName, boostSegment);

            RedisValue redisValue = await _redisDb.StringGetAsync(key);

            if (redisValue.HasValue)
            {
                string stringValue = redisValue.ToString();

                if (!string.IsNullOrEmpty(stringValue) && Int32.TryParse(stringValue, out int intValue))
                {
                    return intValue;
                }
            }

            return 0;
        }

        public async Task<bool> IncrementTotalBoosts(string eventId, string boostName, string boostSegment, int incrementTotalAmount)
        {
            string key = GetTotalBoostRedisKeyFromEventIdAndBoostName(eventId, boostName, boostSegment);

            await _redisDb.StringIncrementAsync(key, incrementTotalAmount);

            return true;
        }

        public async Task<long> GetPersonalProgressStartTime(string eventId, string userId, string boostName, string boostSegment)
        {
            string key = GetPersonalProgressStartTimeRedisKeyFromEventIdUserId(eventId, userId, boostName, boostSegment);

            RedisValue redisValue = await _redisDb.StringGetAsync(key);

            if (redisValue.HasValue)
            {
                string stringValue = redisValue.ToString();

                if (!string.IsNullOrEmpty(stringValue) && long.TryParse(stringValue, out long longValue))
                {
                    return longValue;
                }
            }

            return 0;
        }

        public async Task<bool> SetPersonalProgressStartTime(string eventId, string userId, string boostName, string boostSegment, long startTime)
        {
            string key = GetPersonalProgressStartTimeRedisKeyFromEventIdUserId(eventId, userId, boostName, boostSegment);

            await _redisDb.StringSetAsync(key, startTime);

            return true;
        }

        public async Task<int> GetPersonalProgressTotalDelayTime(string eventId, string userId, string boostName, string boostSegment)
        {
            string key = GetPersonalProgressTotalDelayTimeRedisKeyFromEventIdUserId(eventId, userId, boostName, boostSegment);

            RedisValue redisValue = await _redisDb.StringGetAsync(key);

            if (redisValue.HasValue)
            {
                string stringValue = redisValue.ToString();

                if (!string.IsNullOrEmpty(stringValue) && Int32.TryParse(stringValue, out int intValue))
                {
                    return intValue;
                }
            }

            return 0;
        }

        public async Task<bool> SetPersonalProgressTotalDelayTime(string eventId, string userId, string boostName, string boostSegment, int newDelayAmount)
        {
            string key = GetPersonalProgressTotalDelayTimeRedisKeyFromEventIdUserId(eventId, userId, boostName, boostSegment);

            await _redisDb.StringSetAsync(key, newDelayAmount);

            return true;
        }

        public async Task<bool> IncrementPersonalProgressTotalDelayTime(string eventId, string userId, string boostName, string boostSegment, int incrementDelayAmount)
        {
            string key = GetPersonalProgressTotalDelayTimeRedisKeyFromEventIdUserId(eventId, userId, boostName, boostSegment);

            await _redisDb.StringIncrementAsync(key, incrementDelayAmount);

            return true;
        }

        public async Task<int> GetTotalSpent(string eventId, string boostName, string boostSegment)
        {
            string key = GetTotalSpentRedisKeyFromEventIdAndBoostName(eventId, boostName, boostSegment);

            RedisValue redisValue = await _redisDb.StringGetAsync(key);

            if (redisValue.HasValue)
            {
                string stringValue = redisValue.ToString();

                if (!string.IsNullOrEmpty(stringValue) && Int32.TryParse(stringValue, out int intValue))
                {
                    return intValue;
                }
            }

            return 0;
        }

        public async Task<bool> IncrementTotalSpent(string eventId, string boostName, string boostSegment, int incrementSpentAmount)
        {
            string key = GetTotalSpentRedisKeyFromEventIdAndBoostName(eventId, boostName, boostSegment);

            await _redisDb.StringIncrementAsync(key, incrementSpentAmount);

            return true;
        }

        public async Task<long> GetLastTriggeredEffectTime(string eventId, string boostSegment)
        {
            string key = GetLastTriggeredEffectTimeRedisKeyFromEventIdUserId(eventId, boostSegment);

            RedisValue redisValue = await _redisDb.StringGetAsync(key);

            if (redisValue.HasValue)
            {
                string stringValue = redisValue.ToString();

                if (!string.IsNullOrEmpty(stringValue) && long.TryParse(stringValue, out long longValue))
                {
                    return longValue;
                }
            }

            return 0;
        }

        public async Task<bool> SetLastTriggeredEffectTime(string eventId, string boostSegment, long newTime)
        {
            string key = GetLastTriggeredEffectTimeRedisKeyFromEventIdUserId(eventId, boostSegment);

            await _redisDb.StringSetAsync(key, newTime);

            return true;
        }
    }
}
