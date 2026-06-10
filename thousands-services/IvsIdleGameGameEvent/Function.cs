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
using System.Text.Json;
using IvsIdleGameShared.Models;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace IvsIdleGameGameEvent;

public class IdleGameGameEventResponse
{
    public bool Success { get; set; } = false;
    public string Err { get; set; } = "";
}

public class Function
{

    private static IServiceProvider? services;
    private readonly IIdleGameRepository _idleGameRepository;
    private readonly IUserRepository _userRepository;
    private readonly IEventRepository _eventRepository;
    private readonly IWebSocketService _webSocketService;
    private readonly IGameEventProcessor _gameEventProcessor;
    private readonly IBoostRepository _boostRepository;
    private readonly string? _gameApiKeyEnvironmentVar;

    public Function()
    {
        _gameApiKeyEnvironmentVar =
            Environment.GetEnvironmentVariable("GAME_API_KEY");

        if (String.IsNullOrEmpty(_gameApiKeyEnvironmentVar))
        {
            Console.WriteLine("GAME_API_KEY Environment Variable is not set!");
        }

        string? streamRepositoryConnectionUriEnvironmentVar =
            Environment.GetEnvironmentVariable("STREAM_REPOSITORY_CONNECTION_URI");

        if (String.IsNullOrEmpty(streamRepositoryConnectionUriEnvironmentVar))
        {
            Console.WriteLine("STREAM_REPOSITORY_CONNECTION_URI Environment Variable is not set!");
        }

        string? streamRepositoryDatabaseNameEnvironmentVar =
            Environment.GetEnvironmentVariable("STREAM_REPOSITORY_DATABASE_NAME");

        if (String.IsNullOrEmpty(streamRepositoryDatabaseNameEnvironmentVar))
        {
            Console.WriteLine("STREAM_REPOSITORY_DATABASE_NAME Environment Variable is not set!");
        }

        string? fanVisibilityServiceEndpointEnvironmentVar =
            Environment.GetEnvironmentVariable("FAN_VISIBILITY_SERVICE_ENDPOINT");

        if (String.IsNullOrEmpty(fanVisibilityServiceEndpointEnvironmentVar))
        {
            Console.WriteLine("FAN_VISIBILITY_SERVICE_ENDPOINT Environment Variable is not set!");
        }

        string? fanVisibilityServicePortEnvironmentVar =
            Environment.GetEnvironmentVariable("FAN_VISIBILITY_SERVICE_PORT");

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
            Environment.GetEnvironmentVariable("FAN_VISIBILITY_SERVICE_PASSWORD");

        if (String.IsNullOrEmpty(fanVisibilityServicePasswordEnvironmentVar))
        {
            Console.WriteLine("FAN_VISIBILITY_SERVICE_PASSWORD Environment Variable is not set!");
        }

        string? fanVisibilityServiceUserEnvironmentVar =
            Environment.GetEnvironmentVariable("FAN_VISIBILITY_SERVICE_USER");

        if (String.IsNullOrEmpty(fanVisibilityServiceUserEnvironmentVar))
        {
            Console.WriteLine("FAN_VISIBILITY_SERVICE_USER Environment Variable is not set!");
        }

        string? chatWebSocketPublisherKeyEnvironmentVar =
            Environment.GetEnvironmentVariable("CHAT_WEB_SOCKET_PUBLISHER_KEY");

        if (String.IsNullOrEmpty(chatWebSocketPublisherKeyEnvironmentVar))
        {
            Console.WriteLine("CHAT_WEB_SOCKET_PUBLISHER_KEY Environment Variable is not set!");
        }

        string? chatWebSocketSubscriberKeyEnvironmentVar =
            Environment.GetEnvironmentVariable("CHAT_WEB_SOCKET_SUBSCRIBER_KEY");

        if (String.IsNullOrEmpty(chatWebSocketSubscriberKeyEnvironmentVar))
        {
            Console.WriteLine("CHAT_WEB_SOCKET_SUBSCRIBER_KEY Environment Variable is not set!");
        }

        string? chatWebSocketSecretKeyEnvironmentVar =
            Environment.GetEnvironmentVariable("CHAT_WEB_SOCKET_SECRET_KEY");

        if (String.IsNullOrEmpty(chatWebSocketSecretKeyEnvironmentVar))
        {
            Console.WriteLine("CHAT_WEB_SOCKET_SECRET_KEY Environment Variable is not set!");
        }

        //_idleEventsSetup = new IdleEventsSetup();
        var serviceCollection = new ServiceCollection();
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
        serviceCollection.AddSingleton<IRedisSettings>(x => new RedisSettings()
        {
            EndPoint = fanVisibilityServiceEndpointEnvironmentVar,
            Port = fanVisibilityServicePort,
            Password = fanVisibilityServicePasswordEnvironmentVar,
            User = fanVisibilityServiceUserEnvironmentVar,
        });
        serviceCollection.AddSingleton<IChatWebSocketSettings>(x => new PubNubChatWebSocketSettings()
        {
            PublisherKey = chatWebSocketPublisherKeyEnvironmentVar,
            SubscriberKey = chatWebSocketSubscriberKeyEnvironmentVar,
            SecretKey = chatWebSocketSecretKeyEnvironmentVar,
        });
        serviceCollection.AddScoped<IUserRepository, MongoUserRepository>();
        serviceCollection.AddScoped<IEventRepository, MongoEventRepository>();
        serviceCollection.AddScoped<IBoostRepository, MongoBoostRepository>();
        serviceCollection.AddScoped<IIdleGameRepository, RedisIdleGameRepository>();
        serviceCollection.AddScoped<IWebSocketService, PubNubWebSocketService>();
        serviceCollection.AddScoped<IGameEventProcessor, GameEventProcessor>();
        services = serviceCollection.BuildServiceProvider();

        _idleGameRepository = services.GetRequiredService<IIdleGameRepository>();
        _userRepository = services.GetRequiredService<IUserRepository>();
        _eventRepository = services.GetRequiredService<IEventRepository>();
        _webSocketService = services.GetRequiredService<IWebSocketService>();
        _gameEventProcessor = services.GetRequiredService<IGameEventProcessor>();
        _boostRepository = services.GetRequiredService<IBoostRepository>();
    }

    /// <summary>
    /// Handle events emitted by the game 
    /// </summary>
    /// <param name="proxyRequest">The Request for the Lambda function handler to process.</param>
    /// <param name="context">Incoming context</param>. 
    /// <returns></returns>
    public async Task<IdleGameGameEventResponse> FunctionHandler(APIGatewayHttpApiV2ProxyRequest proxyRequest, ILambdaContext context)
    {
        Console.WriteLine(JsonSerializer.Serialize(proxyRequest));

        //Security to make sure the _gameApiKeyEnvironmentVar is set (not empty) and that the incoming x-Api-Key matches the _gameApiKeyEnvironmentVar
        if (String.IsNullOrEmpty(_gameApiKeyEnvironmentVar) || !proxyRequest.Headers.ContainsKey("x-api-key") || _gameApiKeyEnvironmentVar != proxyRequest.Headers["x-api-key"])
        {
            Console.WriteLine("Invalid API Key");

            return new IdleGameGameEventResponse()
            {
                Success = false,
                Err = "Invalid API Key"
            };
        }

        //If we get this far, this is a secure request

        DateTimeOffset dto = new DateTimeOffset(DateTime.UtcNow);
        long currentTimestamp = dto.ToUnixTimeMilliseconds();

        if (proxyRequest.Body == null)
        {
            return new IdleGameGameEventResponse()
            {
                Success = false,
                Err = "Invalid Request Body"
            };
        }

        GameEvent? gameEvent = JsonSerializer.Deserialize<GameEvent>(proxyRequest.Body);

        if (gameEvent == null)
        {
            return new IdleGameGameEventResponse()
            {
                Success = false,
                Err = "Error deserializing gameEvent from Request Body"
            };
        }

        if (gameEvent.Events == null || gameEvent.Events.Length < 1)
        {
            return new IdleGameGameEventResponse()
            {
                Success = false,
                Err = "There are no events to process"
            };
        }

        //Loop through each event in gameEvent.Events and process it
        foreach (GameEventEvent gameEventEvent in gameEvent.Events)
        {
            var successAndErrorMessage = await _gameEventProcessor.ProcessGameEvent(_userRepository, _eventRepository, _idleGameRepository, _webSocketService, _boostRepository,
                currentTimestamp, gameEvent.VendorEventId, gameEvent.MatchId, gameEventEvent);

            if (!successAndErrorMessage.Success)
            {
                return new IdleGameGameEventResponse
                {
                    Success = false,
                    Err = successAndErrorMessage.ErrorMessage
                };
            }
        }

        return new IdleGameGameEventResponse
        {
            Success = true,
            Err = ""
        };
    }
}
