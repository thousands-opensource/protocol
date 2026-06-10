using System.Text.Json;
using System.Text.Json.Serialization;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Configuration.Implementations;
using IvsIdleGameShared.Configuration.Interfaces;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Repositories.Implementations;
using IvsIdleGameShared.Repositories.Interfaces;
using IvsIdleGameShared.Services.Implementations;
using IvsIdleGameShared.Services.Interfaces;
using IvsIdleGameShared.Utilities;
using Microsoft.Extensions.DependencyInjection;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace IvsCustomizeSkybox;

public class CustomizeSkyboxResponse
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }
    [JsonPropertyName("data")]
    public UpdatedSkyboxResult? Data { get; set; }
    [JsonPropertyName("errorMessage")]
    public string? ErrorMessage { get; set; }
}
public class CustomizeSkyboxRequest
{

    [JsonPropertyName("skyboxId")]
    public string SkyboxId { get; set; } = string.Empty;
    [JsonPropertyName("skyboxName")]
    public string SkyboxName { get; set; } = string.Empty;
    [JsonPropertyName("skyboxPrimaryColor")]
    public string SkyboxPrimaryColor { get; set; } = string.Empty;
    [JsonPropertyName("skyboxLogoUrl")]
    public string SkyboxLogoUrl { get; set; } = string.Empty;

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
    private readonly ISkyboxService _skyboxService;
    private readonly ISkyboxRepository _skyboxRepository;
    private readonly ISkyboxCache _skyboxCache;
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
            EventsCollectionName = "events",
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
        serviceCollection.AddScoped<IIdleGameRepository, RedisIdleGameRepository>();
        serviceCollection.AddSingleton<IUserRepository, MongoUserRepository>();
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
        _skyboxService = services.GetRequiredService<ISkyboxService>();
        _skyboxRepository = services.GetRequiredService<ISkyboxRepository>();
        _skyboxCache = services.GetRequiredService<ISkyboxCache>();
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

        if (String.IsNullOrEmpty(userId))
        {
            return ThousandsResponse("Invalid access token", "ThousandsWarning: Missing userId", null, 200);
        }
        if (String.IsNullOrEmpty(proxyRequest.Body))
        {
            string message = "Request body is empty";
            return ThousandsResponse(message, $"ThousandsWarning: {message}", null, 200);
        }

        CustomizeSkyboxRequest? customizeSkyboxRequest;
        try
        {
            customizeSkyboxRequest = JsonSerializer.Deserialize<CustomizeSkyboxRequest>(proxyRequest.Body);
            if (customizeSkyboxRequest == null)
            {
                return ThousandsResponse($"Request body is null", "ThousandsWarning: Unable to deserialize request body", null, 200);
            }
        }
        catch (JsonException ex)
        {
            return ThousandsResponse($"Invalid request body", $"ThousandsWarning: Error deserializing request body - {ex.Message}", null, 200);
        }

        string skyboxId = customizeSkyboxRequest.SkyboxId;
        string skyboxName = customizeSkyboxRequest.SkyboxName;
        string skyboxPrimaryColor = customizeSkyboxRequest.SkyboxPrimaryColor;
        string skyboxLogoUrl = customizeSkyboxRequest.SkyboxLogoUrl;

        if (String.IsNullOrEmpty(skyboxId))
        {
            return ThousandsResponse($"Invalid skyboxId", $"ThousandsWarning: Invalid skyboxId - {skyboxId}", null, 200);
        }
        if (String.IsNullOrEmpty(skyboxName))
        {
            return ThousandsResponse($"Invalid skyboxName", $"ThousandsWarning: Invalid skyboxName - {skyboxName}", null, 200);
        }
        if (String.IsNullOrEmpty(skyboxPrimaryColor))
        {
            return ThousandsResponse($"Invalid skyboxPrimaryColor", $"ThousandsWarning: Invalid skyboxPrimaryColor - {skyboxPrimaryColor}", null, 200);
        }
        if (String.IsNullOrEmpty(skyboxLogoUrl))
        {
            return ThousandsResponse($"Invalid skyboxLogoUrl", $"ThousandsWarning: Invalid skyboxLogoUrl - {skyboxLogoUrl}", null, 200);
        }

        try
        {
            UpdatedSkyboxResult updateSkyboxResult = await _skyboxService.UpdateSkybox(userId, skyboxId, skyboxName, skyboxPrimaryColor, skyboxLogoUrl);
            string? uiMessage = updateSkyboxResult.ErrorMessage;
            if (!string.IsNullOrEmpty(uiMessage))
            {
                return ThousandsResponse(uiMessage, $"ThousandsError: Unable to update skybox - skyboxId: {skyboxId}", null, 200);
            }

            CustomizeSkyboxResponse removeSkyboxMemberResponse = new CustomizeSkyboxResponse()
            {
                Data = updateSkyboxResult,
                Success = true
            };
            return ThousandsResponse("", "ThousandsSuccess: Successfully updated skybox", removeSkyboxMemberResponse, 200);
        }
        catch (Exception ex)
        {
            return ThousandsResponse($"Failed to update skybox", $"ThousandsError - Failed to update skybox - {ex.Message}");
        }
    }

    private APIGatewayProxyResponse ThousandsResponse(string uiMessage, string logMessage, CustomizeSkyboxResponse? response = null, int statusCode = 500)
    {
        Console.WriteLine(logMessage);
        CustomizeSkyboxResponse removeSkyboxMemberResponse = response ?? new CustomizeSkyboxResponse()
        {
            ErrorMessage = uiMessage,
            Success = false
        };
        return new APIGatewayProxyResponse
        {
            StatusCode = statusCode,
            Body = JsonSerializer.Serialize(removeSkyboxMemberResponse),
            Headers = LambdaUtilities.GetCORSHeaders()
        };
    }
}
