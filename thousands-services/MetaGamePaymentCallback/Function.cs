using Amazon.CloudWatchLogs;
using Amazon.CloudWatchLogs.Model;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Models.Payment;
using IvsIdleGameShared.Repositories.Interfaces;
using IvsIdleGameShared.Utilities;
using Microsoft.Extensions.DependencyInjection;
using System.Text.Json;
using IvsIdleGameShared.Models.Metagame;
using IvsIdleGameShared.Models.Payment.CardPack;
using IvsIdleGameShared.Repositories.Implementations;
using MongoDB.Bson;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace MetaGamePaymentCallback;

public class Function
{
    private readonly string _paymentWebHookSecret;
    private readonly string _payToWalletAddress;
    private readonly ICardPackRepository _cardPackRepository;
    private static IServiceProvider? services;
    private readonly IAmazonCloudWatchLogs _cloudWatchLogClient;

    public Function()
    {
        string? cardPackRepositoryConnectionUriEnvironmentVar =
            Environment.GetEnvironmentVariable("CARD_PACK_REPOSITORY_CONNECTION_URI");

        if (String.IsNullOrEmpty(cardPackRepositoryConnectionUriEnvironmentVar))
        {
            Console.WriteLine("CARD_PACK_REPOSITORY_CONNECTION_URI Environment Variable is not set!");
        }

        string? cardPackRepositoryDatabaseNameEnvironmentVar =
            Environment.GetEnvironmentVariable("CARD_PACK_REPOSITORY_DATABASE_NAME");

        if (String.IsNullOrEmpty(cardPackRepositoryDatabaseNameEnvironmentVar))
        {
            Console.WriteLine("CARD_PACK_REPOSITORY_DATABASE_NAME Environment Variable is not set!");
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
            ConnectionUri = cardPackRepositoryConnectionUriEnvironmentVar,
            DatabaseName = cardPackRepositoryDatabaseNameEnvironmentVar,
            StreamsCollectionName = "streams",
            UsersCollectionName = "users",
            EventsCollectionName = "stages",
            EventIdleEventsCollectionName = "event-idle-events",
            MarketTransactionsCollectionName = "market-transactions",
            UserCoinsCollectionName = "user-coins",
            CreditTransactionCollectionName = "credit-transactions",
            CreditBalanceCollectionName = "credit-balances",
            BoostsSegmentsCollectionName = "boosts-segments",
            CardPacksCollectionName = "card-packs",
            CardPackVaultsCollectionName = "card-pack-vaults"
        });
        serviceCollection.AddSingleton<ICardPackRepository, MongoCardPackRepository>();
        services = serviceCollection.BuildServiceProvider();

        _cardPackRepository = services.GetRequiredService<ICardPackRepository>();
        _paymentWebHookSecret = paymentWebHookSecretEnvironmentVar ?? string.Empty;
        _payToWalletAddress = payToWalletAddressEnvironmentVar ?? string.Empty;
        _cloudWatchLogClient = new AmazonCloudWatchLogsClient();
    }

    /// <summary>
    /// A simple function that takes a string and does a ToUpper
    /// </summary>
    /// <param name="input">The event for the Lambda function handler to process.</param>
    /// <param name="context">The ILambdaContext that provides methods for logging and describing the Lambda environment.</param>
    /// <returns></returns>
    public async Task<bool> FunctionHandler(APIGatewayHttpApiV2ProxyRequest proxyRequest, ILambdaContext context)
    {
        const string logGroupName = "metagame-payment-callback-issues";

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
            var thirdWebCardPackPaymentConfirmation = JsonSerializer.Deserialize<ThirdWebCardPackPaymentConfirmation>(proxyRequest.Body);

            if (thirdWebCardPackPaymentConfirmation == null)
            {
                Console.WriteLine("Error deserializing webhook data.");
                return false;
            }

            var toAddress = thirdWebCardPackPaymentConfirmation.Data.Receiver;
            var destinationAmount = thirdWebCardPackPaymentConfirmation.Data.DestinationAmount;
            var status = thirdWebCardPackPaymentConfirmation.Data.Status;
            var transactionId = thirdWebCardPackPaymentConfirmation.Data.TransactionId;
            var userId = thirdWebCardPackPaymentConfirmation.Data.PurchaseData.UserId;
            int cardPackHouseId = thirdWebCardPackPaymentConfirmation.Data.PurchaseData.CardPackHouseId;

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
            else if (cardPackHouseId < 0 || cardPackHouseId > 2)
            {
                Console.WriteLine("cardPackHouse is out of range!");
                fraudWarningType = "CARDPACKHOUSEOUTOFRANGE";
            }
            else if (destinationAmount != "200000")
            {
                Console.WriteLine("destinationAmount is incorrect!");
                fraudWarningType = "WRONGDESTINATIONAMOUNT";
            }

            if (!string.IsNullOrEmpty(fraudWarningType))
            {
                string logGuid = Guid.NewGuid().ToString();
                string logStreamName = $"metagame-payment-issues-{logGuid}";
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

            // Process the transaction based on its status
            if (status == "COMPLETED")
            {
                Console.WriteLine($"Transaction {transactionId} completed.");

                //Convert House to House

                var newCardPack = new CardPack
                {
                    Id = ObjectId.GenerateNewId(),
                    UserId = ObjectId.Parse(userId),
                    HouseId = cardPackHouseId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                var addCardPackSuccess = await _cardPackRepository.AddCardPack(newCardPack);

                //If we fail to add the card pack, this is really bad.  We need to highlight these to our support team to fix immediately.
                if (!addCardPackSuccess)
                {
                    Console.WriteLine($"Transaction {transactionId} failed to add card pack.");

                    string logGuid = Guid.NewGuid().ToString();
                    string logStreamName = $"metagame-payment-issues-{logGuid}";
                    await _cloudWatchLogClient.CreateLogStreamAsync(new CreateLogStreamRequest
                    {
                        LogGroupName = logGroupName,
                        LogStreamName = logStreamName
                    });

                    var logEvent = new InputLogEvent
                    {
                        Message = $"Failed to add card pack: {requestBody}",
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

                //Update the matching card pack vault
                var incrementCardPackVaultAmountSuccess = await _cardPackRepository.IncrementCardPackVaultAmount(1, 1.0M);

                //We failed to update the card pack vault amount
                if (!incrementCardPackVaultAmountSuccess)
                {
                    Console.WriteLine($"Transaction {transactionId} failed to increment card pack vault amount.");
                }
            }
            else if (status == "FAILED")
            {
                Console.WriteLine($"Transaction {transactionId} failed.");
            }
            else if (status == "PENDING")
            {
                Console.WriteLine($"Transaction {transactionId} is pending.");
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
            string logStreamName = $"metagame-payment-issues-{logGuid}";
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
