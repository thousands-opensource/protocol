using System;
using System.Text.Json;
using IvsIdleGameShared.Models.Skybox;
using IvsIdleGameShared.Repositories.Interfaces;
using StackExchange.Redis;

namespace IvsIdleGameShared.Repositories.Implementations;

public class RedisSkyboxCache : ISkyboxCache
{

    private readonly IDatabase _redisDb;

    private string GetStoredSkyboxInviteKey(Guid skyboxInviteGuid)
    {
        return $"skybox-{skyboxInviteGuid}";
    }

    private string GetSkyboxUserIdToSkyboxIdKey(string stageId, string userId)
    {
        return $"skybox-userid-to-skyboxid-{stageId}-{userId}";
    }

    private string GetSkyboxesPurchasedLatchKey(string stageId)
    {
        return $"skyboxes-purchased-{stageId}";
    }

    public RedisSkyboxCache(IRedisDbProvider redisDbProvider)
    {
        _redisDb = redisDbProvider.database;
    }
    public async Task<SkyboxInvite?> GetSkyboxInvite(Guid skyboxInviteGuid)
    {
        try
        {
            string key = GetStoredSkyboxInviteKey(skyboxInviteGuid);
            RedisValue redisValue = await _redisDb.StringGetAsync(key);
            if (redisValue.HasValue)
            {
                string jsonString = redisValue.ToString();

                if (!String.IsNullOrEmpty(jsonString))
                {
                    SkyboxInvite? skyboxInvite = JsonSerializer.Deserialize<SkyboxInvite>(jsonString);

                    if (skyboxInvite != null)
                    {
                        return skyboxInvite;
                    }
                }
            }

            return null;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error getting skybox invite: {ex.Message}");
            return null;
        }
    }

    public async Task<bool> RemoveSkyboxInvite(Guid skyboxInviteGuid)
    {
        try
        {
            string key = GetStoredSkyboxInviteKey(skyboxInviteGuid);
            return await _redisDb.KeyDeleteAsync(key);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error removing skybox invite: {ex.Message}");
            return false;
        }
    }

    public async Task<bool> StoreSkyboxInvite(SkyboxInvite skyboxInvite)
    {
        try
        {
            Guid inviteGuid = skyboxInvite.Id;
            string key = GetStoredSkyboxInviteKey(inviteGuid);
            string jsonString = JsonSerializer.Serialize(skyboxInvite);

            // @todo - update expiry time (test: 10min)
            return await _redisDb.StringSetAsync(key, jsonString, expiry: TimeSpan.FromMinutes(10));
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error storing skybox invite: {ex.Message}");
            return false;
        }
    }

    public async Task<bool> AddUserIdToSkyboxId(string stageId, string userId, string skyboxId, int skyboxTier)
    {
        try
        {
            string key = GetSkyboxUserIdToSkyboxIdKey(stageId, userId);

            var skyboxIdAndTier = new SkyboxIdAndTier
            {
                SkyboxId = skyboxId,
                SkyboxTier = skyboxTier
            };

            string skyboxIdAndTierJsonString = JsonSerializer.Serialize(skyboxIdAndTier);

            return await _redisDb.StringSetAsync(key, skyboxIdAndTierJsonString, expiry: TimeSpan.FromHours(24));
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error storing UserIdToSkyboxId: {ex.Message}");
            return false;
        }
    }

    //Get the SkyboxId from the UserId.  Return null if the user isn't in a skybox.
    public async Task<SkyboxIdAndTier?> GetSkyboxIdFromUserId(string stageId, string userId)
    {
        try
        {
            string key = GetSkyboxUserIdToSkyboxIdKey(stageId, userId);
            RedisValue redisValue = await _redisDb.StringGetAsync(key);
            if (redisValue.HasValue)
            {
                string jsonString = redisValue.ToString();

                if (!String.IsNullOrEmpty(jsonString))
                {
                    SkyboxIdAndTier? skyboxIdAndTier = JsonSerializer.Deserialize<SkyboxIdAndTier>(jsonString);

                    if (skyboxIdAndTier != null)
                    {
                        return skyboxIdAndTier;
                    }

                    Console.WriteLine("GetSkyboxIdFromUserId Deserialize returned null!");
                }
            }

            return null;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error getting UserIdToSkyboxId: {ex.Message}");
            return null;
        }
    }

    public async Task<bool> StartSkyboxPurchaseLatch(string stageId, string userId)
    {
        try
        {
            string key = GetSkyboxesPurchasedLatchKey(stageId);

            await _redisDb.ListRightPushAsync(key, userId);

            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error starting skybox purchase latch: {ex.Message}");
            return false;
        }
    }

    public async Task<long?> GetSkyboxPurchaseLatchRank(string stageId, string userId)
    {
        try
        {
            string key = GetSkyboxesPurchasedLatchKey(stageId);

            return await _redisDb.ListPositionAsync(key, userId);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error starting skybox purchase latch: {ex.Message}");
            return null;
        }
    }

    public async Task<bool> FailedToPurchaseSkyboxLatch(string stageId, string userId)
    {
        var key = GetSkyboxesPurchasedLatchKey(stageId);

        Console.WriteLine($"ThousandsInfo: FailedToPurchaseSkyboxLatch - stageId: {stageId}, userId: {userId}");

        await _redisDb.ListRemoveAsync(key, userId);

        return true;
    }

}
