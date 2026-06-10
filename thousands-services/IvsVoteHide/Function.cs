using System.Text.Json;
using Amazon.Lambda.Core;
using IvsIdleGameShared.Configuration.Interfaces;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Configuration.Implementations;
using IvsIdleGameShared.Repositories.Implementations;
using IvsIdleGameShared.Repositories.Interfaces;
using IvsIdleGameShared.Services.Implementations;
using IvsIdleGameShared.Services.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Amazon.Lambda.APIGatewayEvents;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Utilities;
using IvsIdleGameShared.Models.Vote;
using System.Text.Json.Serialization;
using IvsIdleGameShared.Models.Boost;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace IvsVoteHide;

public class VoteHideRequest
{
    [JsonPropertyName("stageId")]
    public string StageId { get; set; } = String.Empty;
    
}

public class VoteHideResponse
{
    public bool Success { get; set; } = false;
    public string ErrorMessage { get; set; } = "";
}

public class Function
{
    private readonly IWebSocketService _webSocketService;
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
            BoostsSegmentsCollectionName = "boosts-segments"
        });
        serviceCollection.AddSingleton<IChatWebSocketSettings>(x => new PubNubChatWebSocketSettings()
        {
            PublisherKey = chatWebSocketPublisherKeyEnvironmentVar,
            SubscriberKey = chatWebSocketSubscriberKeyEnvironmentVar,
            SecretKey = chatWebSocketSecretKeyEnvironmentVar,
        });
        serviceCollection.AddSingleton<IRedisDbProvider, RedisDbProvider>();
        serviceCollection.AddSingleton<IVoteRepository, RedisVoteRepository>();
        serviceCollection.AddSingleton<IStreamRepository, MongoStreamRepository>();
        serviceCollection.AddScoped<IWebSocketService, PubNubWebSocketService>();
        services = serviceCollection.BuildServiceProvider();

        _webSocketService = services.GetRequiredService<IWebSocketService>();
    }

    /// <summary>
    /// Start a Vote
    /// </summary>
    /// <param name="proxyRequest">The event for the Lambda function handler to process.</param>
    /// <param name="context">The ILambdaContext that provides methods for logging and describing the Lambda environment.</param>
    /// <returns></returns>
    public async Task<APIGatewayProxyResponse> FunctionHandler(APIGatewayProxyRequest proxyRequest, ILambdaContext context)
    {
        Console.WriteLine($"ThousandsInfo: Raw Request - {JsonSerializer.Serialize(proxyRequest)}");

        //Verify the JWT token and extract the userId
        ThousandsJwt thousandsJwt = await LambdaUtilities.VerifyWildcardAccessTokenInProxyRequestAndGetUserId(proxyRequest);
        string userId = thousandsJwt.UserId;
        string[] roles = thousandsJwt.Roles;

        //Make sure we have a userId
        if (string.IsNullOrEmpty(userId))
        {
            return ThousandsResponse("ThousandsWarning: Missing userId", null, 200);
        }

        if (!(roles.Contains(UserRole.Admin.ToString().ToLower()) || roles.Contains(UserRole.Organizer.ToString().ToLower())))
        {
            return ThousandsResponse("ThousandsWarning: Invalid access. Do not have access to either admin role or organizer", null, 200);
        }

        if (string.IsNullOrEmpty(proxyRequest.Body))
        {
            return ThousandsResponse("ThousandsWarning: Request body is empty", null, 200);
        }

        VoteHideRequest? voteHideRequest;
        try
        {
            voteHideRequest = JsonSerializer.Deserialize<VoteHideRequest>(proxyRequest.Body);
            if (voteHideRequest == null)
            {
                return ThousandsResponse("ThousandsWarning: Unable to deserialize request body", null, 200);
            }
        }
        catch (Exception ex)
        {
            return ThousandsResponse($"ThousandsError: Failed to deserialize request body - {ex.Message}");
        }

        string stageId = voteHideRequest.StageId;

        try
        {
            BoostSignalMessage boostSignalMessage = new BoostSignalMessage()
            {
                BoostEventType = "VoteHide",
                EventId = stageId
            };
            string message = JsonSerializer.Serialize(boostSignalMessage);
            await _webSocketService?.SendMessageSignalToPlatformClient($"s.{stageId}", "Wildcard", message);
            Console.WriteLine($"Successfully send vote update message - {message}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error - Failed to send updated vote via pubnub - {ex.Message}");
        }

        VoteHideResponse voteHideResponse = new VoteHideResponse()
        {
            ErrorMessage = "",
            Success = true
        };
        return new APIGatewayProxyResponse
        {
            StatusCode = 200,
            Body = JsonSerializer.Serialize(voteHideResponse),
            Headers = LambdaUtilities.GetCORSHeaders()
        };
    }

    private APIGatewayProxyResponse ThousandsResponse(string message, VoteHideResponse? response = null, int statusCode = 500)
    {
        Console.WriteLine(message);
        VoteHideResponse voteStartResponse = response ?? new VoteHideResponse()
        {
            ErrorMessage = message,
            Success = false
        };
        return new APIGatewayProxyResponse
        {
            StatusCode = statusCode,
            Body = JsonSerializer.Serialize(voteStartResponse),
            Headers = LambdaUtilities.GetCORSHeaders()
        };
    }
}
