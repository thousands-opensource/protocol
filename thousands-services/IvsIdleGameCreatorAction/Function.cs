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
using Microsoft.Extensions.DependencyInjection;
using System.Text.Json;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace IvsIdleGameCreatorAction;

public class IdleGameGameEventResponse
{
    public bool Success { get; set; } = false;
    public string Err { get; set; } = "";
}

public class Function
{
    private static IServiceProvider? services;
    private readonly IIdleGameRepository _idleGameRepository;
    private readonly IWebSocketService _webSocketService;
    private readonly string? _platformApiKeyEnvironmentVar;

    public Function()
    {
        _platformApiKeyEnvironmentVar =
            Environment.GetEnvironmentVariable("PLATFORM_API_KEY");

        if (String.IsNullOrEmpty(_platformApiKeyEnvironmentVar))
        {
            Console.WriteLine("PLATFORM_API_KEY Environment Variable is not set!");
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
        serviceCollection.AddScoped<IIdleGameRepository, RedisIdleGameRepository>();
        serviceCollection.AddScoped<IWebSocketService, PubNubWebSocketService>();
        services = serviceCollection.BuildServiceProvider();

        _idleGameRepository = services.GetRequiredService<IIdleGameRepository>();
        _webSocketService = services.GetRequiredService<IWebSocketService>();
    }

    /// <summary>
    /// A simple function that takes a string and does a ToUpper
    /// </summary>
    /// <param name="input">The event for the Lambda function handler to process.</param>
    /// <param name="context">The ILambdaContext that provides methods for logging and describing the Lambda environment.</param>
    /// <returns></returns>
    public async Task<IdleGameGameEventResponse> FunctionHandler(APIGatewayHttpApiV2ProxyRequest proxyRequest,
        ILambdaContext context)
    {
        //Security to make sure the _platformApiKeyEnvironmentVar is set (not empty) and that the incoming x-Api-Key matches the _platformApiKeyEnvironmentVar
        if (String.IsNullOrEmpty(_platformApiKeyEnvironmentVar) || !proxyRequest.Headers.ContainsKey("x-api-key") || _platformApiKeyEnvironmentVar != proxyRequest.Headers["x-api-key"])
        {
            return new IdleGameGameEventResponse()
            {
                Success = false,
                Err = "Invalid API Key"
            };
        }

        //If we get this far, this is a secure request

        Console.WriteLine(JsonSerializer.Serialize(proxyRequest));

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

        CreatorEvent? creatorEvent = JsonSerializer.Deserialize<CreatorEvent>(proxyRequest.Body);

        if (creatorEvent == null)
        {
            return new IdleGameGameEventResponse()
            {
                Success = false,
                Err = "Error deserializing creatorEvent from Request Body"
            };
        }

        if (creatorEvent.TextOptions == null || creatorEvent.TextOptions.Length < 1)
        {
            return new IdleGameGameEventResponse()
            {
                Success = false,
                Err = "Must have a least one Text Option"
            };
        }

        Guid chatActionGuid = Guid.NewGuid();
        string chatActionId = chatActionGuid.ToString();
        string eventId = creatorEvent.EventId;

        ChatMessage chatMessage = new ChatMessage()
        {
            timestamp = currentTimestamp,
            durationMs = 15000,
            text = "What is the best food?",
            type = "system-yesno",
            user = new ChatMessageUser()
            {
                id = "Wildcard",
            },
            actionLabel = "",
            chatActionGuid = chatActionId,
            eventId = eventId,
            optionAImageUrl = "",
            optionBImageUrl = "",
            textOptions = creatorEvent.TextOptions,
        };

        IdleEvent idleEvent = new IdleEvent()
        {
            ChatActionGuid = chatActionGuid,
            Name = "poll",
            Timestamp = currentTimestamp,
            Cost = 0,
            Duration = 21,
            PerTick = 0,
            IsPersonalEvent = false
        };

        await _idleGameRepository.AddSharedEvent(creatorEvent.EventId, idleEvent);

        string eventAndChannel = eventId + ".system";
        bool webSocketSendSuccess = await _webSocketService.SendChatToPlatformClient(eventAndChannel, "Wildcard", chatMessage);

        SignalToStreamOverlay signalToStreamOverlay = new SignalToStreamOverlay()
        {
            OverlayName = "poll",
            VoteQuestionText = creatorEvent.QuestionText,
            FinalText = "",
            OptionAText = "",
            OptionBText = "",
            TotalVoteCount = 0,
            OptionAVoteCount = 0,
            OptionBVoteCount = 0,
            TextOptions = creatorEvent.TextOptions,
            LastWager = null,
        };

        //Send initial signal to show 
        await _webSocketService.SendSignalToStreamOverlay(signalToStreamOverlay);

        TextOptionWithVoteCount[] textOptionsWithVoteCounts = new TextOptionWithVoteCount[creatorEvent.TextOptions.Length];
        int indexOfTextOptionToAdd = 0;
        foreach (var optionText in creatorEvent.TextOptions)
        {
            textOptionsWithVoteCounts[indexOfTextOptionToAdd] = new TextOptionWithVoteCount()
            {
                TextOption = optionText,
                VoteCount = 0
            };
            indexOfTextOptionToAdd++;
        }

        TextOptionWithVoteCount[] voters = new TextOptionWithVoteCount[]
            {
                new TextOptionWithVoteCount()
                {
                    TextOption = "Eric",
                    VoteCount = 500
                },
                new TextOptionWithVoteCount()
                {
                    TextOption = "Eb",
                    VoteCount = 200
                },
                new TextOptionWithVoteCount()
                {
                    TextOption = "Paul",
                    VoteCount = 1000
                },
                new TextOptionWithVoteCount()
                {
                    TextOption = "Jeff",
                    VoteCount = 800
                },
                new TextOptionWithVoteCount()
                {
                    TextOption = "Dan",
                    VoteCount = 700
                }
            };

        Random random = new Random();
        //Loop and output a signal to the HTML overlay every 3 seconds
        for (int indexOfUpdate = 0; indexOfUpdate < 5; indexOfUpdate++)
        {
            Thread.Sleep(3000);

            signalToStreamOverlay.TotalVoteCount += 50;
            signalToStreamOverlay.LastWager = voters[indexOfUpdate];

            //Final update
            if (indexOfUpdate > 3)
            {
                int accumulatedRandomVotes = 0;
                int indexOfTextOptionToUpdate = 0;
                foreach (var optionText in creatorEvent.TextOptions)
                {
                    /*
                    var playersVotingThisOption = await _idleGameRepository.GetPlayersFromSharedEventOption(creatorEvent.EventId, chatActionId.ToString(), 
                        indexOfTextOptionToUpdate.ToString());
                    textOptionsWithVoteCounts[indexOfTextOptionToUpdate].VoteCount = playersVotingThisOption.Length;
                    */

                    if (indexOfTextOptionToUpdate > creatorEvent.TextOptions.Length - 2)
                    {
                        textOptionsWithVoteCounts[indexOfTextOptionToUpdate].VoteCount = 200 - accumulatedRandomVotes;
                    }
                    else
                    {
                        int randomNumber = random.Next(1, 50);
                        textOptionsWithVoteCounts[indexOfTextOptionToUpdate].VoteCount = randomNumber;
                        accumulatedRandomVotes += randomNumber;
                    }

                    indexOfTextOptionToUpdate++;
                }

                signalToStreamOverlay.FinalText = creatorEvent.QuestionText;
                signalToStreamOverlay.TextOptionsWithVoteCount = textOptionsWithVoteCounts;
            }

            await _webSocketService.SendSignalToStreamOverlay(signalToStreamOverlay);
        }

        return new IdleGameGameEventResponse()
        {
            Success = true,
            Err = ""
        };
    }
}
