using System.Text.Json;
using Amazon.Lambda.Core;
using System.Text.Json.Serialization;
using IvsIdleGameShared.Repositories.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Configuration.Implementations;
using IvsIdleGameShared.Repositories.Implementations;
using IvsIdleGameShared.Configuration.Interfaces;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Services.Interfaces;
using IvsIdleGameShared.Services.Implementations;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace IvsStreamStartedHandler;

public class EventDetail
{
    [JsonPropertyName("event_name")]
    public string? EventName { get; set; }

    [JsonPropertyName("channel_name")]
    public string? ChannelName { get; set; }
    
    [JsonPropertyName("stream_id")]
    public string? StreamId { get; set; }
}

public class Request
{
    public string? Name { get; set; }
    public string[]? Resources { get; set; }
    [JsonPropertyName("detail")]
    public EventDetail? EventDetail { get; set; }

}

public class Function
{
    private static IServiceProvider services { get; set; }
    private readonly IStreamRepository _streamsRepository;
    private readonly IWebSocketService _webSocketService;

    public Function()
    {
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
            ConnectionUri = streamRepositoryConnectionUriEnvironmentVar,
            DatabaseName = streamRepositoryDatabaseNameEnvironmentVar,
            StreamsCollectionName = "streams"
        });
        serviceCollection.AddSingleton<IChatWebSocketSettings>(x => new PubNubChatWebSocketSettings()
        {
            PublisherKey = chatWebSocketPublisherKeyEnvironmentVar,
            SubscriberKey = chatWebSocketSubscriberKeyEnvironmentVar,
            SecretKey = chatWebSocketSecretKeyEnvironmentVar,
        });
        serviceCollection.AddSingleton<IStreamRepository, MongoStreamRepository>();
        serviceCollection.AddSingleton<IWebSocketService, PubNubWebSocketService>();
        services = serviceCollection.BuildServiceProvider();

        _streamsRepository = services.GetRequiredService<IStreamRepository>();
        _webSocketService = services.GetRequiredService<IWebSocketService>();
    }

    /// <summary>
    /// A simple function that takes a string and does a ToUpper
    /// </summary>
    /// <param name="input">The event for the Lambda function handler to process.</param>
    /// <param name="context">The ILambdaContext that provides methods for logging and describing the Lambda environment.</param>
    /// <returns></returns>
    public async Task<string> FunctionHandler(Request request, ILambdaContext context)
    {
        Console.WriteLine(JsonSerializer.Serialize(request));

        if (request?.EventDetail?.EventName == "Stream Start" || request?.EventDetail?.EventName == "Stream End")
        {
            Console.WriteLine("Stream Start");

            string messageToSend = (request?.EventDetail?.EventName == "Stream Start" ? "streamstart" : "streamend");

            string? channelArn = request?.Resources?.First();

            if (channelArn == null)
            {
                Console.WriteLine("Couldn't parse channelArn");
                return "";
            }

            Console.WriteLine($"channelArn: {channelArn}");

            EventStream stream = await _streamsRepository.GetStreamFromChannelArn(channelArn);

            Console.WriteLine(JsonSerializer.Serialize(stream));

            string stageId = stream?.StageId?.ToString() ?? "";

            if (string.IsNullOrEmpty(stageId))
            {
                Console.WriteLine("Couldn't parse stageId");
                return "";
            }

            Console.WriteLine($"stream.stageId: {stream?.StageId}");

            string channelName = $"s.{stageId}";
            await _webSocketService.SendSignalToPlatformClient(channelName, "ivs-stream-started-handler", messageToSend);
        }

        return "";
    }
}
