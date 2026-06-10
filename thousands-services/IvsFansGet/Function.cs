using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Repositories.Implementations;
using IvsIdleGameShared.Repositories.Interfaces;
using IvsIdleGameShared.Services.Implementations;
using IvsIdleGameShared.Services.Interfaces;
using IvsIdleGameShared.Utilities;
using Microsoft.Extensions.DependencyInjection;
using System.Text.Json;
using IvsIdleGameShared.Models;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace IvsFansGet;

public class GetWalletsRequest
{
    public string VendorEventId { get; set; }
}

public class FanDetailsRequest
{
    public string VendorEventId { get; set; } = "";
    public string FanId { get; set; } = "";
}

public class WalletWithAdditionalWallets
{
    public string WalletAddress { get; set; }
    public string[]? AdditionalWalletAddresses { get; set; }
}

public class GetWalletsResponse
{
    public WalletWithAdditionalWallets[] Wallets { get; set; }
}

public class GetFanDetailsResponse
{
    public List<FanInTheStands> FanInTheStandsDetail { get; set; } = new List<FanInTheStands>();
}

public class GetCountResponse
{
    public long CountOfGeneralAdmissionFans { get; set; }
}

public class Function
{
    private readonly IFanVisibilityService _fanVisibilityServiceService;
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

        var serviceCollection = new ServiceCollection();
        serviceCollection.AddSingleton<IRedisSettings>(x => new RedisSettings()
        {
            EndPoint = queueServiceEndpointEnvironmentVar,
            Port = queueServicePort,
            Password = queueServicePasswordEnvironmentVar,
            User = queueServiceUserEnvironmentVar,
        });
        serviceCollection.AddSingleton<IRedisDbProvider, RedisDbProvider>();
        serviceCollection.AddSingleton<IFanVisibilityService, RedisFanVisibilityService>();
        services = serviceCollection.BuildServiceProvider();

        _fanVisibilityServiceService = services.GetRequiredService<IFanVisibilityService>();
    }

    /// <summary>
    /// Gets a list of wallet addresses for the current list of fans in the stands
    /// </summary>
    /// <param name="proxyRequest">The request for the Lambda function handler to process.</param>
    /// <param name="context">The ILambdaContext that provides methods for logging and describing the Lambda environment.</param>
    /// <returns></returns>
    public async Task<APIGatewayProxyResponse> GetWalletsFunctionHandler(APIGatewayProxyRequest proxyRequest, ILambdaContext context)
    {
        //Verify the JWT token and extract the userId
        ThousandsJwt thousandsJwt = await LambdaUtilities.VerifyWildcardAccessTokenInProxyRequestAndGetUserId(proxyRequest);
        string userId = thousandsJwt.UserId;

        //Get the incoming GetWalletsRequest
        GetWalletsRequest? getWalletsRequest = JsonSerializer.Deserialize<GetWalletsRequest>(proxyRequest.Body);
        if (getWalletsRequest == null)
        {
            Console.WriteLine("Error deserializing GetWalletsRequest!");
            return ReturnResponseError("Error deserializing GetWalletsRequest!");
        }
        //Make sure we have a VendorEventId
        if (string.IsNullOrWhiteSpace(getWalletsRequest.VendorEventId))
        {
            Console.WriteLine("Invalid VendorEventId!");
            return ReturnResponseError("Invalid VendorEventId!");
        }

        List<FanInTheStands> fansInTheStandsList = await _fanVisibilityServiceService.GetFansInTheStands(getWalletsRequest.VendorEventId);

        List<FanInTheStands> filteredFansInTheStandsList = new List<FanInTheStands>();

        //Remove wallets of internal staff (HasWalletAddress == false)
        foreach (var fanInTheStands in fansInTheStandsList)
        {
            if (fanInTheStands.HasWalletAddress && !string.IsNullOrEmpty(fanInTheStands.WalletAddress))
            {
                filteredFansInTheStandsList.Add(fanInTheStands);
            }
        }

        GetWalletsResponse getWalletsResponse = new GetWalletsResponse();
        getWalletsResponse.Wallets = new WalletWithAdditionalWallets[filteredFansInTheStandsList.Count];

        //Extract the wallet addresses from filteredFansInTheStandsList
        int walletsArrayIndex = 0;
        foreach (var fanInTheStands in filteredFansInTheStandsList)
        {
            WalletWithAdditionalWallets wallet = new WalletWithAdditionalWallets()
            {
                WalletAddress = fanInTheStands.WalletAddress ?? string.Empty,
                AdditionalWalletAddresses = fanInTheStands.AdditionalWalletAddresses
            };
            getWalletsResponse.Wallets[walletsArrayIndex] = wallet;
            walletsArrayIndex++;
        }

        return new APIGatewayProxyResponse
        {
            StatusCode = 200,
            Body = JsonSerializer.Serialize(getWalletsResponse),
            Headers = LambdaUtilities.GetCORSHeaders()
        };
    }

    public async Task<APIGatewayProxyResponse> FanDetails(APIGatewayProxyRequest proxyRequest, ILambdaContext context)
    {
        //Verify the JWT token and extract the userId
        ThousandsJwt thousandsJwt = await LambdaUtilities.VerifyWildcardAccessTokenInProxyRequestAndGetUserId(proxyRequest);
        string userId = thousandsJwt.UserId;

        string? vendorEventId;
        proxyRequest.QueryStringParameters.TryGetValue("VendorEventId", out vendorEventId);

        //Make sure we have a VendorEventId
        if (string.IsNullOrWhiteSpace(vendorEventId))
        {
            Console.WriteLine("Invalid VendorEventId!");
            return ReturnResponseError("Invalid VendorEventId!");
        }

        List<FanInTheStands> fansInTheStands = await _fanVisibilityServiceService.GetFansInTheStands(vendorEventId);

        GetFanDetailsResponse getFanDetailsResponse = new GetFanDetailsResponse()
        {
            FanInTheStandsDetail = fansInTheStands
        };

        return new APIGatewayProxyResponse
        {
            StatusCode = 200,
            Body = JsonSerializer.Serialize(getFanDetailsResponse),
            Headers = LambdaUtilities.GetCORSHeaders()
        };
    }

    /// <summary>
    /// Gets a count of the number of general admission fans in the stands for this vendorEventId
    /// </summary>
    /// <param name="proxyRequest">The request for the Lambda function handler to process.</param>
    /// <param name="context">The ILambdaContext that provides methods for logging and describing the Lambda environment.</param>
    /// <returns></returns>
    public async Task<APIGatewayProxyResponse> GetCountFunctionHandler(APIGatewayProxyRequest proxyRequest, ILambdaContext context)
    {
        //Verify the JWT token and extract the userId
        ThousandsJwt thousandsJwt = await LambdaUtilities.VerifyWildcardAccessTokenInProxyRequestAndGetUserId(proxyRequest);
        string userId = thousandsJwt.UserId;

        //Get the incoming GetWalletsRequest
        GetWalletsRequest? getWalletsRequest = JsonSerializer.Deserialize<GetWalletsRequest>(proxyRequest.Body);
        if (getWalletsRequest == null)
        {
            Console.WriteLine("Error deserializing GetWalletsRequest!");
            return ReturnResponseError("Error deserializing GetWalletsRequest!");
        }
        //Make sure we have a VendorEventId
        if (string.IsNullOrWhiteSpace(getWalletsRequest.VendorEventId))
        {
            Console.WriteLine("Invalid VendorEventId!");
            return ReturnResponseError("Invalid VendorEventId!");
        }

        long countOfGeneralAdmissionFans = await _fanVisibilityServiceService.GetNumberOfGeneralAdmissionFansInTheStands(getWalletsRequest.VendorEventId);

        GetCountResponse getCountResponse = new GetCountResponse()
        {
            CountOfGeneralAdmissionFans = countOfGeneralAdmissionFans
        };

        return new APIGatewayProxyResponse
        {
            StatusCode = 200,
            Body = JsonSerializer.Serialize(getCountResponse),
            Headers = LambdaUtilities.GetCORSHeaders()
        };
    }

    private APIGatewayProxyResponse ReturnResponseError(string errorMessage)
    {
        return new APIGatewayProxyResponse
        {
            StatusCode = 500,
            Body = errorMessage,
            Headers = LambdaUtilities.GetCORSHeaders()
        };
    }
}
