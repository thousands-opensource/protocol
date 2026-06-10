using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Services.Implementations;
using IvsIdleGameShared.Services.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using System.Text.Json;


// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace IvsAirdrop;

public class IvsAirdropRequest
{
    public string VendorEventId { get; set; } = "";
    public int GiftId { get; set; } = 0;
    public int GiftQuantity { get; set; } = 1;
    public string GiftName { get; set; } = "";
    public string GiftDescription { get; set; } = "";
    public string GiftImageUrl { get; set; } = "";
    public string GiftSet { get; set; } = "";
    public string GiftMaterials { get; set; } = "";
}

public class IvsAirdropResponse
{
    public bool Success { get; set; } = false;
    public string Err { get; set; } = "";
}

public class Function
{
    private readonly IFanVisibilityService _fanVisibilityServiceService;
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

        var serviceCollection = new ServiceCollection();
        serviceCollection.AddSingleton<IRedisSettings>(x => new RedisSettings()
        {
            EndPoint = fanVisibilityServiceEndpointEnvironmentVar,
            Port = fanVisibilityServicePort,
            Password = fanVisibilityServicePasswordEnvironmentVar,
            User = fanVisibilityServiceUserEnvironmentVar,
        });
        serviceCollection.AddSingleton<IFanVisibilityService, RedisFanVisibilityService>();
        services = serviceCollection.BuildServiceProvider();

        _fanVisibilityServiceService = services.GetRequiredService<IFanVisibilityService>();
    }

    /// <summary>
    /// A simple function that takes a string and does a ToUpper
    /// </summary>
    /// <param name="proxyRequest">The event for the Lambda function handler to process.</param>
    /// <param name="context">The ILambdaContext that provides methods for logging and describing the Lambda environment.</param>
    /// <returns></returns>
    public async Task<IvsAirdropResponse> FunctionHandler(APIGatewayHttpApiV2ProxyRequest proxyRequest, ILambdaContext context)
    {
        //Security to make sure the _platformApiKeyEnvironmentVar is set (not empty) and that the incoming x-api-key matches the _platformApiKeyEnvironmentVar
        if (String.IsNullOrEmpty(_platformApiKeyEnvironmentVar) || !proxyRequest.Headers.ContainsKey("x-api-key") || _platformApiKeyEnvironmentVar != proxyRequest.Headers["x-api-key"])
        {
            return new IvsAirdropResponse()
            {
                Success = false,
                Err = "Invalid API Key"
            };
        }

        if (proxyRequest.Body == null)
        {
            return new IvsAirdropResponse()
            {
                Success = false,
                Err = "Invalid Request Body"
            };
        }

        Console.WriteLine(proxyRequest.Body);

        IvsAirdropRequest? request = JsonSerializer.Deserialize<IvsAirdropRequest>(proxyRequest.Body);

        if (request == null)
        {
            return new IvsAirdropResponse()
            {
                Success = false,
                Err = "Invalid Request"
            };
        }

        string vendorEventId = request?.VendorEventId ?? string.Empty;
        int giftId = request?.GiftId ?? 0;
        int giftQuantity = request?.GiftQuantity ?? 1;
        string giftName = request?.GiftName ?? string.Empty;
        string giftDescription = request?.GiftDescription ?? string.Empty;
        string giftImageUrl = request?.GiftImageUrl ?? string.Empty;
        string giftSet = request?.GiftSet ?? string.Empty;
        string giftMaterials = request?.GiftMaterials ?? string.Empty;

        Console.WriteLine($"GiftSet: {giftSet} - GiftMaterials: {giftMaterials}");

        if (string.IsNullOrEmpty(vendorEventId))
        {
            return new IvsAirdropResponse()
            {
                Success = false,
                Err = "Invalid Vendor Event Id"
            };
        }
        if (giftId < 1)
        {
            return new IvsAirdropResponse()
            {
                Success = false,
                Err = "Invalid Gift Id"
            };
        }
        if (giftQuantity < 1 || giftQuantity > 1000)
        {
            return new IvsAirdropResponse()
            {
                Success = false,
                Err = "Invalid Gift Quantity"
            };
        }
        if (string.IsNullOrEmpty(giftName))
        {
            return new IvsAirdropResponse()
            {
                Success = false,
                Err = "Invalid Gift Name"
            };
        }
        if (string.IsNullOrEmpty(giftImageUrl))
        {
            return new IvsAirdropResponse()
            {
                Success = false,
                Err = "Invalid Gift Image Url"
            };
        }

        string fanfareEventType = "FanfareEffect";
        FanfareEffect fanfareEffect = new FanfareEffect()
        {
            Type = "AudienceGift",
            Name = giftName,
            Value = giftImageUrl,
            SectionId = giftId,
            SectionName = giftDescription,
            Magnitude = giftQuantity,
            Delay = 0,
            Duration = 600,
            Notify = true,
            Metadata = new AirDropMetadata()
            {
                Set = giftSet,
                Materials = giftMaterials,
            }
        };
        await _fanVisibilityServiceService.SendFanVisibilityEvent(vendorEventId, fanfareEventType, fanfareEffect);

        return new IvsAirdropResponse()
        {
            Success = true,
            Err = ""
        };
    }
}
