using System.Text.Json;
using System.Text.Json.Serialization;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Configuration.Implementations;
using IvsIdleGameShared.Configuration.Interfaces;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Models.Prediction;
using IvsIdleGameShared.Repositories.Implementations;
using IvsIdleGameShared.Repositories.Interfaces;
using IvsIdleGameShared.Services.Implementations;
using IvsIdleGameShared.Services.Interfaces;
using IvsIdleGameShared.Utilities;
using Microsoft.Extensions.DependencyInjection;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace IvsConfirmPrediction;


public class ConfirmPredictionRequest
{
    [JsonPropertyName("priceQuoteGuid")]
    public Guid PriceQuoteGuid { get; set; } = Guid.Empty;
    [JsonPropertyName("stageId")]
    public string StageId { get; set; } = String.Empty;
    [JsonPropertyName("teamName")]
    public string TeamName { get; set; } = String.Empty;
    [JsonPropertyName("credits")]
    public int Credits { get; set; } = 0;
}


public class ConfirmPredictionResponse
{
    public bool Success { get; set; } = false;
    public ConfirmPredictionResult? Data { get; set; } = null;
    public string ErrorMessage { get; set; } = "";
}

public class Function
{
    private readonly IStreamRepository _streamRepository;
    private readonly ICreditBalanceRepository _creditBalanceRepository;
    private readonly IIdleGameRepository _idleGameRepository;
    private readonly IFanVisibilityService _fanVisibilityServiceService;
    private readonly IUserRepository _userRepository;
    private readonly IWebSocketService _webSocketService;
    private readonly IPredictionService _predictionService;
    private readonly IBoostRepository _boostRepository;
    private readonly IPredictionCache _predictionCache;
    private readonly IBoostCacheRepository _boostCacheRepository;
    private static IServiceProvider? services;
    public Function()
    {
        string? fanVisibilityServiceEndpointEnvironmentVar =
            System.Environment.GetEnvironmentVariable("FAN_VISIBILITY_SERVICE_ENDPOINT");

        if (String.IsNullOrEmpty(fanVisibilityServiceEndpointEnvironmentVar))
        {
            Console.WriteLine("FAN_VISIBILITY_SERVICE_ENDPOINT Environment Variable is not set!");
        }

        string? fanVisibilityServicePortEnvironmentVar =
            System.Environment.GetEnvironmentVariable("FAN_VISIBILITY_SERVICE_PORT");

        int fanVisibilityServicePort = 0;
        if (!String.IsNullOrEmpty(fanVisibilityServicePortEnvironmentVar))
        {
            fanVisibilityServicePort = int.Parse(fanVisibilityServicePortEnvironmentVar);
        }
        else
        {
            Console.WriteLine("FAN_VISIBILITY_SERVICE_PORT Environment Variable is not set!");
        }

        string? fanVisibilityServicePasswordEnvironmentVar =
            System.Environment.GetEnvironmentVariable("FAN_VISIBILITY_SERVICE_PASSWORD");

        if (String.IsNullOrEmpty(fanVisibilityServicePasswordEnvironmentVar))
        {
            Console.WriteLine("FAN_VISIBILITY_SERVICE_PASSWORD Environment Variable is not set!");
        }

        string? fanVisibilityServiceUserEnvironmentVar =
            System.Environment.GetEnvironmentVariable("FAN_VISIBILITY_SERVICE_USER");

        if (String.IsNullOrEmpty(fanVisibilityServiceUserEnvironmentVar))
        {
            Console.WriteLine("FAN_VISIBILITY_SERVICE_USER Environment Variable is not set!");
        }

        string? streamRepositoryConnectionUriEnvironmentVar =
           System.Environment.GetEnvironmentVariable("STREAM_REPOSITORY_CONNECTION_URI");

        if (String.IsNullOrEmpty(streamRepositoryConnectionUriEnvironmentVar))
        {
            Console.WriteLine("STREAM_REPOSITORY_CONNECTION_URI Environment Variable is not set!");
        }

        string? streamRepositoryDatabaseNameEnvironmentVar =
            System.Environment.GetEnvironmentVariable("STREAM_REPOSITORY_DATABASE_NAME");

        if (String.IsNullOrEmpty(streamRepositoryDatabaseNameEnvironmentVar))
        {
            Console.WriteLine("STREAM_REPOSITORY_DATABASE_NAME Environment Variable is not set!");
        }

        string? chatWebSocketPublisherKeyEnvironmentVar =
            System.Environment.GetEnvironmentVariable("CHAT_WEB_SOCKET_PUBLISHER_KEY");
        if (String.IsNullOrEmpty(chatWebSocketPublisherKeyEnvironmentVar))
        {
            Console.WriteLine("CHAT_WEB_SOCKET_PUBLISHER_KEY Environment Variable is not set!");
        }
        string? chatWebSocketSubscriberKeyEnvironmentVar =
            System.Environment.GetEnvironmentVariable("CHAT_WEB_SOCKET_SUBSCRIBER_KEY");
        if (String.IsNullOrEmpty(chatWebSocketSubscriberKeyEnvironmentVar))
        {
            Console.WriteLine("CHAT_WEB_SOCKET_SUBSCRIBER_KEY Environment Variable is not set!");
        }
        string? chatWebSocketSecretKeyEnvironmentVar =
            System.Environment.GetEnvironmentVariable("CHAT_WEB_SOCKET_SECRET_KEY");
        if (String.IsNullOrEmpty(chatWebSocketSecretKeyEnvironmentVar))
        {
            Console.WriteLine("CHAT_WEB_SOCKET_SECRET_KEY Environment Variable is not set!");
        }

        var serviceCollection = new ServiceCollection();
        serviceCollection.AddSingleton<IRedisSettings>(x => new RedisSettings()
        {
            EndPoint = fanVisibilityServiceEndpointEnvironmentVar,
            Port = fanVisibilityServicePort,
            Password = fanVisibilityServicePasswordEnvironmentVar,
            User = fanVisibilityServiceUserEnvironmentVar,
        });
        serviceCollection.AddSingleton<IMongoDbSettings>(x => new MongoDbSettings()
        {
            ConnectionUri = streamRepositoryConnectionUriEnvironmentVar,
            DatabaseName = streamRepositoryDatabaseNameEnvironmentVar,
            StreamsCollectionName = "streams",
            UsersCollectionName = "users",
            EventsCollectionName = "stages",
            EventIdleEventsCollectionName = "event-idle-events",
            CreditBalanceCollectionName = "credit-balances",
            CreditTransactionCollectionName = "credit-transactions",
            BoostsSegmentsCollectionName = "boosts-segments",
            SkyboxesCollectionName = "skyboxes",
        });
        serviceCollection.AddSingleton<IChatWebSocketSettings>(x => new PubNubChatWebSocketSettings()
        {
            PublisherKey = chatWebSocketPublisherKeyEnvironmentVar,
            SubscriberKey = chatWebSocketSubscriberKeyEnvironmentVar,
            SecretKey = chatWebSocketSecretKeyEnvironmentVar,
        });
        serviceCollection.AddSingleton<IRedisDbProvider, RedisDbProvider>();
        serviceCollection.AddSingleton<IFanVisibilityService, RedisFanVisibilityService>();
        serviceCollection.AddSingleton<IStreamRepository, MongoStreamRepository>();
        serviceCollection.AddSingleton<ICreditBalanceRepository, MongoCreditBalanceRepository>();
        serviceCollection.AddSingleton<IBoostCacheRepository, RedisBoostCacheRepository>();
        serviceCollection.AddScoped<IWebSocketService, PubNubWebSocketService>();
        serviceCollection.AddSingleton<IBoostRepository, MongoBoostRepository>();
        serviceCollection.AddScoped<IIdleGameRepository, RedisIdleGameRepository>();
        serviceCollection.AddSingleton<IUserRepository, MongoUserRepository>();
        serviceCollection.AddSingleton<IPredictionService, PredictionService>();
        serviceCollection.AddSingleton<IPredictionCache, RedisPredictionCache>();
        serviceCollection.AddSingleton<IBoostCacheRepository, RedisBoostCacheRepository>();
        serviceCollection.AddSingleton<ISkyboxCache, RedisSkyboxCache>();
        serviceCollection.AddSingleton<ILeaderboardRepository, RedisLeaderboardRepository>();
        serviceCollection.AddSingleton<ILeaderboardService, LeaderboardService>();
        serviceCollection.AddSingleton<ISkyboxRepository, MongoSkyboxRepository>();
        serviceCollection.AddSingleton<ISkyboxService, SkyboxService>();
        serviceCollection.AddSingleton<ISkyboxCache, RedisSkyboxCache>();

        services = serviceCollection.BuildServiceProvider();
        _fanVisibilityServiceService = services.GetRequiredService<IFanVisibilityService>();
        _streamRepository = services.GetRequiredService<IStreamRepository>();
        _creditBalanceRepository = services.GetRequiredService<ICreditBalanceRepository>();
        _idleGameRepository = services.GetRequiredService<IIdleGameRepository>();
        _userRepository = services.GetRequiredService<IUserRepository>();
        _webSocketService = services.GetRequiredService<IWebSocketService>();
        _boostRepository = services.GetRequiredService<IBoostRepository>();
        _predictionService = services.GetRequiredService<IPredictionService>();
        _predictionCache = services.GetRequiredService<IPredictionCache>();
        _boostCacheRepository = services.GetRequiredService<IBoostCacheRepository>();
    }

    /// <summary>
    /// A simple function that takes a string and does a ToUpper
    /// </summary>
    /// <param name="input">The event for the Lambda function handler to process.</param>
    /// <param name="context">The ILambdaContext that provides methods for logging and describing the Lambda environment.</param>
    /// <returns></returns>
    public async Task<APIGatewayProxyResponse> FunctionHandler(APIGatewayProxyRequest proxyRequest, ILambdaContext context)
    {
        Console.WriteLine($"ThousandsInfo: Raw Request - {JsonSerializer.Serialize(proxyRequest)}");

        //Verify the JWT token and extract the userId
        ThousandsJwt thousandsJwt = await LambdaUtilities.VerifyWildcardAccessTokenInProxyRequestAndGetUserId(proxyRequest);
        string userId = thousandsJwt.UserId;

        //Make sure we have a userId
        if (string.IsNullOrEmpty(userId))
        {
            return ThousandsResponse("ThousandsWarning: Missing userId", null, 200);
        }

        if (string.IsNullOrEmpty(proxyRequest.Body))
        {
            return ThousandsResponse("ThousandsWarning: Request body is empty", null, 200);
        }

        ConfirmPredictionRequest? confirmPredictionRequest;
        try
        {
            confirmPredictionRequest = JsonSerializer.Deserialize<ConfirmPredictionRequest>(proxyRequest.Body);
            if (confirmPredictionRequest == null)
            {
                return ThousandsResponse("ThousandsWarning: Unable to deserialize request body", null, 200);
            }
        }
        catch (Exception ex)
        {
            return ThousandsResponse($"ThousandsError: Failed to deserialize request body - {ex.Message}");
        }

        Guid priceQuoteGuid = confirmPredictionRequest.PriceQuoteGuid;
        string stageId = confirmPredictionRequest.StageId;
        string teamName = confirmPredictionRequest.TeamName;
        int credits = confirmPredictionRequest.Credits;

        if (priceQuoteGuid == Guid.Empty)
        {
            return ThousandsResponse("ThousandsWarning: Invalid price quote guid", null, 200);
        }

        if (string.IsNullOrWhiteSpace(stageId))
        {
            return ThousandsResponse("ThousandsWarning: Invalid stageId", null, 200);
        }

        if (credits < 1 || credits > 10000)
        {
            return ThousandsResponse("ThousandsWarning: Credits cannot be less than 1", null, 200);
        }

        if (teamName != "red" && teamName != "blue")
        {
            return ThousandsResponse("ThousandsWarning: Invalid team name", null, 200);
        }

        try
        {
            ConfirmPredictionResult confirmPredictionResult = await _predictionService.ConfirmPrediction(priceQuoteGuid, userId, teamName, credits, stageId);
            ConfirmPredictionResponse confirmPredictionResponse = new ConfirmPredictionResponse()
            {
                Data = confirmPredictionResult,
                Success = true
            };
            return ThousandsResponse("ThousandsSuccess: Successfully confirm prediction", confirmPredictionResponse, 200);
        }
        catch (Exception ex)
        {
            return ThousandsResponse($"ThousandsError - Failed to confirm prediction price - {ex.Message}");
        }
    }

    private APIGatewayProxyResponse ThousandsResponse(string message, ConfirmPredictionResponse? response = null, int statusCode = 500)
    {
        Console.WriteLine(message);
        ConfirmPredictionResponse confirmPredictionResponse = response ?? new ConfirmPredictionResponse()
        {
            ErrorMessage = message,
            Success = false
        };
        return new APIGatewayProxyResponse
        {
            StatusCode = statusCode,
            Body = JsonSerializer.Serialize(confirmPredictionResponse),
            Headers = LambdaUtilities.GetCORSHeaders()
        };
    }
}
