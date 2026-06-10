using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Repositories.Implementations;
using IvsIdleGameShared.Repositories.Interfaces;
using IvsIdleGameShared.Utilities;
using Microsoft.Extensions.DependencyInjection;
using StackExchange.Redis;
using System.Diagnostics;
using System.Text.Json;
using System.Text.Json.Serialization;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace WatchHeartbeat;

public class WatchHeartbeatRequest
{
    [JsonPropertyName("sessionId")]
    public string SessionId { get; set; } = "";

    [JsonPropertyName("streamId")]
    public string StreamId { get; set; } = "";

    [JsonPropertyName("isViewing")]
    public bool? IsViewing { get; set; }

    [JsonPropertyName("placement")]
    public string? Placement { get; set; }

    [JsonPropertyName("userAgentHash")]
    public string? UserAgentHash { get; set; }
}

public class Function
{
    private const string ActiveSessionsSetKey = "watch:sess:active";
    private readonly IDatabase _redisDb;
    private static IServiceProvider? services;

    public Function()
    {
        string? redisEndpointEnvironmentVar =
            Environment.GetEnvironmentVariable("WATCH_HEARTBEAT_REDIS_ENDPOINT");

        if (String.IsNullOrEmpty(redisEndpointEnvironmentVar))
        {
            Console.WriteLine("WATCH_HEARTBEAT_REDIS_ENDPOINT Environment Variable is not set!");
        }

        string? redisPortEnvironmentVar =
            Environment.GetEnvironmentVariable("WATCH_HEARTBEAT_REDIS_PORT");

        int redisPort = 0;
        if (!String.IsNullOrEmpty(redisPortEnvironmentVar))
        {
            redisPort = int.Parse(redisPortEnvironmentVar);
        }
        else
        {
            Console.WriteLine("WATCH_HEARTBEAT_REDIS_PORT Environment Variable is not set!");
        }

        string? redisPasswordEnvironmentVar =
            Environment.GetEnvironmentVariable("WATCH_HEARTBEAT_REDIS_PASSWORD");

        if (String.IsNullOrEmpty(redisPasswordEnvironmentVar))
        {
            Console.WriteLine("WATCH_HEARTBEAT_REDIS_PASSWORD Environment Variable is not set!");
        }

        string? redisUserEnvironmentVar =
            Environment.GetEnvironmentVariable("WATCH_HEARTBEAT_REDIS_USER");

        if (String.IsNullOrEmpty(redisUserEnvironmentVar))
        {
            Console.WriteLine("WATCH_HEARTBEAT_REDIS_USER Environment Variable is not set!");
        }

        var serviceCollection = new ServiceCollection();
        serviceCollection.AddSingleton<IRedisSettings>(x => new RedisSettings()
        {
            EndPoint = redisEndpointEnvironmentVar,
            Port = redisPort,
            Password = redisPasswordEnvironmentVar,
            User = redisUserEnvironmentVar,
        });
        serviceCollection.AddSingleton<IRedisDbProvider, RedisDbProvider>();
        services = serviceCollection.BuildServiceProvider();

        _redisDb = services.GetRequiredService<IRedisDbProvider>().database;
    }

    /// <summary>
    /// Records a viewing heartbeat for a user session and stream.
    /// </summary>
    /// <param name="proxyRequest">The event for the Lambda function handler to process.</param>
    /// <param name="context">The ILambdaContext that provides methods for logging and describing the Lambda environment.</param>
    /// <returns></returns>
    public async Task<APIGatewayProxyResponse> FunctionHandler(APIGatewayProxyRequest proxyRequest, ILambdaContext context)
    {
        // Verify the JWT token and extract the userId
        ThousandsJwt thousandsJwt = await LambdaUtilities.VerifyWildcardAccessTokenInProxyRequestAndGetUserId(proxyRequest);
        string userId = thousandsJwt.UserId;
        string[] roles = thousandsJwt.Roles;

        if (string.IsNullOrEmpty(userId))
        {
            Console.WriteLine("Missing userId!");
            return ReturnResponseError(401);
        }

        WatchHeartbeatRequest? heartbeatRequest = JsonSerializer.Deserialize<WatchHeartbeatRequest>(proxyRequest.Body);
        Console.WriteLine($"Received WatchHeartbeatRequest: {proxyRequest.Body}");
        if (heartbeatRequest == null)
        {
            Console.WriteLine("Error deserializing WatchHeartbeatRequest!");
            return ReturnResponseError(400);
        }
        if (string.IsNullOrWhiteSpace(heartbeatRequest.SessionId))
        {
            Console.WriteLine("Missing SessionId in WatchHeartbeatRequest!");
            return ReturnResponseError(400);
        }
        if (string.IsNullOrWhiteSpace(heartbeatRequest.StreamId))
        {
            Console.WriteLine("Missing StreamId in WatchHeartbeatRequest!");
            return ReturnResponseError(400);
        }

        var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        string key = $"watch:sess:{heartbeatRequest.SessionId}";

        RedisValue existingStart = await _redisDb.HashGetAsync(key, "st");
        if (!existingStart.HasValue)
        {
            await _redisDb.HashSetAsync(key, new HashEntry[] { new HashEntry("st", now) });
        }

        var hashEntries = new List<HashEntry>
        {
            new HashEntry("u", userId),
            new HashEntry("s", heartbeatRequest.StreamId),
            new HashEntry("ls", now)
        };

        if (heartbeatRequest.IsViewing.HasValue)
        {
            hashEntries.Add(new HashEntry("v", heartbeatRequest.IsViewing.Value ? 1 : 0));
        }

        if (!string.IsNullOrWhiteSpace(heartbeatRequest.Placement))
        {
            hashEntries.Add(new HashEntry("p", heartbeatRequest.Placement));
        }

        if (!string.IsNullOrWhiteSpace(heartbeatRequest.UserAgentHash))
        {
            hashEntries.Add(new HashEntry("ua", heartbeatRequest.UserAgentHash));
        }

        await _redisDb.HashSetAsync(key, hashEntries.ToArray());
        await _redisDb.KeyExpireAsync(key, TimeSpan.FromSeconds(180));
        await _redisDb.SetAddAsync(ActiveSessionsSetKey, key);

        return new APIGatewayProxyResponse
        {
            StatusCode = 200,
            Body = JsonSerializer.Serialize(new
            {
                ok = true,
                sessionId = heartbeatRequest.SessionId,
                streamId = heartbeatRequest.StreamId,
                userId,
                roles,
                updatedAt = now
            }),
            Headers = LambdaUtilities.GetCORSHeaders()
        };
    }

    private APIGatewayProxyResponse ReturnResponseError(int statusCode)
    {
        return new APIGatewayProxyResponse
        {
            StatusCode = statusCode,
            Body = "",
            Headers = LambdaUtilities.GetCORSHeaders()
        };
    }
}
