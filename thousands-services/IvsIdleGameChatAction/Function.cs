using System.Text.Json;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Configuration.Implementations;
using IvsIdleGameShared.Configuration.Interfaces;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Models.IdleGame;
using IvsIdleGameShared.Models.Market;
using IvsIdleGameShared.Repositories.Implementations;
using IvsIdleGameShared.Repositories.Interfaces;
using IvsIdleGameShared.Services.Implementations;
using IvsIdleGameShared.Services.Interfaces;
using IvsIdleGameShared.Utilities;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace IvsIdleGameChatAction;

public class IdleGameChatActionRequest
{
    public Guid PriceQuoteGuid { get; set; } = Guid.Empty;
    public string StreamId { get; set; } = "";
    public string EventId { get; set; } = "";
    public string VendorEventId { get; set; } = "";
    public string Command { get; set; } = "";
    public string? ChatActionGuid { get; set; } = null;
}

public class Function
{
    private readonly IMarketService _marketService;
    private readonly IIdleGameService _idleGameService;
    private readonly IWebSocketService _websocketService;
    private static IServiceProvider? services;

    public Function()
    {
        string? marketServiceEndpointEnvironmentVar =
            Environment.GetEnvironmentVariable("MARKET_SERVICE_ENDPOINT");

        if (String.IsNullOrEmpty(marketServiceEndpointEnvironmentVar))
        {
            Console.WriteLine("MARKET_SERVICE_ENDPOINT Environment Variable is not set!");
        }

        string? marketServicePortEnvironmentVar =
            Environment.GetEnvironmentVariable("MARKET_SERVICE_PORT");

        int marketServicePort = 0;
        if (!String.IsNullOrEmpty(marketServicePortEnvironmentVar))
        {
            marketServicePort = int.Parse(marketServicePortEnvironmentVar);
        }
        else
        {
            Console.WriteLine("MARKET_SERVICE_PORT Environment Variable is not set!");
        }

        string? marketServicePasswordEnvironmentVar =
            Environment.GetEnvironmentVariable("MARKET_SERVICE_PASSWORD");

        if (String.IsNullOrEmpty(marketServicePasswordEnvironmentVar))
        {
            Console.WriteLine("MARKET_SERVICE_PASSWORD Environment Variable is not set!");
        }

        string? marketServiceUserEnvironmentVar =
            Environment.GetEnvironmentVariable("MARKET_SERVICE_USER");

        if (String.IsNullOrEmpty(marketServiceUserEnvironmentVar))
        {
            Console.WriteLine("MARKET_SERVICE_USER Environment Variable is not set!");
        }

        string? marketRepositoryConnectionUriEnvironmentVar =
            Environment.GetEnvironmentVariable("MARKET_REPOSITORY_CONNECTION_URI");

        if (String.IsNullOrEmpty(marketRepositoryConnectionUriEnvironmentVar))
        {
            Console.WriteLine("MARKET_REPOSITORY_CONNECTION_URI Environment Variable is not set!");
        }

        string? marketRepositoryDatabaseNameEnvironmentVar =
            Environment.GetEnvironmentVariable("MARKET_REPOSITORY_DATABASE_NAME");

        if (String.IsNullOrEmpty(marketRepositoryDatabaseNameEnvironmentVar))
        {
            Console.WriteLine("MARKET_REPOSITORY_DATABASE_NAME Environment Variable is not set!");
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

        var serviceCollection = new ServiceCollection();
        serviceCollection.AddSingleton<IMongoDbSettings>(x => new MongoDbSettings()
        {
            ConnectionUri = marketRepositoryConnectionUriEnvironmentVar,
            DatabaseName = marketRepositoryDatabaseNameEnvironmentVar,
            StreamsCollectionName = "streams",
            UsersCollectionName = "users",
            EventsCollectionName = "stages",
            EventIdleEventsCollectionName = "event-idle-events",
            MarketTransactionsCollectionName = "market-transactions",
            UserCoinsCollectionName = "user-coins",
            CreditBalanceCollectionName = "credit-balances",
            CreditTransactionCollectionName = "credit-transactions"
        });
        serviceCollection.AddSingleton<IChatWebSocketSettings>(x => new PubNubChatWebSocketSettings()
        {
            PublisherKey = chatWebSocketPublisherKeyEnvironmentVar,
            SubscriberKey = chatWebSocketSubscriberKeyEnvironmentVar,
            SecretKey = chatWebSocketSecretKeyEnvironmentVar,
        });
        serviceCollection.AddSingleton<IRedisSettings>(x => new RedisSettings()
        {
            EndPoint = marketServiceEndpointEnvironmentVar,
            Port = marketServicePort,
            Password = marketServicePasswordEnvironmentVar,
            User = marketServiceUserEnvironmentVar,
        });
        serviceCollection.AddSingleton<IIdleEventProcessor, IdleEventProcessor>();
        serviceCollection.AddSingleton<IMarketCache, RedisMarketCache>();
        serviceCollection.AddSingleton<IMarketService, MarketService>();
        serviceCollection.AddSingleton<IMarketRepository, MongoMarketRepository>();
        serviceCollection.AddSingleton<ICreditBalanceRepository, MongoCreditBalanceRepository>();
        serviceCollection.AddSingleton<IFanVisibilityService, RedisFanVisibilityService>();
        serviceCollection.AddSingleton<ILeaderboardRepository, RedisLeaderboardRepository>();
        serviceCollection.AddSingleton<ILeaderboardService, LeaderboardService>();
        serviceCollection.AddScoped<IIdleGameRepository, RedisIdleGameRepository>();
        serviceCollection.AddScoped<IIdleGameActionsRepository, MongoIdleGameActionsRepository>();
        serviceCollection.AddSingleton<IIdleGameService, IdleGameService>();
        serviceCollection.AddSingleton<IWebSocketService, PubNubWebSocketService>();
        services = serviceCollection.BuildServiceProvider();

        _marketService = services.GetRequiredService<IMarketService>();
        _idleGameService = services.GetRequiredService<IIdleGameService>();
        _websocketService = services.GetRequiredService<IWebSocketService>();
    }

    /// <summary>
    /// A simple function that takes a string and does a ToUpper
    /// </summary>
    /// <param name="proxyRequest">The event for the Lambda function handler to process.</param>
    /// <param name="context">The ILambdaContext that provides methods for logging and describing the Lambda environment.</param>
    /// <returns></returns>
    public async Task<APIGatewayProxyResponse> FunctionHandler(APIGatewayProxyRequest proxyRequest, ILambdaContext context)
    {
        //Verify the JWT token and extract the userId
        ThousandsJwt thousandsJwt = await LambdaUtilities.VerifyWildcardAccessTokenInProxyRequestAndGetUserId(proxyRequest);
        string userId = thousandsJwt.UserId;

        //Make sure we have a userId
        if (string.IsNullOrEmpty(userId))
        {
            Console.WriteLine("Missing userId!");
            return ReturnResponseError();
        }

        //Get the incoming IdleGameChatActionRequest
        IdleGameChatActionRequest? idleGameChatActionRequest = JsonSerializer.Deserialize<IdleGameChatActionRequest>(proxyRequest.Body);
        if (idleGameChatActionRequest == null)
        {
            Console.WriteLine("Error deserializing IdleGameChatActionRequest!");
            return ReturnResponseError();
        }
        if (string.IsNullOrEmpty(idleGameChatActionRequest.Command))
        {
            Console.WriteLine("Missing Command in IdleGameChatActionRequest!");
            return ReturnResponseError();
        }
        if (string.IsNullOrEmpty(idleGameChatActionRequest.EventId))
        {
            Console.WriteLine("Missing EventId in IdleGameChatActionRequest!");
            return ReturnResponseError();
        }

        Guid priceQuoteGuid = idleGameChatActionRequest.PriceQuoteGuid;
        string eventId = idleGameChatActionRequest.EventId;
        string streamId = idleGameChatActionRequest.StreamId;
        string vendorEventId = idleGameChatActionRequest.VendorEventId;
        string command = idleGameChatActionRequest.Command;
        string? chatActionGuid = idleGameChatActionRequest.ChatActionGuid;
        string coinName = command;

        //PriceQuote priceQuote = await _marketService.GetPriceQuote(userId, coinName, 1, "buy", "1/x^n");

        PlaceOrderResult placeOrderResult = await _marketService.PlaceOrder(eventId, userId, priceQuoteGuid, coinName, 1, "buy", "1/x^n");

        IdleGamePlayerActionResponse idleGamePlayerActionResponse = new IdleGamePlayerActionResponse();

        if (placeOrderResult.WasOrderPlaced)
        {
            idleGamePlayerActionResponse = await _idleGameService.PlayerAction(eventId, vendorEventId, userId, command);
            idleGamePlayerActionResponse.PlaceOrderResult = placeOrderResult;

            //This is the Wildcard chat app, so send a chat message with the new supply value out to all the players
            //string channelName = "g.6750c1d54426d502a9889b5f.6750c1d54426d502a9889b60"; //$"group.{eventId}.system";
            //string channelName = "g.67662b7dadcc0e02b880cfa1.67662b7dadcc0e02b880cfa2";
            string channelName = $"g.{eventId}.";
            string messageToSend = $"{coinName}:{placeOrderResult.UpdatedSupply}:{idleGamePlayerActionResponse.StreamScore}";
            await _websocketService.SendSignalToPlatformClient(channelName, "chat-app", messageToSend);
        }

        return new APIGatewayProxyResponse
        {
            StatusCode = 200,
            Body = JsonSerializer.Serialize(idleGamePlayerActionResponse),
            Headers = LambdaUtilities.GetCORSHeaders()
        };
    }

    private APIGatewayProxyResponse ReturnResponseError()
    {
        return new APIGatewayProxyResponse
        {
            StatusCode = 500,
            Body = "",
            Headers = LambdaUtilities.GetCORSHeaders()
        };
    }
}
