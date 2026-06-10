using Amazon.Lambda.Core;
using Amazon.IVSRealTime;
using System.Text.Json;
using System.Text.Json.Serialization;
using Amazon.IVSRealTime.Model;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Repositories.Implementations;
using IvsIdleGameShared.Repositories.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using IvsIdleGameShared.Models;
using MongoDB.Bson;


// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace IvsStagePublishingStartedHandler;

public class EventDetail
{
    [JsonPropertyName("session_id")]
    public string? SessionId { get; set; }
    [JsonPropertyName("event_name")]
    public string? EventName { get; set; }
    [JsonPropertyName("user_id")]
    public string? UserId { get; set; }
    [JsonPropertyName("participant_id")]
    public string? ParticipantId { get; set; }
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
    private readonly string _encoderConfigurationArn;

    public Function()
    {
        string? encoderConfigurationArnEnvironmentVar =
            Environment.GetEnvironmentVariable("IVS_ENCODER_CONFIGURATION_ARN");

        if (!String.IsNullOrEmpty(encoderConfigurationArnEnvironmentVar))
        {
            _encoderConfigurationArn = encoderConfigurationArnEnvironmentVar;
        }
        else
        {
            Console.WriteLine("IVS_ENCODER_CONFIGURATION_ARN Environment Variable is not set!");
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

        var serviceCollection = new ServiceCollection();
        serviceCollection.AddSingleton<IMongoDbSettings>(x => new MongoDbSettings()
        {
            ConnectionUri = streamRepositoryConnectionUriEnvironmentVar,
            DatabaseName = streamRepositoryDatabaseNameEnvironmentVar,
            StreamsCollectionName = "streams"
        });
        serviceCollection.AddTransient<IStreamRepository, MongoStreamRepository>();
        services = serviceCollection.BuildServiceProvider();

        _streamsRepository = services.GetRequiredService<IStreamRepository>();
    }
    
    /// <summary>
    /// A simple function that takes a string and does a ToUpper
    /// </summary>
    /// <param name="input">The event for the Lambda function handler to process.</param>
    /// <param name="context">The ILambdaContext that provides methods for logging and describing the Lambda environment.</param>
    /// <returns></returns>
    public async Task<string> FunctionHandler(Request request, ILambdaContext context)
    {
        if (request?.EventDetail?.EventName == "Participant Published")
        {
            Console.WriteLine("Participant Published");

            if (request.Resources == null || request.Resources.Length < 1)
            {
                return "fail";
            }

            string stageArn = request.Resources.First();

            //Console.WriteLine(stageArn);

            EventStream stream = await _streamsRepository.GetStreamFromStageArn(stageArn);

            if (stream.Id == ObjectId.Empty)
            {
                Console.WriteLine($"Couldn't find stream for stageArn: {stageArn}");
                return "fail";
            }

            //Console.WriteLine(JsonSerializer.Serialize(stream));

            string channelArn = stream.ChannelArn ?? "";

            if (string.IsNullOrEmpty(channelArn))
            {
                Console.WriteLine("channelArn not found!");
                return "fail";
            }

            //Console.WriteLine(channelArn);

            Amazon.IVSRealTime.AmazonIVSRealTimeClient ivsRealTimeClient = new AmazonIVSRealTimeClient();

            ListCompositionsRequest listCompositionsRequest = new ListCompositionsRequest()
            {
                FilterByStageArn = stageArn
            };
            var compositions = await ivsRealTimeClient.ListCompositionsAsync(listCompositionsRequest);

            //There is already a composition for this stage
            if (compositions.Compositions.Any())
            {
                CompositionState currentCompositionState = compositions.Compositions.First().State;
                if (currentCompositionState == CompositionState.ACTIVE)
                {
                    Console.WriteLine("Composition already exists and is Active");

                    return "success";
                }

                if (currentCompositionState == CompositionState.STARTING)
                {
                    Console.WriteLine("Composition is still in the process of starting");

                    return "success";
                }

                if (currentCompositionState == CompositionState.STOPPED)
                {
                    Console.WriteLine("Composition is STOPPED, starting a new composition...");
                }
                else if (currentCompositionState == CompositionState.STOPPING)
                {
                    Console.WriteLine("Composition is STOPPING, starting a new composition...");
                }
                else if (currentCompositionState == CompositionState.FAILED)
                {
                    Console.WriteLine("Composition FAILED to start, starting a new composition...");
                }
            }

            //There is no composition for this stage, so we create it
            StartCompositionRequest startCompositionRequest = new StartCompositionRequest()
            {
                StageArn = request.Resources.First(),
                IdempotencyToken = Guid.NewGuid().ToString(),
                Layout = new LayoutConfiguration()
                {
                    Grid = new GridConfiguration()
                    {
                        FeaturedParticipantAttribute = "featured-slot-1",
                        OmitStoppedVideo = true,
                        VideoAspectRatio = "AUTO",
                        VideoFillMode = "FILL",
                        GridGap = 20
                    }
                },
                Destinations = new List<DestinationConfiguration>
                {
                    new DestinationConfiguration()
                    {
                        Name = "",
                        Channel = new ChannelDestinationConfiguration()
                        {
                            ChannelArn = channelArn,
                            EncoderConfigurationArn = _encoderConfigurationArn
                        }
                    }
                }
            };
            await ivsRealTimeClient.StartCompositionAsync(startCompositionRequest);
        }
        else if (request?.EventDetail?.EventName == "Participant Unpublished")
        {
            Console.WriteLine("Participant Unpublished");
        }
        else if (request?.EventDetail?.EventName == "Participant Unpublished")
        {
            Console.WriteLine("Participant Unpublished");
        }
        else
        {
            Console.WriteLine("Unknown Event");
        }

        Console.WriteLine(JsonSerializer.Serialize(request));

        return "success";
    }
}
