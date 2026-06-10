using System.Text.Json;
using Amazon.Lambda.Core;
using System.Text.Json.Serialization;
using Amazon.Lambda.SQSEvents;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.DependencyInjection;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Repositories.Interfaces;
using IvsIdleGameShared.Repositories.Implementations;
using IvsIdleGameShared.Models.Chat;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace IvsProcessChatReactions;

public class ChatReactionEvent
{
    [JsonPropertyName("vendorEventId")]
    public string VendorEventId { get; set; } = "";

    [JsonPropertyName("stageId")]
    public string StageId { get; set; } = "";

    [JsonPropertyName("originalMessage")]
    public string OriginalMessage { get; set; } = "";

    [JsonPropertyName("originalMessageUserId")]
    public string OriginalMessageUserId { get; set; } = "";

    [JsonPropertyName("emoji")]
    public string Emoji { get; set; } = "";

    [JsonPropertyName("emojiAddedOrRemoved")]
    public bool EmojiAddedOrRemoved { get; set; } = false;

    [JsonPropertyName("authorizationHeader")]
    public string AuthorizationHeader { get; set; } = "";

}

public class Function
{
    private static IServiceProvider services { get; set; }
    private readonly IStreamRepository _streamRepository;
    private readonly IChatRepository _chatRepository;

    public Function()
    {
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

        var serviceCollection = new ServiceCollection();
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
        serviceCollection.AddSingleton<IStreamRepository, MongoStreamRepository>();
        serviceCollection.AddSingleton<IChatRepository, MongoChatRepository>();
        services = serviceCollection.BuildServiceProvider();

        _streamRepository = services.GetRequiredService<IStreamRepository>();
        _chatRepository = services.GetRequiredService<IChatRepository>();
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

        foreach (var message in events.Records)
        {
            ChatReactionEvent? chatReactionEvent = JsonSerializer.Deserialize<ChatReactionEvent>(message.Body);

            if (chatReactionEvent == null)
            {
                Console.WriteLine("chatReactionEvent is null!");
                continue;
            }

            Console.WriteLine(JsonSerializer.Serialize(chatReactionEvent));
            string stageId = chatReactionEvent.StageId;
            string authorizationHeader = chatReactionEvent.AuthorizationHeader;
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

                    ChatReaction chatReactionToAdd = new ChatReaction()
                    {
                        VendorEventId = chatReactionEvent.VendorEventId,
                        StageId = stageId,
                        OriginalMessage = chatReactionEvent.OriginalMessage,
                        OriginalMessageUserId = chatReactionEvent.OriginalMessageUserId,
                        Emoji = chatReactionEvent.Emoji,
                        EmojiAddedOrRemoved = chatReactionEvent.EmojiAddedOrRemoved,
                        UserId = userId,
                        Timestamp = currentTimestamp
                    };

                    await _chatRepository.AddChatReaction(stageId, stage.CurrentSegment ?? 0, chatReactionToAdd);
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

        return true;
    }
}
