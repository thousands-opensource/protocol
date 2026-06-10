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

namespace IvsAcceptRejectSkyboxInvitation;

public class AcceptRejectSkyboxInvitationResponse
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }
    [JsonPropertyName("data")]
    public AcceptInviteResult? Data { get; set; }
    [JsonPropertyName("errorMessage")]
    public string? ErrorMessage { get; set; }
}
public class AcceptRejectSkyboxInvitationRequest
{
    [JsonPropertyName("skyboxInviteId")]
    public Guid SkyboxInviteId { get; set; } = Guid.Empty;
    [JsonPropertyName("acceptOrReject")]
    public bool acceptOrReject { get; set; } = false;
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

        // Verify the JWT token and extract the userId
        ThousandsJwt jwtToken = await LambdaUtilities.VerifyWildcardAccessTokenInProxyRequestAndGetUserId(proxyRequest);
        string userId = jwtToken.UserId;

        if (String.IsNullOrEmpty(userId))
        {
            return ThousandsResponse("Invalid access token", "ThousandsWarning: Missing userId", null, 200);
        }
        if (String.IsNullOrEmpty(proxyRequest.Body))
        {
            string message = "Request body is empty";
            return ThousandsResponse(message, $"ThousandsWarning: {message}", null, 200);
        }

        AcceptRejectSkyboxInvitationRequest? acceptRejectSkyboxInvitationRequest;
        try
        {
            acceptRejectSkyboxInvitationRequest = JsonSerializer.Deserialize<AcceptRejectSkyboxInvitationRequest>(proxyRequest.Body);
            if (acceptRejectSkyboxInvitationRequest == null)
            {
                return ThousandsResponse($"Request body is null", $"ThousandsWarning: Failed to deserialize request body", null, 200);
            }
        }
        catch (JsonException ex)
        {
            return ThousandsResponse($"Invalid request body", $"ThousandsError: Failed to deserialize request body - {ex.Message}");

        }

        Guid skyboxInviteGuid = acceptRejectSkyboxInvitationRequest.SkyboxInviteId;
        bool acceptOrReject = acceptRejectSkyboxInvitationRequest.acceptOrReject;

        if (skyboxInviteGuid == Guid.Empty)
        {
            return ThousandsResponse("Invalid skybox invite", $"ThousandsWarning: Invalid skybox invite id - {skyboxInviteGuid}", null, 200);
        }

        try
        {
            if (!acceptOrReject)
            {
                AcceptRejectSkyboxInvitationResponse rejectSkyboxInviteResponse = new AcceptRejectSkyboxInvitationResponse()
                {
                    Data = new AcceptInviteResult { },
                    Success = true
                };

                //Reject the invite
                await _skyboxService.RejectSkyboxInvite(skyboxInviteGuid);

                // Reject the skybox invite
                return ThousandsResponse("", "ThousandsSuccess: Successfully rejected skybox invitation", rejectSkyboxInviteResponse, 200);
            }

            // Accept the skybox invite
            AcceptInviteResult acceptRejectSkyboxInviteResult = await _skyboxService.AcceptSkyboxInvite(skyboxInviteGuid);
            string? uiMessage = acceptRejectSkyboxInviteResult.ErrorMessage;
            if (!string.IsNullOrEmpty(uiMessage))
            {
                return ThousandsResponse(uiMessage, $"ThousandsError: Failed to accept skybox invitation - skyboxInviteGuid: {skyboxInviteGuid}", null, 200);
            }

            AcceptRejectSkyboxInvitationResponse acceptRejectSkyboxInviteResponse = new AcceptRejectSkyboxInvitationResponse()
            {
                Data = acceptRejectSkyboxInviteResult,
                Success = true
            };
            return ThousandsResponse("", "ThousandsSuccess: Successfully accepted skybox invitation", acceptRejectSkyboxInviteResponse, 200);
        }
        catch (Exception ex)
        {
            return ThousandsResponse("Failed to accept or reject skybox invitation", $"ThousandsError - Failed to accept or reject skybox invitation - {ex.Message}");
        }
    }

    private APIGatewayProxyResponse ThousandsResponse(string uiMessage, string logMessage, AcceptRejectSkyboxInvitationResponse? response = null, int statusCode = 500)
    {
        Console.WriteLine(logMessage);
        AcceptRejectSkyboxInvitationResponse acceptRejectSkyboxInviteResponse = response ?? new AcceptRejectSkyboxInvitationResponse()
        {
            ErrorMessage = uiMessage,
            Success = false
        };
        return new APIGatewayProxyResponse
        {
            StatusCode = statusCode,
            Body = JsonSerializer.Serialize(acceptRejectSkyboxInviteResponse),
            Headers = LambdaUtilities.GetCORSHeaders()
        };
    }
}
