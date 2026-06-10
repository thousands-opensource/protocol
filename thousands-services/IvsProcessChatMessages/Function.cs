using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using Amazon.Lambda.Core;
using Amazon.Lambda.SQSEvents;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Configuration.Implementations;
using IvsIdleGameShared.Configuration.Interfaces;
using IvsIdleGameShared.Models.Boost;
using IvsIdleGameShared.Models.Chat;
using IvsIdleGameShared.Models.Skybox;
using IvsIdleGameShared.Repositories.Implementations;
using IvsIdleGameShared.Repositories.Interfaces;
using IvsIdleGameShared.Services.Implementations;
using IvsIdleGameShared.Services.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using PubnubApi;
using static System.Formats.Asn1.AsnWriter;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace IvsProcessChatMessages;

public class ChatMessageEvent
{
    [JsonPropertyName("vendorEventId")]
    public string VendorEventId { get; set; } = "";

    [JsonPropertyName("stageId")]
    public string StageId { get; set; } = "";

    [JsonPropertyName("message")]
    public string Message { get; set; } = "";

    [JsonPropertyName("skyboxId")]
    public string? SkyboxId { get; set; } = null;

    [JsonPropertyName("userId")]
    public string? UserId { get; set; } = null;

    [JsonPropertyName("authorizationHeader")]
    public string AuthorizationHeader { get; set; } = "";

}

public class Function
{
    private static IServiceProvider services { get; set; }
    private readonly IStreamRepository _streamRepository;
    private readonly IChatRepository _chatRepository;
    private readonly ISkyboxCache _skyboxCache;
    private readonly IWebSocketService _webSocketService;

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
            MarketTransactionsCollectionName = "market-transactions",
            UserCoinsCollectionName = "user-coins",
            CreditTransactionCollectionName = "credit-transactions",
            CreditBalanceCollectionName = "credit-balances",
            ChatMessagesSegmentsCollectionName = "chat-messages-segments",
            ChatReactionsSegmentsCollectionName = "chat-reactions-segments"
        });
        serviceCollection.AddSingleton<IChatWebSocketSettings>(x => new PubNubChatWebSocketSettings()
        {
            PublisherKey = chatWebSocketPublisherKeyEnvironmentVar,
            SubscriberKey = chatWebSocketSubscriberKeyEnvironmentVar,
            SecretKey = chatWebSocketSecretKeyEnvironmentVar,
        });
        serviceCollection.AddSingleton<IRedisDbProvider, RedisDbProvider>();
        serviceCollection.AddScoped<IWebSocketService, PubNubWebSocketService>();
        serviceCollection.AddSingleton<IStreamRepository, MongoStreamRepository>();
        serviceCollection.AddSingleton<IChatRepository, MongoChatRepository>();
        serviceCollection.AddSingleton<ISkyboxCache, RedisSkyboxCache>();
        services = serviceCollection.BuildServiceProvider();

        _streamRepository = services.GetRequiredService<IStreamRepository>();
        _chatRepository = services.GetRequiredService<IChatRepository>();
        _skyboxCache = services.GetRequiredService<ISkyboxCache>();
        _webSocketService = services.GetRequiredService<IWebSocketService>();
    }

    /// <summary>
    /// A simple function that takes a string and does a ToUpper
    /// </summary>
    /// <param name="events">The events for the Lambda function handler to process.</param>
    /// <param name="context">The ILambdaContext that provides methods for logging and describing the Lambda environment.</param>
    /// <returns></returns>
    public async Task<bool> FunctionHandler(SQSEvent events, ILambdaContext context)
    {
        Console.WriteLine(JsonSerializer.Serialize(events));
        string secretKey = "";

        DateTimeOffset dto = new DateTimeOffset(DateTime.UtcNow);
        long currentTimestamp = dto.ToUnixTimeMilliseconds();

        var validator = new JsonWebTokenHandler();

        //This global stageId means that we aren't supporting more than one active stage at a time
        string stageId = "";

        Dictionary<string, int> emojiCounts = new Dictionary<string, int>();

        foreach (var message in events.Records)
        {
            ChatMessageEvent? chatMessageEvent = JsonSerializer.Deserialize<ChatMessageEvent>(message.Body);

            if (chatMessageEvent == null)
            {
                Console.WriteLine("chatMessageEvent is null!");
                continue;
            }

            Console.WriteLine("ChatMessageEvent: " + JsonSerializer.Serialize(chatMessageEvent));
            stageId = chatMessageEvent.StageId;
            string? chatMessageSkyboxId = chatMessageEvent.SkyboxId;
            string authorizationHeader = chatMessageEvent.AuthorizationHeader;
            Console.WriteLine("authorizationHeader: " + authorizationHeader);

            var jwtTokenValidatorParams = new TokenValidationParameters()
            {
                ValidateIssuer = false,
                ValidateAudience = false,
                ValidateActor = false,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(secretKey))
            };
            try
            {
                TokenValidationResult tokenValidationResult =
                    await validator.ValidateTokenAsync(authorizationHeader, jwtTokenValidatorParams);
                if (tokenValidationResult.IsValid)
                {
                    var jsonToken = validator.ReadJsonWebToken(authorizationHeader);
                    if (jsonToken == null)
                    {
                        Console.WriteLine("Unable to read JWT!");
                        continue;
                    }

                    //Get userId
                    var claimedUserId = jsonToken.Claims.First(claim => claim.Type == "userId");
                    string userId = claimedUserId.Value;

                    var stage = await _streamRepository.GetStage(stageId);

                    if (stage == null)
                    {
                        Console.WriteLine($"Stage is null for stageId: {stageId}");
                        continue;
                    }

                    ChatMessage chatMessageToAdd = new ChatMessage()
                    {
                        VendorEventId = chatMessageEvent.VendorEventId,
                        StageId = stageId,
                        Message = chatMessageEvent.Message,
                        UserId = userId,
                        Timestamp = currentTimestamp
                    };

                    await _chatRepository.AddChatMessage(stageId, stage.CurrentSegment ?? 0, chatMessageToAdd);

                    //Check to see if the user is in a skybox and get the skyboxId and skyboxTier
                    SkyboxIdAndTier? skybox = await _skyboxCache.GetSkyboxIdFromUserId(stageId, userId);
                    string? skyboxId = null;
                    if (skybox != null)
                    {
                        skyboxId = skybox.SkyboxId;
                    }

                    Console.WriteLine($"SkyboxId ${skyboxId} and ChatMessageSkyboxId ${chatMessageSkyboxId}");

                    if (!string.IsNullOrEmpty(skyboxId) && !string.IsNullOrEmpty(chatMessageSkyboxId) && skyboxId == chatMessageSkyboxId)
                    {
                        //Search for emojis
                        string emojiPattern = @"\p{So}|\p{Cs}\p{Cs}(\p{Cf}\p{Cs}\p{Cs})*";

                        // Extract emojis using Regex
                        var matches = Regex.Matches(chatMessageEvent.Message, emojiPattern)
                            .Select(m => m.Value)
                            .ToList();

                        if (matches.Any())
                        {
                            var mostCommonEmoji = matches.GroupBy(e => e)
                                .OrderByDescending(g => g.Count())
                                .First();

                            string emoji = mostCommonEmoji.Key; // Gets the most common emoji
                            int count = mostCommonEmoji.Count(); // Gets the count of that emoji
                            string emojiDictionaryKey = $"{emoji}|{skyboxId}";

                            Console.WriteLine($"Found emoji: {emoji}");

                            //If our dictionary already has the emoji, then increment the value by count
                            if (emojiCounts.ContainsKey(emojiDictionaryKey))
                            {
                                emojiCounts[emojiDictionaryKey] += count;
                            }
                            else //If our dictionary doesn't have the emoji, add it with the count
                            {
                                emojiCounts.Add(emojiDictionaryKey, count);
                            }
                        }
                    }
                }
                else
                {
                    Console.WriteLine($"Token is invalid: {tokenValidationResult.Exception}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Token validation error: {ex.Message}");
            }
        }

        List<SkyboxChatEmoji> skyboxChatEmojis = new List<SkyboxChatEmoji>();
        foreach (var kvp in emojiCounts)
        {
            Console.WriteLine($"Key: {kvp.Key}, Value: {kvp.Value}");

            string emoji = kvp.Key.Split("|")[0];
            string skyboxId = kvp.Key.Split("|")[1];

            SkyboxChatEmoji skyboxChatEmojiToAdd = new SkyboxChatEmoji
            {
                SkyboxId = skyboxId,
                Emoji = emoji,
                EmojiCount = kvp.Value
            };

            skyboxChatEmojis.Add(skyboxChatEmojiToAdd);
        }

        if (skyboxChatEmojis.Count > 0)
        {
            //Send the emojiCounts dictionary to PubNub
            Console.WriteLine($"Emojis: {JsonSerializer.Serialize(skyboxChatEmojis)}");

            BoostSignalMessage boostSignalMessage = new BoostSignalMessage
            {
                BoostEventType = "SkyboxEmoji",
                EventId = stageId,
                SkyboxEmojis = skyboxChatEmojis
            };

            string boostSignalMessageString = JsonSerializer.Serialize(boostSignalMessage);

            Console.WriteLine(boostSignalMessageString);

            bool sendMessageSuccess = await _webSocketService.SendMessageSignalToPlatformClient($"s.{boostSignalMessage.EventId}", "system",
                boostSignalMessageString);
        }

        return true;
    }
}
