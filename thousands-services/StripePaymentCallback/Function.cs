using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;
using Amazon.CloudWatch;
using Amazon.CloudWatchLogs;
using Amazon.CloudWatchLogs.Model;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Models.Boost;
using IvsIdleGameShared.Models.Market;
using IvsIdleGameShared.Models.Payment;
using IvsIdleGameShared.Repositories.Implementations;
using IvsIdleGameShared.Repositories.Interfaces;
using IvsIdleGameShared.Services.Implementations;
using IvsIdleGameShared.Services.Interfaces;
using IvsIdleGameShared.Utilities;
using Microsoft.Extensions.DependencyInjection;
using MongoDB.Bson;


// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace StripePaymentCallback;

public class StripeMetaData
{
    [JsonPropertyName("credits")]
    public string Credits { get; set; } = String.Empty;

    [JsonPropertyName("userId")]
    public string UserId { get; set; } = String.Empty;

    [JsonPropertyName("transactionId")]
    public string TransactionId { get; set; } = String.Empty;
}

public class StripeDataObject
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = String.Empty;

    [JsonPropertyName("amount")]
    public long Amount { get; set; }

    [JsonPropertyName("currency")]
    public string Currency { get; set; } = String.Empty;

    [JsonPropertyName("status")] 
    public string Status { get; set; } = String.Empty;

    [JsonPropertyName("metadata")]
    public StripeMetaData? MetaData { get; set; }
}

public class StripeData
{
    [JsonPropertyName("object")]
    public StripeDataObject? DataObject { get; set; }
}

public class StripeDetail
{
    [JsonPropertyName("data")]
    public StripeData? Data { get; set; }


}

public class Request
{
    [JsonPropertyName("detail-type")]
    public string? DetailType { get; set; }

    [JsonPropertyName("time")]
    public string? Time { get; set; }

    [JsonPropertyName("detail")]
    public StripeDetail? Detail { get; set; }

}

public class Function
{
    private readonly ICreditBalanceRepository _creditBalanceRepository;
    private readonly string _paymentWebHookSecret;
    private readonly string _payToWalletAddress;
    private static IServiceProvider? services;
    private readonly IStreamRepository _streamRepository;
    private readonly IBoostRepository _boostRepository;
    private readonly IAmazonCloudWatchLogs _cloudWatchLogClient;

    private readonly Dictionary<string, string> _basePackages = new Dictionary<string, string>()
    {
        //0% bonus
        {
            "1200", "9.99"
        },
        {
            "6500", "49.99"
        },
        {
            "32000", "199.99"
        },
        {
            "85000", "499.99"
        },
        {
            "380000", "1999.99"
        },
        {
            "2000000", "9999.99"
        }
    };

    private readonly Dictionary<string, string> _validPackages = new Dictionary<string, string>();

    public Function()
    {
        string? creditBalanceRepositoryConnectionUriEnvironmentVar =
            Environment.GetEnvironmentVariable("CREDIT_BALANCE_REPOSITORY_CONNECTION_URI");

        if (String.IsNullOrEmpty(creditBalanceRepositoryConnectionUriEnvironmentVar))
        {
            Console.WriteLine("CREDIT_BALANCE_REPOSITORY_CONNECTION_URI Environment Variable is not set!");
        }

        string? creditBalanceRepositoryDatabaseNameEnvironmentVar =
            Environment.GetEnvironmentVariable("CREDIT_BALANCE_REPOSITORY_DATABASE_NAME");

        if (String.IsNullOrEmpty(creditBalanceRepositoryDatabaseNameEnvironmentVar))
        {
            Console.WriteLine("CREDIT_BALANCE_REPOSITORY_DATABASE_NAME Environment Variable is not set!");
        }

        string? paymentWebHookSecretEnvironmentVar =
            Environment.GetEnvironmentVariable("PAYMENT_WEBHOOK_SECRET");

        if (String.IsNullOrEmpty(paymentWebHookSecretEnvironmentVar))
        {
            Console.WriteLine("PAYMENT_WEBHOOK_SECRET Environment Variable is not set!");
        }

        string? payToWalletAddressEnvironmentVar =
            Environment.GetEnvironmentVariable("PAY_TO_WALLET_ADDRESS");

        if (String.IsNullOrEmpty(payToWalletAddressEnvironmentVar))
        {
            Console.WriteLine("PAY_TO_WALLET_ADDRESS Environment Variable is not set!");
        }

        var serviceCollection = new ServiceCollection();
        serviceCollection.AddSingleton<IMongoDbSettings>(x => new MongoDbSettings()
        {
            ConnectionUri = creditBalanceRepositoryConnectionUriEnvironmentVar,
            DatabaseName = creditBalanceRepositoryDatabaseNameEnvironmentVar,
            StreamsCollectionName = "streams",
            UsersCollectionName = "users",
            EventsCollectionName = "stages",
            EventIdleEventsCollectionName = "event-idle-events",
            MarketTransactionsCollectionName = "market-transactions",
            UserCoinsCollectionName = "user-coins",
            CreditTransactionCollectionName = "credit-transactions",
            CreditBalanceCollectionName = "credit-balances",
            BoostsSegmentsCollectionName = "boosts-segments"
        });
        serviceCollection.AddSingleton<ICreditBalanceRepository, MongoCreditBalanceRepository>();
        serviceCollection.AddSingleton<IStreamRepository, MongoStreamRepository>();
        serviceCollection.AddSingleton<IBoostRepository, MongoBoostRepository>();
        services = serviceCollection.BuildServiceProvider();

        _creditBalanceRepository = services.GetRequiredService<ICreditBalanceRepository>();
        _streamRepository = services.GetRequiredService<IStreamRepository>();
        _boostRepository = services.GetRequiredService<IBoostRepository>();
        _paymentWebHookSecret = paymentWebHookSecretEnvironmentVar ?? string.Empty;
        _payToWalletAddress = payToWalletAddressEnvironmentVar ?? string.Empty;
        _cloudWatchLogClient = new AmazonCloudWatchLogsClient();

        //Build _validPackages
        _validPackages.Clear();
        for (var percentIncrement = 0; percentIncrement < 11; percentIncrement++)
        {
            foreach (var basePackage in _basePackages)
            {
                string key = ((int)Math.Round(((decimal)int.Parse(basePackage.Key) * (1.0m + (0.05m * (decimal)percentIncrement))))).ToString(CultureInfo.InvariantCulture);
                string value = basePackage.Value;
                //Console.WriteLine($"{key}, {value}");
                _validPackages.Add(key, value);
            }
        }
    }

    /// <summary>
    /// Processes Stripe payment events delivered via EventBridge and applies credits to the requesting user.
    /// </summary>
    /// <param name="request">The EventBridge message payload.</param>
    /// <param name="context">The Lambda execution context.</param>
    /// <returns>True when the payment was processed without errors.</returns>
    public async Task<bool> FunctionHandler(Request request, ILambdaContext context)
    {
        string requestJsonString = JsonSerializer.Serialize(request);
        Console.WriteLine($"Received Stripe EventBridge message: {requestJsonString}");

        const string logGroupName = "stripe-payment-callback-issues";

        try
        {
            if (request.Detail == null)
            {
                Console.WriteLine("Event is missing detail property.");
                return false;
            }

            if (request.DetailType == null)
            {
                Console.WriteLine("Event detail type is missing.");
                return false;
            }

            if (request.Detail == null)
            {
                Console.WriteLine("Event detail is missing.");
                return false;
            }

            if (request.Detail.Data == null)
            {
                Console.WriteLine("Event detail data is missing.");
                return false;
            }

            if (request.Detail.Data.DataObject == null)
            {
                Console.WriteLine("Event detail data object is missing.");
                return false;
            }

            StripeDataObject stripeDataObject = request.Detail.Data.DataObject;

            if (stripeDataObject.MetaData == null)
            {
                Console.WriteLine("Event detail data object metadata is missing.");
                return false;
            }

            StripeMetaData stripeMetaData = stripeDataObject.MetaData;

            string detailType = request.DetailType;
            string status = stripeDataObject.Status;
            string paymentGatewayTransactionId = stripeDataObject.Id;

            string normalizedStatus = NormalizeStatus(status, detailType);

            string currency = stripeDataObject.Currency;
            currency = currency.ToUpperInvariant();

            string paymentMethod = "stripe";

            string userId = stripeMetaData.UserId;
            string transactionId = stripeMetaData.TransactionId;
            string creditsString = stripeMetaData.Credits;

            if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(transactionId) || string.IsNullOrWhiteSpace(creditsString))
            {
                Console.WriteLine("Metadata missing userId, transactionId, or credits.");
                return false;
            }

            if (!int.TryParse(creditsString, NumberStyles.Integer, CultureInfo.InvariantCulture, out int credits) || credits <= 0)
            {
                Console.WriteLine($"Invalid credits value: {creditsString}");
                return false;
            }

            long amountInMinorUnits = stripeDataObject.Amount;
            string fraudWarningType = string.Empty;

            if (!_validPackages.ContainsKey(creditsString))
            {
                Console.WriteLine($"Credits value {creditsString} does not match a valid package.");
                fraudWarningType = "INVALIDCREDITS";
            }
            else if (amountInMinorUnits > 0)
            {
                string expectedAmountString = _validPackages[creditsString];
                if (decimal.TryParse(expectedAmountString, NumberStyles.Number, CultureInfo.InvariantCulture, out decimal expectedAmount))
                {
                    long expectedMinorUnits = (long)Math.Round(expectedAmount * 100m, MidpointRounding.AwayFromZero);
                    if (amountInMinorUnits < expectedMinorUnits)
                    {
                        Console.WriteLine($"Amount received {amountInMinorUnits} below expected {expectedMinorUnits} for credits {creditsString}.");
                        fraudWarningType = "INVALIDAMOUNT";
                    }
                }
                else
                {
                    Console.WriteLine($"Unable to parse expected amount {expectedAmountString} for credits {creditsString}.");
                }
            }

            if (!string.IsNullOrEmpty(fraudWarningType))
            {
                await LogIssueAsync(logGroupName, $"{fraudWarningType}: {requestJsonString}");
            }

            bool updateTransactionSuccessful = await _creditBalanceRepository.UpdateTransactionStatus(transactionId, normalizedStatus, paymentGatewayTransactionId);

            if (!updateTransactionSuccessful)
            {
                await _creditBalanceRepository.AddCreditTransaction(userId, transactionId, credits, currency, paymentMethod, "stripe", paymentGatewayTransactionId, 0, normalizedStatus, CreditTransactionType.CREDIT, null, null, null);
            }

            if (normalizedStatus == "COMPLETED")
            {
                bool updateCreditBalanceSuccess = await _creditBalanceRepository.UpdateCreditBalance(userId, credits);
                if (!updateCreditBalanceSuccess)
                {
                    Console.WriteLine($"Transaction {transactionId} failed to update credit balance.");
                    await LogIssueAsync(logGroupName, $"FAILED_CREDIT_BALANCE_UPDATE: {requestJsonString}");
                    return false;
                }
            }
            else if (normalizedStatus == "FAILED")
            {
                Console.WriteLine($"Transaction {transactionId} failed.");
            }
            else if (normalizedStatus == "PENDING")
            {
                Console.WriteLine($"Transaction {transactionId} pending.");
            }
            else
            {
                Console.WriteLine($"Transaction {transactionId} status is {normalizedStatus}.");
            }

            Console.WriteLine($"Processed Stripe payment for transaction {transactionId} with status {normalizedStatus}.");
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error processing Stripe webhook: {ex.Message}");
            await LogIssueAsync(logGroupName, $"UNKNOWN_ERROR: {ex.Message}");
            return false;
        }
    }

    private static string NormalizeStatus(string status, string detailType)
    {
        if (string.Equals(status, "succeeded", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(detailType, "payment_intent.succeeded", StringComparison.OrdinalIgnoreCase))
        {
            return "COMPLETED";
        }

        if (string.Equals(status, "processing", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(status, "requires_action", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(status, "requires_confirmation", StringComparison.OrdinalIgnoreCase))
        {
            return "PENDING";
        }

        if (string.Equals(status, "requires_payment_method", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(status, "canceled", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(status, "failed", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(detailType, "payment_intent.payment_failed", StringComparison.OrdinalIgnoreCase))
        {
            return "FAILED";
        }

        return string.IsNullOrWhiteSpace(status) ? string.Empty : status.ToUpperInvariant();
    }

    private async Task LogIssueAsync(string logGroupName, string message)
    {
        try
        {
            string logGuid = Guid.NewGuid().ToString();
            string logStreamName = $"stripe-payment-issues-{logGuid}";
            await _cloudWatchLogClient.CreateLogStreamAsync(new CreateLogStreamRequest
            {
                LogGroupName = logGroupName,
                LogStreamName = logStreamName
            });

            var logEvent = new InputLogEvent
            {
                Message = message,
                Timestamp = DateTime.UtcNow
            };

            await _cloudWatchLogClient.PutLogEventsAsync(new PutLogEventsRequest
            {
                LogGroupName = logGroupName,
                LogStreamName = logStreamName,
                LogEvents = new List<InputLogEvent> { logEvent }
            });
        }
        catch (Exception logEx)
        {
            Console.WriteLine($"Failed to publish log event: {logEx.Message}");
        }
    }
}
