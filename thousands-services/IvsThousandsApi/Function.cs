using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using IvsIdleGameShared.Models.Response;
using IvsIdleGameShared.Utilities;
using Microsoft.Extensions.DependencyInjection;
using PubnubApi.EventEngine.Subscribe.Common;
using System.Text.Json;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Models.Request;
using static MongoDB.Libmongocrypt.CryptContext;
using IvsIdleGameShared.Repositories.Implementations;
using IvsIdleGameShared.Repositories.Interfaces;
using IvsIdleGameShared.Services.Implementations;
using IvsIdleGameShared.Services.Interfaces;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace IvsThousandsApi;



public class Function
{
    private readonly IThousandsApiService _thousandsApiService;
    private readonly string _thousandsApiKey;
    private static IServiceProvider? services;

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

        string? thousandsApiKeyEnvironmentVar =
            System.Environment.GetEnvironmentVariable("THOUSANDS_API_KEY");

        if (String.IsNullOrEmpty(thousandsApiKeyEnvironmentVar))
        {
            Console.WriteLine("THOUSANDS_API_KEY Environment Variable is not set!");
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
            CreditBalanceCollectionName = "credit-balances",
            CreditTransactionCollectionName = "credit-transactions",
            BoostsSegmentsCollectionName = "boosts-segments",
            ChatMessagesSegmentsCollectionName = "chat-messages-segments",
            ChatReactionsSegmentsCollectionName = "chat-reactions-segments",
            SkyboxesCollectionName = "skyboxes",
            RallyPredictionCollectionName = "rally-predictions",
            UserRallyPredictionCollectionName = "user-rally-predictions",
            PredictionChartDataCollectionName = "prediction-chart-data"
        });
        serviceCollection.AddSingleton<IStreamRepository, MongoStreamRepository>();
        serviceCollection.AddSingleton<IUserRepository, MongoUserRepository>();
        serviceCollection.AddSingleton<ICreditBalanceRepository, MongoCreditBalanceRepository>();
        serviceCollection.AddSingleton<IBoostRepository, MongoBoostRepository>();
        serviceCollection.AddSingleton<IChatRepository, MongoChatRepository>();
        serviceCollection.AddSingleton<IRallyPredictionRepository, MongoRallyPredictionRepository>();
        serviceCollection.AddSingleton<IThousandsApiService, ThousandsApiService>();
        services = serviceCollection.BuildServiceProvider();

        _thousandsApiService = services.GetRequiredService<IThousandsApiService>();
        _thousandsApiKey = thousandsApiKeyEnvironmentVar ?? "fbbeaa07-3e59-4187-bfbd-aff7bb06dd68";
    }

    /// <summary>
    /// Get a list of events matching the filter criteria
    /// </summary>
    /// <param name="proxyRequest">The event for the Lambda function handler to process.</param>
    /// <param name="context">The ILambdaContext that provides methods for logging and describing the Lambda environment.</param>
    /// <returns></returns>
    public async Task<APIGatewayProxyResponse> GetEventsHandler(APIGatewayProxyRequest proxyRequest, ILambdaContext context)
    {
        Console.WriteLine($"ThousandsInfo: Raw Request - {JsonSerializer.Serialize(proxyRequest)}");

        if (!proxyRequest.Headers.ContainsKey("x-api-key"))
        {
            return ThousandsGetEventsResponse("Missing x-api-key", null, 403);
        }
        if (proxyRequest.Headers["x-api-key"] != _thousandsApiKey)
        {
            return ThousandsGetEventsResponse("Invalid x-api-key", null, 403);
        }

        var getEventsRequest = DeserializeGetEventsQueryParams(proxyRequest);

        Console.WriteLine(JsonSerializer.Serialize(getEventsRequest));

        var response = await _thousandsApiService.GetEvents(getEventsRequest);

        return new APIGatewayProxyResponse
        {
            StatusCode = 200,
            Body = JsonSerializer.Serialize(response),
            Headers = LambdaUtilities.GetCORSHeaders()
        };
    }

    /// <summary>
    /// Get a user matching the filter criteria
    /// </summary>
    /// <param name="proxyRequest">The event for the Lambda function handler to process.</param>
    /// <param name="context">The ILambdaContext that provides methods for logging and describing the Lambda environment.</param>
    /// <returns></returns>
    public async Task<APIGatewayProxyResponse> GetUsersHandler(APIGatewayProxyRequest proxyRequest, ILambdaContext context)
    {
        Console.WriteLine($"ThousandsInfo: Raw Request - {JsonSerializer.Serialize(proxyRequest)}");

        if (!proxyRequest.Headers.ContainsKey("x-api-key"))
        {
            return ThousandsGetEventsResponse("Missing x-api-key", null, 403);
        }
        if (proxyRequest.Headers["x-api-key"] != _thousandsApiKey)
        {
            return ThousandsGetEventsResponse("Invalid x-api-key", null, 403);
        }

        var getUserRequest = DeserializeGetUsersQueryParams(proxyRequest);

        Console.WriteLine(JsonSerializer.Serialize(getUserRequest));

        var response = await _thousandsApiService.GetUsers(getUserRequest);

        return new APIGatewayProxyResponse
        {
            StatusCode = 200,
            Body = JsonSerializer.Serialize(response),
            Headers = LambdaUtilities.GetCORSHeaders()
        };
    }

    /// <summary>
    /// Get the credits a user has purchased
    /// </summary>
    /// <param name="proxyRequest">The event for the Lambda function handler to process.</param>
    /// <param name="context">The ILambdaContext that provides methods for logging and describing the Lambda environment.</param>
    /// <returns></returns>
    public async Task<APIGatewayProxyResponse> GetCreditsPurchasedHandler(APIGatewayProxyRequest proxyRequest, ILambdaContext context)
    {
        Console.WriteLine($"ThousandsInfo: Raw Request - {JsonSerializer.Serialize(proxyRequest)}");

        if (!proxyRequest.Headers.ContainsKey("x-api-key"))
        {
            return ThousandsGetEventsResponse("Missing x-api-key", null, 403);
        }
        if (proxyRequest.Headers["x-api-key"] != _thousandsApiKey)
        {
            return ThousandsGetEventsResponse("Invalid x-api-key", null, 403);
        }

        var getCreditsPurchasedRequest = DeserializeGetCreditsPurchasedParams(proxyRequest);

        Console.WriteLine(JsonSerializer.Serialize(getCreditsPurchasedRequest));

        var response = await _thousandsApiService.GetCreditsPurchased(getCreditsPurchasedRequest);

        return new APIGatewayProxyResponse
        {
            StatusCode = 200,
            Body = JsonSerializer.Serialize(response),
            Headers = LambdaUtilities.GetCORSHeaders()
        };
    }

    /// <summary>
    /// Get the credits spent during an event
    /// </summary>
    /// <param name="proxyRequest">The event for the Lambda function handler to process.</param>
    /// <param name="context">The ILambdaContext that provides methods for logging and describing the Lambda environment.</param>
    /// <returns></returns>
    public async Task<APIGatewayProxyResponse> GetCreditsSpentHandler(APIGatewayProxyRequest proxyRequest, ILambdaContext context)
    {
        Console.WriteLine($"ThousandsInfo: Raw Request - {JsonSerializer.Serialize(proxyRequest)}");

        if (!proxyRequest.Headers.ContainsKey("x-api-key"))
        {
            return ThousandsGetEventsResponse("Missing x-api-key", null, 403);
        }
        if (proxyRequest.Headers["x-api-key"] != _thousandsApiKey)
        {
            return ThousandsGetEventsResponse("Invalid x-api-key", null, 403);
        }

        var getCreditsSpentRequest = DeserializeGetCreditsSpentParams(proxyRequest);

        Console.WriteLine(JsonSerializer.Serialize(getCreditsSpentRequest));

        var response = await _thousandsApiService.GetCreditsSpent(getCreditsSpentRequest);

        return new APIGatewayProxyResponse
        {
            StatusCode = 200,
            Body = JsonSerializer.Serialize(response),
            Headers = LambdaUtilities.GetCORSHeaders()
        };
    }

    /// <summary>
    /// Get the chat message from an event
    /// </summary>
    /// <param name="proxyRequest">The event for the Lambda function handler to process.</param>
    /// <param name="context">The ILambdaContext that provides methods for logging and describing the Lambda environment.</param>
    /// <returns></returns>
    public async Task<APIGatewayProxyResponse> GetChatMessageHandler(APIGatewayProxyRequest proxyRequest, ILambdaContext context)
    {
        Console.WriteLine($"ThousandsInfo: Raw Request - {JsonSerializer.Serialize(proxyRequest)}");

        if (!proxyRequest.Headers.ContainsKey("x-api-key"))
        {
            return ThousandsGetEventsResponse("Missing x-api-key", null, 403);
        }
        if (proxyRequest.Headers["x-api-key"] != _thousandsApiKey)
        {
            return ThousandsGetEventsResponse("Invalid x-api-key", null, 403);
        }

        var getChatMessagesRequest = DeserializeGetChatMessageParams(proxyRequest);

        Console.WriteLine(JsonSerializer.Serialize(getChatMessagesRequest));

        var response = await _thousandsApiService.GetChatMessages(getChatMessagesRequest);

        return new APIGatewayProxyResponse
        {
            StatusCode = 200,
            Body = JsonSerializer.Serialize(response),
            Headers = LambdaUtilities.GetCORSHeaders()
        };
    }

    /// <summary>
    /// Get calls for forecasts
    /// </summary>
    /// <param name="proxyRequest">The event for the Lambda function handler to process.</param>
    /// <param name="context">The ILambdaContext that provides methods for logging and describing the Lambda environment.</param>
    /// <returns></returns>
    public async Task<APIGatewayProxyResponse> GetCallsForForecastsHandler(APIGatewayProxyRequest proxyRequest, ILambdaContext context)
    {
        Console.WriteLine($"ThousandsInfo: Raw Request - {JsonSerializer.Serialize(proxyRequest)}");

        if (!proxyRequest.Headers.ContainsKey("x-api-key"))
        {
            return ThousandsGetEventsResponse("Missing x-api-key", null, 403);
        }
        if (proxyRequest.Headers["x-api-key"] != _thousandsApiKey)
        {
            return ThousandsGetEventsResponse("Invalid x-api-key", null, 403);
        }

        var getCallsForForecastsRequest = DeserializeGetCallsForForecastsParams(proxyRequest);

        Console.WriteLine(JsonSerializer.Serialize(getCallsForForecastsRequest));

        var response = await _thousandsApiService.GetCallsForForecasts(getCallsForForecastsRequest);

        return new APIGatewayProxyResponse
        {
            StatusCode = 200,
            Body = JsonSerializer.Serialize(response),
            Headers = LambdaUtilities.GetCORSHeaders()
        };
    }

    private static GetCallsForForecastsRequest DeserializeGetCallsForForecastsParams(APIGatewayProxyRequest request)
    {
        var json = JsonSerializer.Serialize(request.QueryStringParameters);
        return JsonSerializer.Deserialize<GetCallsForForecastsRequest>(json) ?? new GetCallsForForecastsRequest();
    }

    private static GetChatMessagesRequest DeserializeGetChatMessageParams(APIGatewayProxyRequest request)
    {
        var json = JsonSerializer.Serialize(request.QueryStringParameters);
        return JsonSerializer.Deserialize<GetChatMessagesRequest>(json) ?? new GetChatMessagesRequest();
    }

    private static GetCreditsSpentRequest DeserializeGetCreditsSpentParams(APIGatewayProxyRequest request)
    {
        var json = JsonSerializer.Serialize(request.QueryStringParameters);
        return JsonSerializer.Deserialize<GetCreditsSpentRequest>(json) ?? new GetCreditsSpentRequest();
    }

    private static GetCreditsPurchasedRequest DeserializeGetCreditsPurchasedParams(APIGatewayProxyRequest request)
    {
        var json = JsonSerializer.Serialize(request.QueryStringParameters);
        return JsonSerializer.Deserialize<GetCreditsPurchasedRequest>(json) ?? new GetCreditsPurchasedRequest();
    }

    private static GetUsersRequest DeserializeGetUsersQueryParams(APIGatewayProxyRequest request)
    {
        var json = JsonSerializer.Serialize(request.QueryStringParameters);
        return JsonSerializer.Deserialize<GetUsersRequest>(json) ?? new GetUsersRequest();
    }


    private static GetEventsRequest DeserializeGetEventsQueryParams(APIGatewayProxyRequest request)
    {
        var json = JsonSerializer.Serialize(request.QueryStringParameters);
        return JsonSerializer.Deserialize<GetEventsRequest>(json) ?? new GetEventsRequest();
    }


    private APIGatewayProxyResponse ThousandsGetEventsResponse(string message, GetEventsResponse? response = null, int statusCode = 500)
    {
        Console.WriteLine(message);
        GetEventsResponse voteStartResponse = response ?? new GetEventsResponse()
        {
            Message = message,
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
