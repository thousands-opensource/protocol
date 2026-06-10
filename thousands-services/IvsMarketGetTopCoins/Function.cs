using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Models.Market;
using IvsIdleGameShared.Repositories.Implementations;
using IvsIdleGameShared.Repositories.Interfaces;
using IvsIdleGameShared.Services.Implementations;
using IvsIdleGameShared.Services.Interfaces;
using IvsIdleGameShared.Utilities;
using Microsoft.Extensions.DependencyInjection;
using System.Text.Json;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace IvsMarketGetTopCoins;

public class Function
{
    private readonly IMarketService _marketService;
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
        serviceCollection.AddSingleton<IRedisSettings>(x => new RedisSettings()
        {
            EndPoint = marketServiceEndpointEnvironmentVar,
            Port = marketServicePort,
            Password = marketServicePasswordEnvironmentVar,
            User = marketServiceUserEnvironmentVar,
        });
        serviceCollection.AddSingleton<IMarketCache, RedisMarketCache>();
        serviceCollection.AddSingleton<IMarketService, MarketService>();
        serviceCollection.AddSingleton<IMarketRepository, MongoMarketRepository>();
        serviceCollection.AddSingleton<ICreditBalanceRepository, MongoCreditBalanceRepository>();
        serviceCollection.AddSingleton<IFanVisibilityService, RedisFanVisibilityService>();
        serviceCollection.AddSingleton<ILeaderboardRepository, RedisLeaderboardRepository>();
        serviceCollection.AddSingleton<ILeaderboardService, LeaderboardService>();
        services = serviceCollection.BuildServiceProvider();

        _marketService = services.GetRequiredService<IMarketService>();
    }

    /// <summary>
    /// Get a list of the top valued stream coins
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

        List<CoinPrice> topCoins = await _marketService.GetTopCoins();

        //Return the list of top coins
        return new APIGatewayProxyResponse
        {
            StatusCode = 200,
            Body = JsonSerializer.Serialize(topCoins),
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
