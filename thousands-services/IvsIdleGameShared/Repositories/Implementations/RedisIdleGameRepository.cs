using System.Data.Common;
using System.Text.Json;
using Amazon.IVSRealTime.Model;
using Amazon.Runtime;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Repositories.Interfaces;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using PubnubApi.EventEngine.Core;
using StackExchange.Redis;

namespace IvsIdleGameShared.Repositories.Implementations
{
    public class RedisIdleGameRepository : IIdleGameRepository
    {
        private readonly ConfigurationOptions _redisConfigurationOptions;
        private ConnectionMultiplexer? redis;

        public RedisIdleGameRepository(IRedisSettings redisSettings)
        {
            _redisConfigurationOptions = new ConfigurationOptions()
            {
                EndPoints = { { redisSettings.EndPoint ?? "", redisSettings.Port } },
                Password = redisSettings.Password,
                User = redisSettings.User,
                Ssl = false,
                SslProtocols = System.Security.Authentication.SslProtocols.Tls12
            };
        }

        public IDatabase ConnectToRedis()
        {
            redis = ConnectionMultiplexer.Connect(_redisConfigurationOptions);
            return redis.GetDatabase();
        }

        public string GetSharedEventsRedisKeyFromStreamIdAndChatActionId(string eventId, string chatActionId)
        {
            return $"shared-event-{eventId}-{chatActionId}";
        }

        public string GetSharedEventUsersRedisKeyFromStreamIdChatActionIdAndOption(string eventId, string chatActionId, string option)
        {
            return $"shared-event-users-{eventId}-{chatActionId}-{option}";
        }

        public string GetIdleEventsRedisKeyFromStreamIdAndUserId(string eventId, string userId)
        {
            return $"idle-events-{eventId}-{userId}";
        }

        public string GetEventMatchRedisKey(string vendorEventId, string matchId)
        {
            return $"idle-event-match-{vendorEventId}-{matchId}";
        }

        public string GetEventMatchRedisKeyByVendorEventId(string vendorEventId)
        {
            return $"idle-event-match-{vendorEventId}";
        }

        public string GetEventMatchRedisKeyByStageId(string stageId)
        {
            return $"idle-event-match-{stageId}";
        }

        public string GetRolledUpPersonalCreditsRedisKeyFromStreamIdAndUserId(string eventId, string userId)
        {
            return $"idle-personal-credits-{eventId}-{userId}";
        }

        public string GetUserInventoryRedisKey(string userId)
        {
            return $"idle-user-inventory-{userId}";
        }

        public string GetEquippedItemsRedisKey(string userId)
        {
            return $"idle-user-equipped-{userId}";
        }

        public string GetPlayerLevelRedisKey(string userId)
        {
            return $"idle-user-level-{userId}";
        }

        public string GetEventStreamScoreRedisKey(string eventId)
        {
            return $"idle-event-stream-score-{eventId}";
        }

        public async Task<bool> AddSharedEvent(string eventId, IdleEvent idleEvent)
        {
            var db = ConnectToRedis();

            string chatActionId = idleEvent.ChatActionGuid.ToString();

            string key = GetSharedEventsRedisKeyFromStreamIdAndChatActionId(eventId, chatActionId);

            await db.StringSetAsync(key, JsonSerializer.Serialize(idleEvent), expiry: TimeSpan.FromMinutes(5));

            if (redis != null)
            {
                _ = redis.DisposeAsync();
            }

            return true;
        }

        public async Task<IdleEvent?> GetSharedEvent(string eventId, string chatActionId)
        {
            var db = ConnectToRedis();

            string key = GetSharedEventsRedisKeyFromStreamIdAndChatActionId(eventId, chatActionId);

            RedisValue redisValue = await db.StringGetAsync(key);

            if (redisValue.HasValue)
            {
                string jsonString = redisValue.ToString();

                if (!String.IsNullOrEmpty(jsonString))
                {
                    IdleEvent? idleEvent = JsonSerializer.Deserialize<IdleEvent>(jsonString);

                    if (idleEvent != null)
                    {
                        if (redis != null)
                        {
                            _ = redis.DisposeAsync();
                        }

                        return idleEvent;
                    }
                }
            }

            if (redis != null)
            {
                _ = redis.DisposeAsync();
            }

            return null;
        }

        public async Task<bool> AddPlayerToSharedEvent(string eventId, string userId, string chatActionId, string option)
        {
            var db = ConnectToRedis();

            string key = GetSharedEventUsersRedisKeyFromStreamIdChatActionIdAndOption(eventId, chatActionId, option);

            await db.ListLeftPushAsync(key, userId);
            await db.KeyExpireAsync(key, TimeSpan.FromMinutes(4));

            if (redis != null)
            {
                _ = redis.DisposeAsync();
            }

            return true;
        }

        public async Task<string[]> GetPlayersFromSharedEventOption(string eventId, string chatActionId, string option)
        {
            var db = ConnectToRedis();

            string key = GetSharedEventUsersRedisKeyFromStreamIdChatActionIdAndOption(eventId, chatActionId, option);

            RedisValue[] redisValues = await db.ListRangeAsync(key);

            if (redis != null)
            {
                _ = redis.DisposeAsync();
            }

            string[] usersWhoChoseThisOption = new string[redisValues.Length];
            for (int userIndex = 0; userIndex < redisValues.Length; userIndex++)
            {
                RedisValue redisValue = redisValues[userIndex];
                usersWhoChoseThisOption[userIndex] = redisValue.ToString();
            }

            return usersWhoChoseThisOption;
        }

        public async Task<bool> AddEventForPlayer(string eventId, string userId, IdleEvent idleEvent)
        {
            var db = ConnectToRedis();

            string key = GetIdleEventsRedisKeyFromStreamIdAndUserId(eventId, userId);

            await db.ListLeftPushAsync(key, JsonSerializer.Serialize(idleEvent));
            await db.KeyExpireAsync(key, TimeSpan.FromHours(24));

            if (redis != null)
            {
                _ = redis.DisposeAsync();
            }

            return true;
        }

        public async Task<bool> RemoveEventsForPlayer(string eventId, string userId, List<IdleEvent> idleEventsToRemove)
        {
            var db = ConnectToRedis();

            string key = GetIdleEventsRedisKeyFromStreamIdAndUserId(eventId, userId);

            foreach (var idleEventToRemove in idleEventsToRemove)
            {
                await db.ListRemoveAsync(key, JsonSerializer.Serialize(idleEventToRemove));
            }

            if (redis != null)
            {
                _ = redis.DisposeAsync();
            }

            return true;
        }

        public async Task<bool> RemoveAllEventsForPlayer(string eventId, string userId)
        {
            var db = ConnectToRedis();

            string key = GetIdleEventsRedisKeyFromStreamIdAndUserId(eventId, userId);

            _ = await db.KeyDeleteAsync(key);

            if (redis != null)
            {
                _ = redis.DisposeAsync();
            }

            return true;
        }

        public async Task<List<IdleEvent>> GetEventsForPlayer(string eventId, string userId)
        {
            var db = ConnectToRedis();

            string key = GetIdleEventsRedisKeyFromStreamIdAndUserId(eventId, userId);

            var idleEventReidisValues = await db.ListRangeAsync(key, 0, -1);

            List<IdleEvent> events = new List<IdleEvent>();
            foreach (var redisValue in idleEventReidisValues)
            {
                if (redisValue.IsNullOrEmpty)
                {
                    continue;
                }

                try
                {
                    IdleEvent? idleEvent = JsonSerializer.Deserialize<IdleEvent>(redisValue.ToString());
                    if (idleEvent != null)
                    {
                        events.Add(idleEvent);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"RedisIdleGameRepository: GetEventsForPlayer - Error deserializing IdleEvent: {ex.ToString()}");
                }
            }

            if (redis != null)
            {
                _ = redis.DisposeAsync();
            }

            return events;
        }

        public async Task<bool> AddEventMatch(string vendorEventId, EventMatch eventMatch, string stageId)
        {
            var db = ConnectToRedis();

            string eventMatchRedisKeyByVendorEventIdAndSegmentId = GetEventMatchRedisKeyByVendorEventId(vendorEventId);
            string eventMatchRedisKeyByStageIdAndSegmentId = GetEventMatchRedisKeyByStageId(stageId);

            await db.StringSetAsync(eventMatchRedisKeyByVendorEventIdAndSegmentId, JsonSerializer.Serialize(eventMatch), expiry: TimeSpan.FromHours(24));
            await db.StringSetAsync(eventMatchRedisKeyByStageIdAndSegmentId, JsonSerializer.Serialize(eventMatch), expiry: TimeSpan.FromHours(24));

            if (redis != null)
            {
                _ = redis.DisposeAsync();
            }

            return true;
        }

        public async Task<EventMatch?> GetEventMatchFromVendorEventId(string vendorEventId)
        {
            var db = ConnectToRedis();

            string key = GetEventMatchRedisKeyByVendorEventId(vendorEventId);

            RedisValue redisValue = await db.StringGetAsync(key);

            if (redisValue.HasValue)
            {
                string jsonString = redisValue.ToString();

                if (!String.IsNullOrEmpty(jsonString))
                {
                    EventMatch? eventMatch = JsonSerializer.Deserialize<EventMatch>(jsonString);

                    if (eventMatch != null)
                    {
                        if (redis != null)
                        {
                            _ = redis.DisposeAsync();
                        }

                        return eventMatch;
                    }
                }
            }

            if (redis != null)
            {
                _ = redis.DisposeAsync();
            }

            return null;
        }

        public async Task<EventMatch?> GetEventMatchFromStageId(string stageId)
        {
            var db = ConnectToRedis();

            string key = GetEventMatchRedisKeyByStageId(stageId);

            RedisValue redisValue = await db.StringGetAsync(key);

            if (redisValue.HasValue)
            {
                string jsonString = redisValue.ToString();

                if (!String.IsNullOrEmpty(jsonString))
                {
                    EventMatch? eventMatch = JsonSerializer.Deserialize<EventMatch>(jsonString);

                    if (eventMatch != null)
                    {
                        if (redis != null)
                        {
                            _ = redis.DisposeAsync();
                        }

                        return eventMatch;
                    }
                }
            }

            if (redis != null)
            {
                _ = redis.DisposeAsync();
            }

            return null;
        }

        public async Task RemoveEventMatch(string vendorEventId)
        {
            var db = ConnectToRedis();

            var eventMatch = await GetEventMatchFromVendorEventId(vendorEventId);

            if (eventMatch != null)
            {
                string stageId = eventMatch.EventId;

                string eventMatchRedisKeyByVendorEventIdAndSegmentId = GetEventMatchRedisKeyByVendorEventId(vendorEventId);
                string eventMatchRedisKeyByStageIdAndSegmentId = GetEventMatchRedisKeyByStageId(stageId);

                await db.KeyDeleteAsync(eventMatchRedisKeyByVendorEventIdAndSegmentId);
                await db.KeyDeleteAsync(eventMatchRedisKeyByStageIdAndSegmentId);
            }
        }


        public async Task<int> GetRolledUpPersonalCredits(string eventId, string userId)
        {
            int rolledUpPersonalCredits = 0;

            var db = ConnectToRedis();

            string key = GetRolledUpPersonalCreditsRedisKeyFromStreamIdAndUserId(eventId, userId);

            RedisValue redisValue = await db.StringGetAsync(key);

            if (!redisValue.HasValue)
                return 0;

            Console.WriteLine($"GetRolledUpPersonalCredits RedisValue: {redisValue}");
            rolledUpPersonalCredits = int.Parse(redisValue.ToString());

            if (redis != null)
            {
                _ = redis.DisposeAsync();
            }

            return rolledUpPersonalCredits;
        }

        public async Task<bool> IncrementRolledUpPersonalCredits(string eventId, string userId, decimal incrementAmount)
        {
            var db = ConnectToRedis();

            string key = GetRolledUpPersonalCreditsRedisKeyFromStreamIdAndUserId(eventId, userId);

            await db.StringIncrementAsync(key, (long)incrementAmount);
            await db.KeyExpireAsync(key, TimeSpan.FromHours(24));

            if (redis != null)
            {
                _ = redis.DisposeAsync();
            }

            return true;
        }

        public async Task<bool> AddItemToUserInventory(string userId, string itemName)
        {
            var db = ConnectToRedis();

            string key = GetUserInventoryRedisKey(userId);

            await db.ListLeftPushAsync(key, itemName);
            await db.KeyExpireAsync(key, TimeSpan.FromHours(24));

            if (redis != null)
            {
                _ = redis.DisposeAsync();
            }

            return true;
        }

        public async Task<string[]> GetItemsInUserInventory(string userId)
        {
            List<string> items = new List<string>();

            var db = ConnectToRedis();

            string key = GetUserInventoryRedisKey(userId);

            RedisValue[] redisValues = await db.ListRangeAsync(key);

            if (redis != null)
            {
                _ = redis.DisposeAsync();
            }

            foreach (var redisValue in redisValues)
            {
                if (redisValue.IsNullOrEmpty)
                {
                    continue;
                }

                items.Add(redisValue.ToString());
            }

            return items.ToArray();
        }

        public async Task<bool> EquipItemForUser(string userId, string itemName)
        {
            var db = ConnectToRedis();

            string key = GetEquippedItemsRedisKey(userId);

            await db.SetAddAsync(key, itemName);
            await db.KeyExpireAsync(key, TimeSpan.FromHours(24));

            if (redis != null)
            {
                _ = redis.DisposeAsync();
            }

            return true;
        }

        public async Task<bool> UnEquipItemForUser(string userId, string itemName)
        {
            var db = ConnectToRedis();

            string key = GetEquippedItemsRedisKey(userId);

            await db.SetRemoveAsync(key, itemName);

            if (redis != null)
            {
                _ = redis.DisposeAsync();
            }

            return true;
        }

        public async Task<string[]> GetEquippedItemsForUser(string userId)
        {
            List<string> items = new List<string>();

            var db = ConnectToRedis();

            string key = GetEquippedItemsRedisKey(userId);

            RedisValue[] redisValues = await db.SetMembersAsync(key);

            if (redis != null)
            {
                _ = redis.DisposeAsync();
            }

            foreach (var redisValue in redisValues)
            {
                if (redisValue.IsNullOrEmpty)
                {
                    continue;
                }

                items.Add(redisValue.ToString());
            }

            return items.ToArray();
        }

        public async Task<int> GetPlayerLevel(string userId)
        {
            int playerLevel = 1;

            var db = ConnectToRedis();

            string key = GetPlayerLevelRedisKey(userId);

            RedisValue redisValue = await db.StringGetAsync(key);

            if (!redisValue.HasValue)
                return 0;

            playerLevel = int.Parse(redisValue.ToString());

            if (redis != null)
            {
                _ = redis.DisposeAsync();
            }

            return playerLevel;
        }

        public async Task<bool> SetPlayerLevel(string userId, int level)
        {
            var db = ConnectToRedis();

            string key = GetPlayerLevelRedisKey(userId);

            await db.StringSetAsync(key, level);
            await db.KeyExpireAsync(key, TimeSpan.FromHours(24));

            if (redis != null)
            {
                _ = redis.DisposeAsync();
            }

            return true;
        }

        public async Task<long> GetStreamScore(string eventId)
        {
            int streamScore = 1;

            var db = ConnectToRedis();

            string key = GetEventStreamScoreRedisKey(eventId);

            RedisValue redisValue = await db.StringGetAsync(key);

            if (!redisValue.HasValue)
                return 0;

            streamScore = int.Parse(redisValue.ToString());

            if (redis != null)
            {
                _ = redis.DisposeAsync();
            }

            return streamScore;
        }

        public async Task<long> IncrementStreamScore(string eventId, int incrementAmount)
        {
            var db = ConnectToRedis();

            string key = GetEventStreamScoreRedisKey(eventId);

            long updatedStreamScore = await db.StringIncrementAsync(key, (long)incrementAmount);
            await db.KeyExpireAsync(key, TimeSpan.FromHours(24));

            if (redis != null)
            {
                _ = redis.DisposeAsync();
            }

            return updatedStreamScore;
            ;
        }
    }
}
