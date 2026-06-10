using Amazon.Lambda.Core;
using IvsIdleGameShared.Configuration.Interfaces;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Repositories.Implementations;
using IvsIdleGameShared.Repositories.Interfaces;
using IvsIdleGameShared.Services.Implementations;
using IvsIdleGameShared.Services.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using System.Text.Json.Serialization;
using IvsIdleGameShared.Configuration.Implementations;
using Amazon.Lambda.APIGatewayEvents;
using IvsIdleGameShared.Utilities;
using System.Text.Json;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Models.Vote;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace IvsVotePlace;

public class VotePlaceRequest
{
    [JsonPropertyName("stageId")]
    public string StageId { get; set; } = String.Empty;

    [JsonPropertyName("voteOption")]
    public string VoteOption { get; set; } = String.Empty;
}

public class VotePlaceResponse
{
    public bool Success { get; set; } = false;
    public string ErrorMessage { get; set; } = "";
}

public class Function
{
    private readonly IVoteRepository _voteRepository;
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

        _voteRepository = services.GetRequiredService<IVoteRepository>();
    }

    /// <summary>
    /// Place a Vote
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

        if (string.IsNullOrEmpty(proxyRequest.Body))
        {
            return ThousandsResponse("ThousandsWarning: Request body is empty", null, 200);
        }

        VotePlaceRequest? votePlaceRequest;
        try
        {
            votePlaceRequest = JsonSerializer.Deserialize<VotePlaceRequest>(proxyRequest.Body);
            if (votePlaceRequest == null)
            {
                return ThousandsResponse("ThousandsWarning: Unable to deserialize request body", null, 200);
            }
        }
        catch (Exception ex)
        {
            return ThousandsResponse($"ThousandsError: Failed to deserialize request body - {ex.Message}");
        }

        string stageId = votePlaceRequest.StageId;
        string voteOption = votePlaceRequest.VoteOption;

        //Make sure we have a non-empty StageId
        if (string.IsNullOrEmpty(stageId))
        {
            return ThousandsResponse($"ThousandsWarning: Must have a valid StageId", null, 200);
        }

        //Make sure we have a non-empty VoteOption
        if (string.IsNullOrEmpty(voteOption))
        {
            return ThousandsResponse($"ThousandsWarning: Must have a valid Vote Option", null, 200);
        }

        var activeVoting = await _voteRepository.GetActiveVoting(stageId);

        if (activeVoting == null)
        {
            return ThousandsResponse($"ThousandsWarning: There is no active vote for stageId: {stageId}", null, 200);
        }

        string activeVoteId = activeVoting.VoteId.ToString();
        var voteConfig = await _voteRepository.GetVoteConfig(stageId, activeVoteId);

        if (voteConfig == null)
        {
            return ThousandsResponse($"ThousandsWarning: Error getting vote config for activeVoteId: {activeVoteId}", null, 200);
        }

        bool foundVoteOption = false;
        foreach (var validVoteOption in voteConfig.VoteOptions)
        {
            if (voteOption == validVoteOption)
            {
                foundVoteOption = true;
            }
        }

        if (!foundVoteOption)
        {
            return ThousandsResponse($"ThousandsWarning: Invalid voting option!", null, 200);
        }

        await _voteRepository.AddVote(stageId, userId, activeVoteId, voteOption);

        VotePlaceResponse votePlaceResponse = new VotePlaceResponse()
        {
            ErrorMessage = "",
            Success = true
        };
        return new APIGatewayProxyResponse
        {
            StatusCode = 200,
            Body = JsonSerializer.Serialize(votePlaceResponse),
            Headers = LambdaUtilities.GetCORSHeaders()
        };
    }

    private APIGatewayProxyResponse ThousandsResponse(string message, VotePlaceResponse? response = null, int statusCode = 500)
    {
        Console.WriteLine(message);
        VotePlaceResponse voteStartResponse = response ?? new VotePlaceResponse()
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
