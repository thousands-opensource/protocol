using System.Text.Json;
using Amazon.Lambda.Core;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Services.Interfaces;
using IvsIdleGameShared.Repositories.Implementations;
using IvsIdleGameShared.Repositories.Interfaces;
using IvsIdleGameShared.Services.Implementations;
using Microsoft.Extensions.DependencyInjection;
using System.Text.Json.Serialization;
using Amazon.Lambda.APIGatewayEvents;
using IvsIdleGameShared.Utilities;
using MongoDB.Bson;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace PurchaseSponsorship;

public class PurchaseSponsorshipRequest
{
    [JsonPropertyName("sponsoredEventId")]
    public string SponsoredEventId { get; set; } = string.Empty;
    [JsonPropertyName("sponsorshipSlotId")]
    public string SponsorshipSlotId { get; set; } = string.Empty;
}


public class PurchaseSponsorshipResponse
{
    public bool Success { get; set; } = false;
    public string ErrorMessage { get; set; } = "";
}

public class Function
{
    private readonly ISponsorshipsService _sponsorshipsService;
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
            SkyboxesCollectionName = "skyboxes",
            RallyPredictionCollectionName = "rally-predictions",
            UserRallyPredictionCollectionName = "user-rally-predictions",
            PredictionChartDataCollectionName = "prediction-chart-data",
            SponsoredEventsCollectionName = "sponsored-events",
            UserSponsoredEventsCollectionName = "user-sponsored-events"
        });
        serviceCollection.AddSingleton<ISponsorshipRepository, MongoSponsorshipRepository>();
        serviceCollection.AddSingleton<ISponsorshipsService, SponsorshipsService>();

        services = serviceCollection.BuildServiceProvider();
        _sponsorshipsService = services.GetRequiredService<ISponsorshipsService>();
    }

    /// <summary>
    /// Handles a Thousands user purchasing a sponsorship with credits
    /// </summary>
    /// <param name="proxyRequest">The incoming API request data from the AWS API Gateway.</param>
    /// <param name="context">The ILambdaContext that provides methods for logging and describing the Lambda environment.</param>
    /// <returns></returns>
    public async Task<APIGatewayProxyResponse> FunctionHandler(APIGatewayProxyRequest proxyRequest, ILambdaContext context)
    {
        Console.WriteLine($"ThousandsInfo: Raw Request - {JsonSerializer.Serialize(proxyRequest)}");

        //Verify the JWT token and extract the userId
        ThousandsJwt thousandsJwt = await LambdaUtilities.VerifyWildcardAccessTokenInProxyRequestAndGetUserId(proxyRequest);
        string userId = thousandsJwt.UserId;

        if (string.IsNullOrEmpty(userId))
        {
            return ThousandsResponse("ThousandsWarning: Missing userId", null, 200);
        }

        if (string.IsNullOrEmpty(proxyRequest.Body))
        {
            return ThousandsResponse("ThousandsWarning: Request body is empty", null, 200);
        }

        PurchaseSponsorshipRequest? purchaseSponsorshipRequest;
        try
        {
            purchaseSponsorshipRequest = JsonSerializer.Deserialize<PurchaseSponsorshipRequest>(proxyRequest.Body);
            if (purchaseSponsorshipRequest == null)
            {
                return ThousandsResponse("ThousandsWarning: Unable to deserialize request body", null, 200);
            }
        }
        catch (Exception ex)
        {
            return ThousandsResponse($"ThousandsError: Failed to deserialize request body - {ex.Message}");
        }

        string sponsoredEventId = purchaseSponsorshipRequest.SponsoredEventId;
        string sponsorshipSlotId = purchaseSponsorshipRequest.SponsorshipSlotId;

        if (string.IsNullOrWhiteSpace(sponsoredEventId) || !ObjectId.TryParse(sponsoredEventId, out _))
        {
            return ThousandsResponse("Invalid sponsoredEventId", null, 200);
        }

        if (string.IsNullOrWhiteSpace(sponsorshipSlotId) || !ObjectId.TryParse(sponsorshipSlotId, out _))
        {
            return ThousandsResponse("Invalid sponsorshipSlotId", null, 200);
        }

        try
        {
            PurchaseSponsorshipResult purchaseSponsorshipResult =
                await _sponsorshipsService.PurchaseSponsorship(userId, sponsoredEventId, sponsorshipSlotId);

            if (!string.IsNullOrEmpty(purchaseSponsorshipResult.ErrorMessage))
            {
                return ThousandsResponse(purchaseSponsorshipResult.ErrorMessage, null, 200);
            }

            PurchaseSponsorshipResponse purchaseSponsorshipResponse = new PurchaseSponsorshipResponse()
            {
                Success = true
            };
            return ThousandsResponse("Successfully purchased sponsorship", purchaseSponsorshipResponse, 200);
        }
        catch (Exception ex)
        {
            return ThousandsResponse($"Failed to purchase sponsorship - {ex.Message}");
        }
    }

    private APIGatewayProxyResponse ThousandsResponse(string message, PurchaseSponsorshipResponse? response = null, int statusCode = 500)
    {
        Console.WriteLine(message);
        PurchaseSponsorshipResponse purchaseSponsorshipResponse = response ?? new PurchaseSponsorshipResponse()
        {
            ErrorMessage = message,
            Success = false
        };
        return new APIGatewayProxyResponse
        {
            StatusCode = statusCode,
            Body = JsonSerializer.Serialize(purchaseSponsorshipResponse),
            Headers = LambdaUtilities.GetCORSHeaders()
        };
    }
}
