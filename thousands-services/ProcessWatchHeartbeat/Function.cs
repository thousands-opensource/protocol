using Amazon.Lambda.Core;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Models.ExternalStreams;
using IvsIdleGameShared.Repositories.Implementations;
using IvsIdleGameShared.Repositories.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using MongoDB.Bson;
using StackExchange.Redis;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace ProcessWatchHeartbeat;

public class Function
{
    private const string WatchSessionKeyPrefix = "watch:sess:";
    private const string ActiveSessionsSetKey = "watch:sess:active";
    private readonly IDatabase _redisDb;
    private readonly IUserExternalStreamWatchMinutesRepository _watchMinutesRepository;

    public Function()
    {
        string? redisEndpointEnvironmentVar =
            Environment.GetEnvironmentVariable("WATCH_HEARTBEAT_REDIS_ENDPOINT");

        if (string.IsNullOrEmpty(redisEndpointEnvironmentVar))
        {
            Console.WriteLine("WATCH_HEARTBEAT_REDIS_ENDPOINT Environment Variable is not set!");
        }

        string? redisPortEnvironmentVar =
            Environment.GetEnvironmentVariable("WATCH_HEARTBEAT_REDIS_PORT");

        int redisPort = 0;
        if (!string.IsNullOrEmpty(redisPortEnvironmentVar))
        {
            redisPort = int.Parse(redisPortEnvironmentVar);
        }
        else
        {
            Console.WriteLine("WATCH_HEARTBEAT_REDIS_PORT Environment Variable is not set!");
        }

        string? redisPasswordEnvironmentVar =
            Environment.GetEnvironmentVariable("WATCH_HEARTBEAT_REDIS_PASSWORD");

        if (string.IsNullOrEmpty(redisPasswordEnvironmentVar))
        {
            Console.WriteLine("WATCH_HEARTBEAT_REDIS_PASSWORD Environment Variable is not set!");
        }

        string? redisUserEnvironmentVar =
            Environment.GetEnvironmentVariable("WATCH_HEARTBEAT_REDIS_USER");

        if (string.IsNullOrEmpty(redisUserEnvironmentVar))
        {
            Console.WriteLine("WATCH_HEARTBEAT_REDIS_USER Environment Variable is not set!");
        }

        string? streamRepositoryConnectionUriEnvironmentVar =
            Environment.GetEnvironmentVariable("STREAM_REPOSITORY_CONNECTION_URI");

        if (string.IsNullOrWhiteSpace(streamRepositoryConnectionUriEnvironmentVar))
        {
            Console.WriteLine("STREAM_REPOSITORY_CONNECTION_URI Environment Variable is not set!");
        }

        string? streamRepositoryDatabaseNameEnvironmentVar =
            Environment.GetEnvironmentVariable("STREAM_REPOSITORY_DATABASE_NAME");

        if (string.IsNullOrWhiteSpace(streamRepositoryDatabaseNameEnvironmentVar))
        {
            Console.WriteLine("STREAM_REPOSITORY_DATABASE_NAME Environment Variable is not set!");
        }

        var serviceCollection = new ServiceCollection();
        serviceCollection.AddSingleton<IRedisSettings>(x => new RedisSettings()
        {
            EndPoint = redisEndpointEnvironmentVar,
            Port = redisPort,
            Password = redisPasswordEnvironmentVar,
            User = redisUserEnvironmentVar,
        });
        serviceCollection.AddSingleton<IMongoDbSettings>(x => new MongoDbSettings()
        {
            ConnectionUri = streamRepositoryConnectionUriEnvironmentVar,
            DatabaseName = streamRepositoryDatabaseNameEnvironmentVar,
            UserExternalStreamWatchMinutesCollectionName = "user-external-streams-watch-minutes"
        });
        serviceCollection.AddSingleton<IRedisDbProvider, RedisDbProvider>();
        serviceCollection.AddSingleton<IUserExternalStreamWatchMinutesRepository, MongoUserExternalStreamWatchMinutesRepository>();

        var services = serviceCollection.BuildServiceProvider();
        _redisDb = services.GetRequiredService<IRedisDbProvider>().database;
        _watchMinutesRepository = services.GetRequiredService<IUserExternalStreamWatchMinutesRepository>();
    }

    /// <summary>
    /// Periodically processes watch sessions from Redis and records watch minutes to MongoDB.
    /// </summary>
    /// <param name="input">The event for the Lambda function handler to process.</param>
    /// <param name="context">The ILambdaContext that provides methods for logging and describing the Lambda environment.</param>
    public async Task<object> FunctionHandler(object input, ILambdaContext context)
    {
        var now = DateTimeOffset.UtcNow;
        long nowMs = now.ToUnixTimeMilliseconds();
        int processedSessions = 0;
        int totalMinutes = 0;

        RedisValue[] activeSessionKeys = await _redisDb.SetMembersAsync(ActiveSessionsSetKey);
        foreach (var keyValue in activeSessionKeys)
        {
            if (!keyValue.HasValue)
            {
                continue;
            }

            RedisKey key = (RedisKey)keyValue.ToString();
            if (!key.ToString().StartsWith(WatchSessionKeyPrefix, StringComparison.Ordinal))
            {
                continue;
            }

            HashEntry[] entries = await _redisDb.HashGetAllAsync(key);
            if (entries.Length == 0)
            {
                await _redisDb.SetRemoveAsync(ActiveSessionsSetKey, (RedisValue)key.ToString());
                continue;
            }

            var map = entries.ToDictionary(e => e.Name.ToString(), e => e.Value);

            string? userId = GetString(map, "u");
            string? streamId = GetString(map, "s");
            long? startMs = GetLong(map, "st");
            long? lastSeenMs = GetLong(map, "ls");
            if (string.IsNullOrWhiteSpace(userId) ||
                string.IsNullOrWhiteSpace(streamId) ||
                startMs == null ||
                lastSeenMs == null)
            {
                context.Logger.LogLine($"Skipping {key}: missing required fields.");
                await _redisDb.SetRemoveAsync(ActiveSessionsSetKey, (RedisValue)key.ToString());
                continue;
            }

            long lastProcessedMs = GetLong(map, "lp") ?? startMs.Value;
            long processUntilMs = Math.Min(lastSeenMs.Value, nowMs);

            if (processUntilMs <= lastProcessedMs)
            {
                continue;
            }

            int? isViewing = GetInt(map, "v");
            if (isViewing.HasValue && isViewing.Value == 0)
            {
                await _redisDb.HashSetAsync(key, new[] { new HashEntry("lp", processUntilMs) });
                await _redisDb.SetRemoveAsync(ActiveSessionsSetKey, (RedisValue)key.ToString());
                continue;
            }

            long deltaMs = processUntilMs - lastProcessedMs;
            int minutes = (int)(deltaMs / 60000L);
            if (minutes <= 0)
            {
                continue;
            }

            long newLastProcessedMs = lastProcessedMs + (minutes * 60000L);
            int totalMinutesForSession = (int)((newLastProcessedMs - startMs.Value) / 60000L);
            var watchMinutes = new UserExternalStreamWatchMinutes
            {
                Id = ObjectId.GenerateNewId().ToString()!,
                UserId = userId,
                ExternalStreamId = streamId,
                SessionId = GetSessionIdFromKey(key),
                MinutesWatched = totalMinutesForSession,
                PeriodStartUtc = DateTimeOffset.FromUnixTimeMilliseconds(startMs.Value).UtcDateTime,
                PeriodEndUtc = DateTimeOffset.FromUnixTimeMilliseconds(newLastProcessedMs).UtcDateTime,
                Placement = GetString(map, "p"),
                UserAgentHash = GetString(map, "ua")
            };

            bool upserted = await _watchMinutesRepository.UpsertUserExternalStreamWatchMinutesTotal(watchMinutes);
            if (upserted)
            {
                processedSessions++;
                totalMinutes += minutes;
                await _redisDb.HashSetAsync(key, new[] { new HashEntry("lp", newLastProcessedMs) });
            }
        }

        return new
        {
            ok = true,
            processedSessions,
            totalMinutes,
            processedAt = now
        };
    }

    private static string GetSessionIdFromKey(RedisKey key)
    {
        string keyString = key.ToString();
        if (keyString.StartsWith(WatchSessionKeyPrefix, StringComparison.Ordinal))
        {
            return keyString.Substring(WatchSessionKeyPrefix.Length);
        }

        return keyString;
    }

    private static string? GetString(Dictionary<string, RedisValue> map, string key)
    {
        if (map.TryGetValue(key, out var value) && value.HasValue)
        {
            return value.ToString();
        }

        return null;
    }

    private static int? GetInt(Dictionary<string, RedisValue> map, string key)
    {
        if (map.TryGetValue(key, out var value) &&
            value.HasValue &&
            int.TryParse(value.ToString(), out var parsed))
        {
            return parsed;
        }

        return null;
    }

    private static long? GetLong(Dictionary<string, RedisValue> map, string key)
    {
        if (map.TryGetValue(key, out var value) &&
            value.HasValue &&
            long.TryParse(value.ToString(), out var parsed))
        {
            return parsed;
        }

        return null;
    }
}
