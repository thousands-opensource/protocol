using Amazon.Lambda.Core;
using IvsIdleGameShared.Configuration.Interfaces;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Models.Vote;
using IvsIdleGameShared.Repositories.Implementations;
using IvsIdleGameShared.Repositories.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using System.Text.Json.Serialization;
using IvsIdleGameShared.Configuration.Implementations;
using Amazon.Lambda.APIGatewayEvents;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Utilities;
using System.Text.Json;
using IvsIdleGameShared.Services.Implementations;
using IvsIdleGameShared.Services.Interfaces;
using System.Reflection;
using IvsIdleGameShared.Models.Boost;
using PubnubApi.EventEngine.Subscribe.Common;
using static MongoDB.Libmongocrypt.CryptContext;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace IvsVoteStart;

public class VoteStartRequest
{
    [JsonPropertyName("stageId")]
    public string StageId { get; set; } = String.Empty;

    [JsonPropertyName("voteConfig")]
    public VoteConfig VoteConfig { get; set; } = new VoteConfig();
}

public class VoteStartResponse
{
    public bool Success { get; set; } = false;
    public string ErrorMessage { get; set; } = "";
}

public class Function
{
    private readonly IStreamRepository _streamRepository;
    private readonly IVoteRepository _voteRepository;
    private readonly IWebSocketService _websocketService;
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
        _streamRepository = services.GetRequiredService<IStreamRepository>();
        _websocketService = services.GetRequiredService<IWebSocketService>();
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

        VoteStartRequest? voteStartRequest;
        try
        {
            voteStartRequest = JsonSerializer.Deserialize<VoteStartRequest>(proxyRequest.Body);
            if (voteStartRequest == null)
            {
                return ThousandsResponse("ThousandsWarning: Unable to deserialize request body", null, 200);
            }
        }
        catch (Exception ex)
        {
            return ThousandsResponse($"ThousandsError: Failed to deserialize request body - {ex.Message}");
        }

        string stageId = voteStartRequest.StageId;
        VoteConfig voteConfig = voteStartRequest.VoteConfig;

        //Make sure we have a non-empty StageId
        if (string.IsNullOrEmpty(stageId))
        {
            return ThousandsResponse($"ThousandsWarning: Must have a valid StageId", null, 200);
        }

        //Make sure we have a non-empty VoteTitle
        if (string.IsNullOrEmpty(voteConfig.VoteTitle))
        {
            return ThousandsResponse($"ThousandsWarning: Must have a valid Vote Title", null, 200);
        }

        //Make sure out vote time is at least 30 seconds
        if (voteConfig.VoteTimeSeconds < 30)
        {
            return ThousandsResponse($"ThousandsWarning: VoteTimeSeconds must be at least 30", null, 200);
        }

        //Make sure voteConfig has at least two options
        if (voteConfig.VoteOptions.Count < 2)
        {
            return ThousandsResponse($"ThousandsWarning: Must have at least 2 vote options", null, 200);
        }

        Stage? stage;
        try
        {
            stage = await _streamRepository.GetStage(stageId);
            if (stage == null)
            {
                return ThousandsResponse($"ThousandsWarning: Cannot find stageId: {stageId}", null, 200);
            }
        }
        catch (Exception ex)
        {
            return ThousandsResponse($"ThousandsError: Failed to fetch stage for stageId: {stageId}, Error: {{ex.Message}}", null);
        }

        var stageCurrentSegment = stage.CurrentSegment;
        if (!stageCurrentSegment.HasValue)
        {
            return ThousandsResponse($"ThousandsWarning: stageId: {stageId} is missing a currentSegment!", null, 200);
        }

        int currentSegment = stageCurrentSegment ?? 0; //This can't be null

        //Check to see if there is an active vote
        var activeVoting = await _voteRepository.GetActiveVoting(stageId);

        if (activeVoting != null)
        {
            return ThousandsResponse($"ThousandsWarning: There is already an active vote!", null, 200);
        }

        //If there isn't an active vote, setup a new one
        Guid voteId = Guid.NewGuid();
        string voteIdString = voteId.ToString();
        DateTimeOffset dto = new DateTimeOffset(DateTime.UtcNow);
        long currentTimestamp = dto.ToUnixTimeMilliseconds();
        voteConfig.VoteStartTimestamp = currentTimestamp;
        await _voteRepository.AddVoteConfig(stageId,  voteIdString, voteConfig);

        //Set this as the active voting
        await _voteRepository.AddActiveVoting(stageId, voteId);

        //Start building vote update
        List<VoteOptionWithVotes> voteResult = new List<VoteOptionWithVotes>();

        //Copy voteOptions to voteResult, setting NumberOfVotes to zero for each item
        foreach (var voteOption in voteConfig.VoteOptions)
        {
            voteResult.Add(new VoteOptionWithVotes
            {
                Name = voteOption,
                NumberOfVotes = 0
            });
        }

        //Assemble vote update
        VoteUpdate voteUpdate = new VoteUpdate
        {
            VoteTitle = voteConfig.VoteTitle,
            VoteTimeSeconds = voteConfig.VoteTimeSeconds,
            VoteResults = voteResult
        };

        //Send a PubNub message to start the vote
        BoostSignalMessage voteUpdateBoostSignalMessage = new BoostSignalMessage
        {
            BoostEventType = "StartVote",
            EventId = stageId,
            VoteUpdate = voteUpdate
        };
        Console.WriteLine(JsonSerializer.Serialize(voteUpdateBoostSignalMessage));
        string boostSignalMessageString = JsonSerializer.Serialize(voteUpdateBoostSignalMessage);

        Console.WriteLine(boostSignalMessageString);

        bool sendMessageSuccess = await _websocketService.SendMessageSignalToPlatformClient($"s.{voteUpdateBoostSignalMessage.EventId}", "system",
            boostSignalMessageString);

        VoteStartResponse voteStartResponse = new VoteStartResponse()
        {
            ErrorMessage = "",
            Success = true
        };
        return new APIGatewayProxyResponse
        {
            StatusCode = 200,
            Body = JsonSerializer.Serialize(voteStartResponse),
            Headers = LambdaUtilities.GetCORSHeaders()
        };
    }

    private APIGatewayProxyResponse ThousandsResponse(string message, VoteStartResponse? response = null, int statusCode = 500)
    {
        Console.WriteLine(message);
        VoteStartResponse voteStartResponse = response ?? new VoteStartResponse()
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
