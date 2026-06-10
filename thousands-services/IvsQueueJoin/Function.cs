using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Models.Market;
using IvsIdleGameShared.Repositories.Implementations;
using IvsIdleGameShared.Repositories.Interfaces;
using IvsIdleGameShared.Services.Implementations;
using IvsIdleGameShared.Services.Interfaces;
using IvsIdleGameShared.Utilities;
using Microsoft.Extensions.DependencyInjection;
using System.Text.Json;
using IvsIdleGameShared.Models.Queue;
using IvsIdleGameShared.Models;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace IvsQueueJoin;

public class JoinQueueRequest
{
    public string QueueId { get; set; }
}

public class Function
{
    private readonly IQueueService _queueService;
    private static IServiceProvider? services;

    public Function()
    {
        string? queueServiceEndpointEnvironmentVar =
            Environment.GetEnvironmentVariable("QUEUE_SERVICE_ENDPOINT");

        if (String.IsNullOrEmpty(queueServiceEndpointEnvironmentVar))
        {
            Console.WriteLine("QUEUE_SERVICE_ENDPOINT Environment Variable is not set!");
        }

        string? queueServicePortEnvironmentVar =
            Environment.GetEnvironmentVariable("QUEUE_SERVICE_PORT");

        int queueServicePort = 0;
        if (!String.IsNullOrEmpty(queueServicePortEnvironmentVar))
        {
            queueServicePort = int.Parse(queueServicePortEnvironmentVar);
        }
        else
        {
            Console.WriteLine("QUEUE_SERVICE_PORT Environment Variable is not set!");
        }

        string? queueServicePasswordEnvironmentVar =
            Environment.GetEnvironmentVariable("QUEUE_SERVICE_PASSWORD");

        if (String.IsNullOrEmpty(queueServicePasswordEnvironmentVar))
        {
            Console.WriteLine("QUEUE_SERVICE_PASSWORD Environment Variable is not set!");
        }

        string? queueServiceUserEnvironmentVar =
            Environment.GetEnvironmentVariable("QUEUE_SERVICE_USER");

        if (String.IsNullOrEmpty(queueServiceUserEnvironmentVar))
        {
            Console.WriteLine("QUEUE_SERVICE_USER Environment Variable is not set!");
        }

        string? ticketRepositoryConnectionUriEnvironmentVar =
            Environment.GetEnvironmentVariable("TICKET_REPOSITORY_CONNECTION_URI");

        if (String.IsNullOrEmpty(ticketRepositoryConnectionUriEnvironmentVar))
        {
            Console.WriteLine("TICKET_REPOSITORY_CONNECTION_URI Environment Variable is not set!");
        }

        string? ticketRepositoryDatabaseNameEnvironmentVar =
            Environment.GetEnvironmentVariable("TICKET_REPOSITORY_DATABASE_NAME");

        if (String.IsNullOrEmpty(ticketRepositoryDatabaseNameEnvironmentVar))
        {
            Console.WriteLine("TICKET_REPOSITORY_DATABASE_NAME Environment Variable is not set!");
        }

        var serviceCollection = new ServiceCollection();
        serviceCollection.AddSingleton<IMongoDbSettings>(x => new MongoDbSettings()
        {
            ConnectionUri = ticketRepositoryConnectionUriEnvironmentVar,
            DatabaseName = ticketRepositoryDatabaseNameEnvironmentVar,
            StreamsCollectionName = "streams",
            UsersCollectionName = "users",
            EventsCollectionName = "stages",
            EventIdleEventsCollectionName = "event-idle-events",
            MarketTransactionsCollectionName = "market-transactions",
            UserCoinsCollectionName = "user-coins",
            CreditBalanceCollectionName = "credit-balances",
            AccessCodesCollectionName = "access-codes",
            ClaimedTicketsCollectionName = "claimed-tickets"
        });
        serviceCollection.AddSingleton<IRedisSettings>(x => new RedisSettings()
        {
            EndPoint = queueServiceEndpointEnvironmentVar,
            Port = queueServicePort,
            Password = queueServicePasswordEnvironmentVar,
            User = queueServiceUserEnvironmentVar,
        });
        serviceCollection.AddSingleton<IRedisDbProvider, RedisDbProvider>();
        serviceCollection.AddSingleton<ITicketRepository, MongoTicketRepository>();
        serviceCollection.AddSingleton<IStreamRepository, MongoStreamRepository>();
        serviceCollection.AddSingleton<IQueueRepository, RedisQueueRepository>();
        serviceCollection.AddSingleton<IQueueService, QueueService>();
        serviceCollection.AddSingleton<IFanVisibilityService, RedisFanVisibilityService>();
        services = serviceCollection.BuildServiceProvider();

        _queueService = services.GetRequiredService<IQueueService>();
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

        //Get the incoming JoinQueueRequest
        JoinQueueRequest? joinQueueRequest = JsonSerializer.Deserialize<JoinQueueRequest>(proxyRequest.Body);
        if (joinQueueRequest == null)
        {
            Console.WriteLine("Error deserializing JoinQueueRequest!");
            return ReturnResponseError();
        }

        //Make sure we have a queueId
        if (string.IsNullOrWhiteSpace(joinQueueRequest.QueueId))
        {
            Console.WriteLine("Invalid queueId!");
            return ReturnResponseError();
        }

        PositionInQueue positionInQueue = await _queueService.JoinQueue(joinQueueRequest.QueueId, userId);

        //Return the price quote
        return new APIGatewayProxyResponse
        {
            StatusCode = 200,
            Body = JsonSerializer.Serialize(positionInQueue),
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
