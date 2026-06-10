using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices.JavaScript;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Models.Market;
using IvsIdleGameShared.Repositories.Interfaces;
using IvsIdleGameShared.Services.Interfaces;
using PubnubApi;
using StackExchange.Redis;
using static System.Net.Mime.MediaTypeNames;

namespace IvsIdleGameShared.Services.Implementations
{
    public class BackLogEvent
    {
        public string Type { get; set; } = "";
        public string Payload { get; set; } = "";
    }

    public class RedisFanVisibilityService : IFanVisibilityService
    {
        private readonly IDatabase _redisDb;

        public RedisFanVisibilityService(IRedisDbProvider redisDbProvider)
        {
            _redisDb = redisDbProvider.database;
        }

        public string GetFanfareEventsRedisKeyFromVendorEventId(string vendorEventId)
        {
            return $"backlog-{vendorEventId}";
        }

        public string GetFansInTheStandsRedisKeyFromVendorEventId(string vendorEventId)
        {
            return $"fansInTheStands-{vendorEventId}";
        }

        public async Task<List<FanInTheStands>> GetFansInTheStands(string vendorEventId)
        {
            List<FanInTheStands> fansInTheStands = new List<FanInTheStands>();

            string key = GetFansInTheStandsRedisKeyFromVendorEventId(vendorEventId);

            HashEntry[] redisValues = await _redisDb.HashGetAllAsync(key);

            foreach (var redisValue in redisValues)
            {
                if (redisValue.Value.HasValue)
                {
                    string jsonString = redisValue.Value.ToString();

                    if (!String.IsNullOrEmpty(jsonString))
                    {
                        FanInTheStands? fanInTheStands = JsonSerializer.Deserialize<FanInTheStands>(jsonString);

                        if (fanInTheStands != null)
                        {
                            fansInTheStands.Add(fanInTheStands);
                        }
                    }
                }
            }

            return fansInTheStands;
        }

        public async Task<long> GetNumberOfGeneralAdmissionFansInTheStands(string vendorEventId)
        {
            List<FanInTheStands> fansInTheStands = await GetFansInTheStands(vendorEventId);

            long countOfGeneralAdmissionFans = 0;
            foreach (var fansInTheStand in fansInTheStands)
            {
                if (fansInTheStand.SeatScore == 0)
                {
                    countOfGeneralAdmissionFans++;
                }
            }

            return countOfGeneralAdmissionFans;
        }

        public async Task<long> GetNumberOfFansInTheStands(string vendorEventId)
        {
            string key = GetFansInTheStandsRedisKeyFromVendorEventId(vendorEventId);

            long numberOfFansInTheStands = await _redisDb.HashLengthAsync(key);

            return numberOfFansInTheStands;
        }

        public async Task<bool> AddFanInTheStand(string vendorEventId, FanInTheStands fanInTheStands)
        {
            string key = GetFansInTheStandsRedisKeyFromVendorEventId(vendorEventId);

            StackExchange.Redis.HashEntry[] hashEntriesToSet = new HashEntry[1];
            hashEntriesToSet[0] = new HashEntry(fanInTheStands.FanId, JsonSerializer.Serialize(fanInTheStands));

            await _redisDb.HashSetAsync(key, hashEntriesToSet);

            return true;
        }

        public async Task<bool> RemoveFanInTheStand(string vendorEventId, string fanId)
        {
            string key = GetFansInTheStandsRedisKeyFromVendorEventId(vendorEventId);

            await _redisDb.HashDeleteAsync(key, fanId);

            return true;
        }

        public async Task<bool> SendFanVisibilityEvent(string vendorEventId, string eventType, Object payloadObject)
        {
            string key = GetFanfareEventsRedisKeyFromVendorEventId(vendorEventId);

            string payloadJsonString = JsonSerializer.Serialize(payloadObject);
            byte[] payloadJsonStringBytes = Encoding.UTF8.GetBytes(payloadJsonString);
            string payloadBase64String = Convert.ToBase64String(payloadJsonStringBytes);

            BackLogEvent backlogEvent = new BackLogEvent()
            {
                Type = eventType,
                Payload = payloadBase64String
            };

            await _redisDb.ListLeftPushAsync(key, JsonSerializer.Serialize(backlogEvent));
            await _redisDb.KeyExpireAsync(key, TimeSpan.FromMinutes(180));

            return true;
        }

        public async Task<FanInTheStands?> GetFanInTheStands(string vendorEventId, string fanId)
        {
            string key = GetFansInTheStandsRedisKeyFromVendorEventId(vendorEventId);

            RedisValue redisValue = await _redisDb.HashGetAsync(key, fanId);

            if (redisValue.HasValue)
            {
                string jsonString = redisValue.ToString();

                if (!String.IsNullOrEmpty(jsonString))
                {
                    FanInTheStands? fanInTheStands = JsonSerializer.Deserialize<FanInTheStands>(jsonString);

                    if (fanInTheStands != null)
                    {
                        return fanInTheStands;
                    }
                    else
                    {
                        Console.WriteLine($"GetFanInTheStands - Failed to deserialize fanId {fanId}");
                    }
                }
                else
                {
                    Console.WriteLine($"GetFanInTheStands - jsonString empty for fanId {fanId}");
                }
            }
            else
            {
                Console.WriteLine($"GetFanInTheStands - Failed to get fanId {fanId} from Hash table");
            }

            {}

            return null;
        }
    }
}
