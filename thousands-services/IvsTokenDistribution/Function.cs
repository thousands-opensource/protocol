using Amazon.Lambda.Core;
using Amazon.Lambda.APIGatewayEvents;
using System.Text.Json;
using IvsIdleGameShared.Utilities;
using IvsIdleGameShared.Models.TokenDistribution;
using Microsoft.Extensions.DependencyInjection;
using IvsIdleGameShared.Configuration.Interfaces;
using IvsIdleGameShared.Services.Interfaces;
using IvsIdleGameShared.Configuration.Implementations;
using IvsIdleGameShared.Services.Implementations;
using System.Net.Sockets;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Repositories.Interfaces;
using IvsIdleGameShared.Repositories.Implementations;
using IvsIdleGameShared.Models;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace IvsTokenDistribution;

public class TokenDistributionResponse
{
    public bool Success { get; set; } = false;
    public string Err { get; set; } = "";
}

public class Function
{
    private readonly IWebSocketService _websocketService;
    private readonly IStreamRepository _streamRepository;

    private static IServiceProvider? services;

    private readonly string? _platformApiKeyEnvironmentVar;

    public Function()
    {
        _platformApiKeyEnvironmentVar =
           Environment.GetEnvironmentVariable("PLATFORM_API_KEY");

        if (String.IsNullOrEmpty(_platformApiKeyEnvironmentVar))
        {
            Console.WriteLine("PLATFORM_API_KEY Environment Variable is not set!");
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

        serviceCollection.AddSingleton<IChatWebSocketSettings>(x => new PubNubChatWebSocketSettings()
        {
            PublisherKey = chatWebSocketPublisherKeyEnvironmentVar,
            SubscriberKey = chatWebSocketSubscriberKeyEnvironmentVar,
            SecretKey = chatWebSocketSecretKeyEnvironmentVar,
        });
        serviceCollection.AddSingleton<IMongoDbSettings>(x => new MongoDbSettings()
        {
            ConnectionUri = streamRepositoryConnectionUriEnvironmentVar,
            DatabaseName = streamRepositoryDatabaseNameEnvironmentVar,
            StreamsCollectionName = "streams",
        });

        serviceCollection.AddSingleton<IWebSocketService, PubNubWebSocketService>();
        serviceCollection.AddSingleton<IStreamRepository, MongoStreamRepository>();
        services = serviceCollection.BuildServiceProvider();

        _websocketService = services.GetRequiredService<IWebSocketService>();
        _streamRepository = services.GetRequiredService<IStreamRepository>();

    }


    /// <summary>
    /// A simple function that takes a string and does a ToUpper
    /// </summary>
    /// <param name="input">The event for the Lambda function handler to process.</param>
    /// <param name="context">The ILambdaContext that provides methods for logging and describing the Lambda environment.</param>
    /// <returns></returns>
    public async Task<TokenDistributionResponse> FunctionHandler(APIGatewayHttpApiV2ProxyRequest proxyRequest, ILambdaContext context)
    {
        Console.WriteLine($"Serialized JSON: {JsonSerializer.Serialize(proxyRequest)}");

        // Security to make sure the _platformApiKeyEnvironmentVar is set (not empty) and that the incoming x-Api-Key matches the _platformApiKeyEnvironmentVar
        if (String.IsNullOrEmpty(_platformApiKeyEnvironmentVar) || proxyRequest.Headers == null || !proxyRequest.Headers.ContainsKey("x-api-key") || _platformApiKeyEnvironmentVar != proxyRequest.Headers["x-api-key"])
        {
            Console.WriteLine($"Invalid API key received: {proxyRequest.Headers["x-api-key"] ?? "null"}");
            return new TokenDistributionResponse()
            {
                Success = false,
                Err = "Invalid API key"
            };
        }

        // Check null or empty request body
        if (string.IsNullOrEmpty(proxyRequest.Body))
        {
            Console.WriteLine($"Request body is empty. Raw request: {JsonSerializer.Serialize(proxyRequest)}");
            return new TokenDistributionResponse()
            {
                Success = false,
                Err = "Request body is empty."
            };
        }

        // Try catch request body is deserialize properly
        Dictionary<string, Insights> addrToInsights = new Dictionary<string, Insights>();
        TokenDistribution? tokenDistribution;
        try
        {
            tokenDistribution = JsonSerializer.Deserialize<TokenDistribution>(proxyRequest.Body);
            if (tokenDistribution == null)
            {
                Console.WriteLine($"Deserialization of request body resulted in null");
                return new TokenDistributionResponse()
                {
                    Success = false,
                    Err = "Deserialization of request body resulted in null."
                };
            }
        }
        catch (Exception e)
        {
            Console.WriteLine($"Error invalid JSON format - {e.Message}");
            return new TokenDistributionResponse()
            {
                Success = false,
                Err = "Error invalid JSON format: " + e.Message
            };
        }

        Console.WriteLine($"Serialized JSON: {JsonSerializer.Serialize<Insights[]>(tokenDistribution.Insights)}");
        string stageId = tokenDistribution.StageId;
        Stage? stage;
        try
        {
            stage = await _streamRepository.GetStage(stageId);
            if (stage == null)
            {
                Console.WriteLine($"Stage does not exist: stageId {stageId}");
                return new TokenDistributionResponse()
                {
                    Success = false,
                    Err = "Stage does not exist"
                };
            }
        }
        catch (Exception e)
        {
            Console.WriteLine($"Error failed to fetch stage for stageId {stageId}, Error: {e.Message}");
            return new TokenDistributionResponse()
            {
                Success = false,
                Err = $"Error failed to fetch stage stageId {stageId} " + e.Message
            };
        }

        // Send message to everyone: Rally Completed
        string rallyCompletedMsg = "RALLY COMPLETE! Thanks for participating!";
        Channel channel = stage.Channels.First();
        string channelId = channel.Id.ToString();
        await _websocketService.SendChatToPlatformClient($"g.{stageId}.{channelId}", "system", rallyCompletedMsg);

        Console.WriteLine($"Sent system message to channel g.{stageId}.{channelId} with message {rallyCompletedMsg}");

        // Gather mappings for address to insight
        foreach (var insight in tokenDistribution.Insights)
        {
            if (!addrToInsights.ContainsKey(insight.UserId))
            {
                addrToInsights[insight.UserId] = insight;
            }
        }
        Console.WriteLine($"Serialized mapping {JsonSerializer.Serialize(addrToInsights, new JsonSerializerOptions { WriteIndented = true })}");

        // Handle messaging token distribution (e.g. batch limitation)
        List<Task> sendDirectMessagePubnubTasks = new List<Task>();
        List<TopUsers> topUsers = tokenDistribution.DistributionResult.TopUsers;
        foreach (var topUser in topUsers)
        {
            string userId = topUser.UserId;
            int tokenAllocated = topUser.AllocatedTokens;
            string congratulatoryMessage = $"The referee noticed you, check your wallet in a few hours!";
            string message = $"{congratulatoryMessage}";
            if (addrToInsights.ContainsKey(userId))
            {
                Insights insight = addrToInsights[userId];
                string highlightedMessage = insight.Summary;
                message = $"\"{highlightedMessage}\" {congratulatoryMessage}";

            }

            sendDirectMessagePubnubTasks.Add(_websocketService.SendMessageSignalToPlatformClient($"u.{userId}", "system", message));
        }

        try
        {
            await Task.WhenAll(sendDirectMessagePubnubTasks);
        }
        catch (Exception e)
        {
            Console.WriteLine($"Error sending batching messages: {e.Message}");
        }

        return new TokenDistributionResponse
        {
            Success = true,
            Err = ""
        };
    }

    private APIGatewayHttpApiV2ProxyResponse ReturnResponseError()
    {
        return new APIGatewayHttpApiV2ProxyResponse
        {
            StatusCode = 500,
            Body = "",
            Headers = LambdaUtilities.GetCORSHeaders()
        };
    }
}
