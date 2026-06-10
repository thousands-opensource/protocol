using System.Globalization;
using System.Linq;
using System.Text.Json;
using Amazon.CloudWatch;
using Amazon.CloudWatchLogs;
using Amazon.CloudWatchLogs.Model;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Configuration.Implementations;
using IvsIdleGameShared.Configuration.Interfaces;
using IvsIdleGameShared.Models.Boost;
using IvsIdleGameShared.Models.Market;
using IvsIdleGameShared.Models.Payment;
using IvsIdleGameShared.Models.Sponsorship;
using IvsIdleGameShared.Repositories.Implementations;
using IvsIdleGameShared.Repositories.Interfaces;
using IvsIdleGameShared.Services.Implementations;
using IvsIdleGameShared.Services.Interfaces;
using IvsIdleGameShared.Utilities;
using Microsoft.Extensions.DependencyInjection;
using MongoDB.Bson;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace IvsPaymentCallback;

public class Function
{
    private readonly ICreditBalanceRepository _creditBalanceRepository;
    private readonly string _paymentWebHookSecret;
    private readonly string _payToWalletAddress;
    private static IServiceProvider? services;
    private readonly IStreamRepository _streamRepository;
    private readonly IBoostRepository _boostRepository;
    private readonly IAmazonCloudWatchLogs _cloudWatchLogClient;
    private readonly IReferralService _referralService;
    private readonly ISponsorshipRepository _sponsorshipRepository;

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

        string? thousandsApiRootUrl =
            Environment.GetEnvironmentVariable("THOUSANDS_API_ROOT_URL");

        if (String.IsNullOrEmpty(thousandsApiRootUrl))
        {
            Console.WriteLine("THOUSANDS_API_ROOT_URL Environment Variable is not set!");
        }

        string? platformXApiKeyEnvironmentVar =
            Environment.GetEnvironmentVariable("PLATFORM_X_API_KEY");

        if (String.IsNullOrEmpty(platformXApiKeyEnvironmentVar))
        {
            Console.WriteLine("PLATFORM_X_API_KEY Environment Variable is not set!");
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
            BoostsSegmentsCollectionName = "boosts-segments",
            SponsoredEventsCollectionName = "sponsored-events",
            UserSponsoredEventsCollectionName = "user-sponsored-events"
        });
        serviceCollection.AddSingleton<IPlatformSettings>(x => new ThousandsPlatformSettings()
        {
            ThousandsApiRootUrl = thousandsApiRootUrl,
            PlatformXApiKey = platformXApiKeyEnvironmentVar,
        });
        serviceCollection.AddSingleton<ICreditBalanceRepository, MongoCreditBalanceRepository>();
        serviceCollection.AddSingleton<IStreamRepository, MongoStreamRepository>();
        serviceCollection.AddSingleton<IBoostRepository, MongoBoostRepository>();
        serviceCollection.AddSingleton<IReferralService, SnagReferralService>();
        serviceCollection.AddSingleton<ISponsorshipRepository, MongoSponsorshipRepository>();
        services = serviceCollection.BuildServiceProvider();

        _creditBalanceRepository = services.GetRequiredService<ICreditBalanceRepository>();
        _streamRepository = services.GetRequiredService<IStreamRepository>();
        _boostRepository = services.GetRequiredService<IBoostRepository>();
        _referralService = services.GetRequiredService<IReferralService>();
        _sponsorshipRepository = services.GetRequiredService<ISponsorshipRepository>();
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
    /// A simple function that takes a string and does a ToUpper
    /// </summary>
    /// <param name="proxyRequest">The event for the Lambda function handler to process.</param>
    /// <param name="context">The ILambdaContext that provides methods for logging and describing the Lambda environment.</param>
    /// <returns></returns>
    public async Task<bool> FunctionHandler(APIGatewayHttpApiV2ProxyRequest proxyRequest, ILambdaContext context)
    {
        const string logGroupName = "payment-callback-issues";

        try
        {
            Console.WriteLine($"Received request: {JsonSerializer.Serialize(proxyRequest)}");

            // Extract headers
            var signature = proxyRequest.Headers["x-pay-signature"];
            var timestamp = proxyRequest.Headers["x-pay-timestamp"];

            if (string.IsNullOrEmpty(signature) || string.IsNullOrEmpty(timestamp))
            {
                Console.WriteLine("Missing signature or timestamp.");
                return false;
            }

            string requestBody = proxyRequest.Body;
            Console.WriteLine($"proxyRequest.Body: {requestBody}");

            // Validate signature
            if (!LambdaUtilities.IsValidThirdWebSignature(proxyRequest.Body, timestamp, signature, _paymentWebHookSecret))
            {
                Console.WriteLine("Invalid signature.");
                return false;
            }

            // Check if the request is expired
            if (LambdaUtilities.IsThirdWebSignatureExpired(timestamp, 60))
            {
                Console.WriteLine("Request has expired.");
                return false;
            }

            // Deserialize the webhook body to extract relevant data
            var thirdWebPaymentConfirmation = JsonSerializer.Deserialize<ThirdWebPaymentConfirmation>(proxyRequest.Body);

            if (thirdWebPaymentConfirmation == null)
            {
                Console.WriteLine("Error deserializing webhook data.");
                return false;
            }

            var fromAddress = thirdWebPaymentConfirmation.Data.BuyWithCryptoStatus.FromAddress;
            var toAddress = thirdWebPaymentConfirmation.Data.BuyWithCryptoStatus.ToAddress;
            var destinationAmount = thirdWebPaymentConfirmation.Data.BuyWithCryptoStatus.Destination.Amount;
            var status = thirdWebPaymentConfirmation.Data.BuyWithCryptoStatus.Status;
            var transactionId = thirdWebPaymentConfirmation.Data.BuyWithCryptoStatus.PurchaseData.TransactionId;
            var paymentGatewayTransactionId = thirdWebPaymentConfirmation.Data.BuyWithCryptoStatus.Destination.TransactionHash ?? "";
            var userId = thirdWebPaymentConfirmation.Data.BuyWithCryptoStatus.PurchaseData.UserId;
            string sponsoredEventId = thirdWebPaymentConfirmation.Data.BuyWithCryptoStatus.PurchaseData.SponsoredEventId;
            string sponsorshipSlotId = thirdWebPaymentConfirmation.Data.BuyWithCryptoStatus.PurchaseData.SponsorshipSlotId;
            var currency = thirdWebPaymentConfirmation.Data.BuyWithCryptoStatus.Source.Token.Name;

            string fraudWarningType = "";
            if (String.IsNullOrEmpty(toAddress))
            {
                Console.WriteLine("toAddress IS NULL OR EMPTY!");
                fraudWarningType = "MISSINGTOADDRESS";
            }
            else if (toAddress != _payToWalletAddress)
            {
                Console.WriteLine("toAddress DOES NOT MATCH payToWalletAddress!");
                fraudWarningType = "WRONGTOADDRESS";
            }

            if (!string.IsNullOrEmpty(fraudWarningType))
            {
                string logGuid = Guid.NewGuid().ToString();
                string logStreamName = $"payment-issues-{logGuid}";
                await _cloudWatchLogClient.CreateLogStreamAsync(new CreateLogStreamRequest
                {
                    LogGroupName = logGroupName,
                    LogStreamName = logStreamName
                });

                var logEvent = new InputLogEvent
                {
                    Message = $"{fraudWarningType}: {requestBody}",
                    Timestamp = DateTime.UtcNow
                };

                await _cloudWatchLogClient.PutLogEventsAsync(new PutLogEventsRequest
                {
                    LogGroupName = logGroupName,
                    LogStreamName = logStreamName,
                    LogEvents = new List<InputLogEvent> { logEvent }
                });
            }

            // Update the transaction status in the database
            bool updateTransactionSuccessful = await _creditBalanceRepository.UpdateTransactionStatus(transactionId, status, paymentGatewayTransactionId);

            //If updating the transaction status failed, then we need to add the credit transaction
            if (!updateTransactionSuccessful)
            {
                //Insert transaction
                await _creditBalanceRepository.AddCreditTransaction(userId, transactionId, 0, currency, "crypto", "third-web",
                       paymentGatewayTransactionId, 0, status, CreditTransactionType.SPONSORSHIP_PURCHASE, null, null, null);
            }

            // Process the transaction based on its status
            if (status == "COMPLETED")
            {
                Console.WriteLine($"Transaction {transactionId} completed.");
            }
            else if (status == "FAILED")
            {
                Console.WriteLine($"Transaction {transactionId} failed.");
            }
            else if (status == "PENDING")
            {
                Console.WriteLine($"Transaction {transactionId} is pending.");


                if (string.IsNullOrWhiteSpace(sponsoredEventId) || string.IsNullOrWhiteSpace(sponsorshipSlotId))
                {
                    Console.WriteLine("Missing sponsoredEventId or sponsorshipSlotId metadata.");

                    string logGuid = Guid.NewGuid().ToString();
                    string logStreamName = $"payment-issues-{logGuid}";
                    await _cloudWatchLogClient.CreateLogStreamAsync(new CreateLogStreamRequest
                    {
                        LogGroupName = logGroupName,
                        LogStreamName = logStreamName
                    });

                    var logEvent = new InputLogEvent
                    {
                        Message = $"Missing sponsorship metadata: {requestBody}",
                        Timestamp = DateTime.UtcNow
                    };

                    await _cloudWatchLogClient.PutLogEventsAsync(new PutLogEventsRequest
                    {
                        LogGroupName = logGroupName,
                        LogStreamName = logStreamName,
                        LogEvents = new List<InputLogEvent> { logEvent }
                    });

                    return false;
                }

                SponsoredEvent? sponsoredEvent = await _sponsorshipRepository.GetSponsoredEvent(sponsoredEventId);
                if (sponsoredEvent == null)
                {
                    Console.WriteLine($"Sponsored event not found for sponsoredEventId: {sponsoredEventId}");
                    return false;
                }

                SponsorshipSlot? sponsorshipSlot = sponsoredEvent.SponsorshipSlots
                    ?.FirstOrDefault(slot => slot.SponsorshipSlotId.ToString() == sponsorshipSlotId);
                if (sponsorshipSlot == null)
                {
                    Console.WriteLine($"Sponsorship slot not found for sponsorshipSlotId: {sponsorshipSlotId}");
                    return false;
                }

                if (!ObjectId.TryParse(userId, out ObjectId userObjectId))
                {
                    Console.WriteLine($"Invalid userId in payment metadata: {userId}");
                    return false;
                }

                if (!ObjectId.TryParse(sponsoredEventId, out ObjectId sponsoredEventObjectId))
                {
                    Console.WriteLine($"Invalid sponsoredEventId in payment metadata: {sponsoredEventId}");
                    return false;
                }

                if (!ObjectId.TryParse(sponsorshipSlotId, out ObjectId sponsorshipSlotObjectId))
                {
                    Console.WriteLine($"Invalid sponsorshipSlotId in payment metadata: {sponsorshipSlotId}");
                    return false;
                }

                try
                {
                    if (decimal.TryParse(destinationAmount, out decimal decimalDestinationAmount))
                    {
                        if (decimalDestinationAmount < sponsorshipSlot.UsdcPrice)
                        {
                            Console.WriteLine("destinationAmount DOES NOT MATCH SPONSORSHIP COST!");
                            fraudWarningType = "INVALIDAMOUNT";
                        }
                    }
                    else
                    {
                        Console.WriteLine("Error parsing destinationAmount to decimal type!");
                        fraudWarningType = "INVALIDAMOUNT";
                    }
                }
                catch (Exception e)
                {
                    Console.WriteLine($"Unknown error parsing values for INVALIDAMOUNT check (this does not stop the payment from being processed): {e.Message}");
                }

                UserSponsoredEvent userSponsoredEvent = new UserSponsoredEvent
                {
                    Id = ObjectId.GenerateNewId(),
                    UserId = userObjectId,
                    SponsoredEventId = sponsoredEventObjectId,
                    SponsorshipSlotId = sponsorshipSlotObjectId,
                    Tier = sponsorshipSlot.Tier,
                    House = sponsorshipSlot.House,
                    UsdcPrice = sponsorshipSlot.UsdcPrice,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    Version = 0
                };

                bool userSponsoredEventAdded =
                    await _sponsorshipRepository.AddUserSponsoredEvent(userSponsoredEvent);
                if (!userSponsoredEventAdded)
                {
                    Console.WriteLine($"Failed to add user-sponsored-event for transactionId: {transactionId}");
                    return false;
                }
            }
            else
            {
                Console.WriteLine($"Transaction {transactionId} status is {status}.");
            }

            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error processing webhook: {ex.Message}");

            string logGuid = Guid.NewGuid().ToString();
            string logStreamName = $"payment-issues-{logGuid}";
            await _cloudWatchLogClient.CreateLogStreamAsync(new CreateLogStreamRequest
            {
                LogGroupName = logGroupName,
                LogStreamName = logStreamName
            });

            var logEvent = new InputLogEvent
            {
                Message = $"Unknown payment processing error: {ex.Message}",
                Timestamp = DateTime.UtcNow
            };

            await _cloudWatchLogClient.PutLogEventsAsync(new PutLogEventsRequest
            {
                LogGroupName = logGroupName,
                LogStreamName = logStreamName,
                LogEvents = new List<InputLogEvent> { logEvent }
            });

            return false;
        }
    }
}
