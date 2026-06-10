using System.Net;
using System.Text.Json;
using System.Text.Json.Serialization;
using Amazon.IVSRealTime.Model;
using Amazon.Lambda.Core;
using Amazon.Lambda.SQSEvents;
using Amazon.SQS;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Configuration.Implementations;
using IvsIdleGameShared.Configuration.Interfaces;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Models.Boost;
using IvsIdleGameShared.Repositories.Implementations;
using IvsIdleGameShared.Repositories.Interfaces;
using IvsIdleGameShared.Services.Implementations;
using IvsIdleGameShared.Services.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Bson;
using PubnubApi;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace IvsBoost;

public class BoostEvent
{
    [JsonPropertyName("stageId")]
    public string StageId { get; set; } = "";
    
    [JsonPropertyName("vendorEventId")]
    public string VendorEventId { get; set; } = "";
    
    [JsonPropertyName("boostType")]
    public string BoostType { get; set; } = "";
    
    [JsonPropertyName("price")]
    public decimal Price { get; set; } = decimal.Zero;

    [JsonPropertyName("boostLevel")]
    public int BoostLevel { get; set; } = 1;
    
    [JsonPropertyName("authorizationHeader")]
    public string AuthorizationHeader { get; set; } = "";
}

public class Attributes
{
    public string ApproximateReceiveCount { get; set; } = "";
    public string AWSTraceHeader { get; set; } = "";
    public string SentTimestamp { get; set; } = "";
    public string SenderId { get; set; } = "";
    public string ApproximateFirstReceiveTimestamp { get; set; } = "";
}

public class CachedPersonalBoostValues
{
    public int PersonalBoost { get; set; } = 0;
    public long PersonalBoostStartTime { get; set; } = 0;
    public int PersonalBoostTotalDelayTime { get; set; } = 0;

}

public class UserNameAndPfp
{
    public string UserName { get; set; }
    public string PfpUrl { get; set; }
}

public class Function
{
    private static IServiceProvider services { get; set; }
    private readonly IFanVisibilityService _fanVisibilityServiceService;
    private readonly IStreamRepository _streamRepository;
    private readonly ICreditBalanceRepository _creditBalanceRepository;
    private readonly IBoostRepository _boostRepository;
    private readonly IBoostCacheRepository _boostCacheRepository;
    private readonly IIdleGameRepository _idleGameRepository;
    private readonly IUserRepository _userRepository;
    private readonly IWebSocketService _webSocketService;
    private readonly IBlockChainService _blockChainService;
    private readonly AmazonSQSClient _amazonSQSClient;
    private readonly decimal _timeDecayFactor = 0M;
    private readonly decimal _timeDecayFactorForComboMultiplier = 0.0M;
    private readonly int _baseAmountToIncrementPersonalBoostProgress = 17;
    private readonly string? _fetchFanDetailsUrlEnvironmentVar;
    private readonly string? _platformXApiKeyEnvironmentVar;
    private readonly string? _boostsQueueUrlEnvironmentVar;
    public static Dictionary<string, UserNameAndPfp> usersCache = new();


    private readonly Dictionary<int, decimal> _boostLevelPrice = new Dictionary<int, decimal>(){
        {1, 0.00M},
        {2, 100M},
        {3, 400M},
        {4, 1400M},
        {5, 4400M},
        {6, 10000M},
        {7, 30000M}
    };

    private readonly Dictionary<decimal, int> _boostPriceToLevel = new Dictionary<decimal, int>(){
        {0.00M, 1},
        {100M, 2},
        {400M, 3},
        {1400M, 4},
        {4400M, 5},
        {10000M, 6},
        {30000M, 7}
    };

    private readonly Dictionary<int, decimal> _boostLevelRallyPointMultiplier = new Dictionary<int, decimal>(){
        {1, 0.01M},
        {2, 100M},
        {3, 440M},
        {4, 1680M},
        {5, 5720M},
        {6, 14000M},
        {7, 45000M}
    };



    /// <summary>
    /// Default constructor. This constructor is used by Lambda to construct the instance. When invoked in a Lambda environment
    /// the AWS credentials will come fro
    /// the IAM role associated with the function and the AWS region will be set to the
    /// region the Lambda function is executed in.
    /// </summary>
    public Function()
    {
        _boostsQueueUrlEnvironmentVar = System.Environment.GetEnvironmentVariable("BOOSTS_QUEUE_URL");

        if (String.IsNullOrEmpty(_boostsQueueUrlEnvironmentVar))
        {
            Console.WriteLine("BOOSTS_QUEUE_URL Environment Variable is not set!");
        }

        _fetchFanDetailsUrlEnvironmentVar =
            System.Environment.GetEnvironmentVariable("PLATFORM_FETCH_FAN_DETAILS_URL");

        if (String.IsNullOrEmpty(_fetchFanDetailsUrlEnvironmentVar))
        {
            Console.WriteLine("PLATFORM_FETCH_FAN_DETAILS_URL Environment Variable is not set!");
        }

        _platformXApiKeyEnvironmentVar = System.Environment.GetEnvironmentVariable("PLATFORM_X_API_KEY");

        if (String.IsNullOrEmpty(_platformXApiKeyEnvironmentVar))
        {
            Console.WriteLine("PLATFORM_X_API_KEY Environment Variable is not set!");
        }

        string? fanVisibilityServiceEndpointEnvironmentVar =
            System.Environment.GetEnvironmentVariable("FAN_VISIBILITY_SERVICE_ENDPOINT");

        if (String.IsNullOrEmpty(fanVisibilityServiceEndpointEnvironmentVar))
        {
            Console.WriteLine("FAN_VISIBILITY_SERVICE_ENDPOINT Environment Variable is not set!");
        }

        string? fanVisibilityServicePortEnvironmentVar =
            System.Environment.GetEnvironmentVariable("FAN_VISIBILITY_SERVICE_PORT");

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
            System.Environment.GetEnvironmentVariable("FAN_VISIBILITY_SERVICE_PASSWORD");

        if (String.IsNullOrEmpty(fanVisibilityServicePasswordEnvironmentVar))
        {
            Console.WriteLine("FAN_VISIBILITY_SERVICE_PASSWORD Environment Variable is not set!");
        }

        string? fanVisibilityServiceUserEnvironmentVar =
            System.Environment.GetEnvironmentVariable("FAN_VISIBILITY_SERVICE_USER");

        if (String.IsNullOrEmpty(fanVisibilityServiceUserEnvironmentVar))
        {
            Console.WriteLine("FAN_VISIBILITY_SERVICE_USER Environment Variable is not set!");
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

        string? chatWebSocketPublisherKeyEnvironmentVar =
            System.Environment.GetEnvironmentVariable("CHAT_WEB_SOCKET_PUBLISHER_KEY");
        if (String.IsNullOrEmpty(chatWebSocketPublisherKeyEnvironmentVar))
        {
            Console.WriteLine("CHAT_WEB_SOCKET_PUBLISHER_KEY Environment Variable is not set!");
        }
        string? chatWebSocketSubscriberKeyEnvironmentVar =
            System.Environment.GetEnvironmentVariable("CHAT_WEB_SOCKET_SUBSCRIBER_KEY");
        if (String.IsNullOrEmpty(chatWebSocketSubscriberKeyEnvironmentVar))
        {
            Console.WriteLine("CHAT_WEB_SOCKET_SUBSCRIBER_KEY Environment Variable is not set!");
        }
        string? chatWebSocketSecretKeyEnvironmentVar =
            System.Environment.GetEnvironmentVariable("CHAT_WEB_SOCKET_SECRET_KEY");
        if (String.IsNullOrEmpty(chatWebSocketSecretKeyEnvironmentVar))
        {
            Console.WriteLine("CHAT_WEB_SOCKET_SECRET_KEY Environment Variable is not set!");
        }

        var serviceCollection = new ServiceCollection();
        serviceCollection.AddSingleton<IRedisSettings>(x => new RedisSettings()
        {
            EndPoint = fanVisibilityServiceEndpointEnvironmentVar,
            Port = fanVisibilityServicePort,
            Password = fanVisibilityServicePasswordEnvironmentVar,
            User = fanVisibilityServiceUserEnvironmentVar,
        });
        serviceCollection.AddSingleton<IRedisDbProvider, RedisDbProvider>();
        serviceCollection.AddSingleton<IMongoDbSettings>(x => new MongoDbSettings()
        {
            ConnectionUri = streamRepositoryConnectionUriEnvironmentVar,
            DatabaseName = streamRepositoryDatabaseNameEnvironmentVar,
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
        serviceCollection.AddSingleton<IChatWebSocketSettings>(x => new PubNubChatWebSocketSettings()
        {
            PublisherKey = chatWebSocketPublisherKeyEnvironmentVar,
            SubscriberKey = chatWebSocketSubscriberKeyEnvironmentVar,
            SecretKey = chatWebSocketSecretKeyEnvironmentVar,
        });
        serviceCollection.AddSingleton<IPlatformSettings>(x => new ThousandsPlatformSettings()
        {
            FetchFanDetailsUrl = _fetchFanDetailsUrlEnvironmentVar,
            PlatformXApiKey = _platformXApiKeyEnvironmentVar,
        });
        serviceCollection.AddSingleton<IFanVisibilityService, RedisFanVisibilityService>();
        serviceCollection.AddSingleton<IStreamRepository, MongoStreamRepository>();
        serviceCollection.AddSingleton<ICreditBalanceRepository, MongoCreditBalanceRepository>();
        serviceCollection.AddSingleton<IBoostCacheRepository, RedisBoostCacheRepository>();
        serviceCollection.AddScoped<IWebSocketService, PubNubWebSocketService>();
        serviceCollection.AddSingleton<IBoostRepository, MongoBoostRepository>();
        serviceCollection.AddSingleton<IIdleGameRepository, RedisIdleGameRepository>();
        serviceCollection.AddSingleton<IUserRepository, MongoUserRepository>();
        serviceCollection.AddSingleton<IBlockChainService, NextJsBlockchainService>();

        services = serviceCollection.BuildServiceProvider();
        _fanVisibilityServiceService = services.GetRequiredService<IFanVisibilityService>();
        _streamRepository = services.GetRequiredService<IStreamRepository>();
        _boostCacheRepository = services.GetRequiredService<IBoostCacheRepository>();
        _webSocketService = services.GetRequiredService<IWebSocketService>();
        _creditBalanceRepository = services.GetRequiredService<ICreditBalanceRepository>();
        _boostRepository = services.GetRequiredService<IBoostRepository>();
        _idleGameRepository = services.GetRequiredService<IIdleGameRepository>();
        _userRepository = services.GetRequiredService<IUserRepository>();
        _blockChainService = services.GetRequiredService<IBlockChainService>();

        _amazonSQSClient = new AmazonSQSClient();
    }


    /// <summary>
    /// This method is called for every Lambda invocation. This method takes in an SQS event object and can be used 
    /// to respond to SQS messages.
    /// </summary>
    /// <param name="events">The event for the Lambda function handler to process.</param>
    /// <param name="context">The ILambdaContext that provides methods for logging and describing the Lambda environment.</param>
    /// <returns></returns>
    public async Task<bool> FunctionHandler(SQSEvent events, ILambdaContext context)
    {
        Console.WriteLine(JsonSerializer.Serialize(events));
        string secretKey = "";

        Dictionary<string, int> boostEvents = new Dictionary<string, int>();
        var validator = new JsonWebTokenHandler();

        DateTimeOffset dto = new DateTimeOffset(DateTime.UtcNow);
        long currentTimestamp = dto.ToUnixTimeMilliseconds();

        var response = new Dictionary<string, object>();
        var triggeredBoostsList = new List<TriggeredBoost>();
        var boostsList = new List<Boost>();
        int totalRedBoosts = 0;
        int totalBlueBoosts = 0;
        //int amountToIncrementRedSharedBoostComboMultiplier = 0;
        //int amountToIncrementBlueSharedBoostComboMultiplier = 0;
        string stageId = string.Empty;
        string vendorEventId = string.Empty;

        //roundNumber is zero based
        int roundNumber = 0;

        bool totalRedBoostsInitialized = false;
        bool totalBlueBoostsInitialized = false;
        int redMultiplier = 0;
        int blueMultiplier = 0;

        string roundNumberString = "0";
        //int totalCreditsSpent = 0;

        int redInitialSharedBoostComboMultiplierToTest = 0;
        int blueInitialSharedBoostComboMultiplierToTest = 0;

        EventMatch? eventMatch = null;
        long eventMatchStartTime = 0;

        foreach (var message in events.Records)
        {
            //bool needToSetPersonalProgressStartTimeForThisBoostThisLoop = false;

            BoostEvent? boostEvent = null;
            try
            {
                boostEvent = JsonSerializer.Deserialize<BoostEvent>(message.Body);
                Console.WriteLine(JsonSerializer.Serialize(boostEvent));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deserializing boost: {ex.Message}");
            }

            //Make sure we have a valid boostEvent
            if (boostEvent == null)
            {
                Console.WriteLine("boostEvent is null!");
                await RemoveMessageFromQueue(message.ReceiptHandle);
                continue;
            }

            if (message.Attributes.TryGetValue("ApproximateFirstReceiveTimestamp", out string? approximateFirstReceiveTimestamp))
            {
                currentTimestamp = long.Parse(approximateFirstReceiveTimestamp);
                Console.WriteLine($"ApproximateFirstReceiveTimestamp: {approximateFirstReceiveTimestamp}");
            }

            vendorEventId = boostEvent.VendorEventId;
            stageId = boostEvent.StageId;
            string authorizationHeader = boostEvent.AuthorizationHeader;
            string boostType = boostEvent.BoostType;
            Console.WriteLine("authorizationHeader: " + authorizationHeader);

            var jwtTokenValidatorParams = new TokenValidationParameters()
            {
                ValidateIssuer = false,
                ValidateAudience = false,
                ValidateActor = false,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(secretKey))
            };

            string? userId = null;
            try
            {
                TokenValidationResult tokenValidationResult =
                    await validator.ValidateTokenAsync(authorizationHeader, jwtTokenValidatorParams);
                if (tokenValidationResult.IsValid)
                {
                    Console.WriteLine("Token is valid");
                    var jsonToken = validator.ReadJsonWebToken(authorizationHeader);
                    if (jsonToken == null)
                    {
                        Console.WriteLine("Unable to read JWT!");
                        await RemoveMessageFromQueue(message.ReceiptHandle);
                        continue;
                    }

                    //Get userId
                    var claimedUserId = jsonToken.Claims.First(claim => claim.Type == "userId");
                    userId = claimedUserId.Value;
                }
                else
                {
                    Console.WriteLine($"Token is invalid: {tokenValidationResult.Exception}");
                    await RemoveMessageFromQueue(message.ReceiptHandle);
                    continue;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Token validation error: {ex.Message}");
            }

            if (userId == null)
            {
                Console.WriteLine($"UserId is null: {userId}");
                await RemoveMessageFromQueue(message.ReceiptHandle);
                continue;
            }

            //Validate incoming data

            //Bogus incoming price from client, discard this boost
            if (!_boostPriceToLevel.ContainsKey(boostEvent.Price))
            {
                Console.WriteLine($"Bogus price from client: {boostEvent.Price} for userId: {userId}");
                await RemoveMessageFromQueue(message.ReceiptHandle);
                continue;
            }

            /*
            var stage = await _streamRepository.GetStage(stageId);
            if (stage == null)
            {
                Console.WriteLine($"Stage is null for stageId: {stageId}");
                continue;
            }*/

            //If we already pulled the eventMatch, it is the same one.  This currently only supports one active stream at a time.
            if (eventMatch == null)
            {
                //Get event match from Redis
                eventMatch = await _idleGameRepository.GetEventMatchFromStageId(stageId);
                if (eventMatch == null)
                {
                    Console.WriteLine("No active EventMatch!");
                    continue;
                }

                eventMatchStartTime = eventMatch.Timestamp;

                //roundNumber = stage.CurrentSegment ?? 0;
                roundNumber = eventMatch.Segment;
                roundNumberString = roundNumber.ToString();
            }

            Console.WriteLine("Start getting fan username and pfp url...");

            string fanName = string.Empty;
            string fanPfpUrl = string.Empty;

            if (usersCache.ContainsKey(userId))
            {
                UserNameAndPfp userNameAndPfp = usersCache[userId];
                fanName = userNameAndPfp.UserName;
                fanPfpUrl = userNameAndPfp.PfpUrl;
            }
            else
            {
                FanInTheStands? fan = await _fanVisibilityServiceService.GetFanInTheStands(vendorEventId, userId);
                if (fan == null)
                {
                    Console.WriteLine(
                        $"Unable to fetch fan from the stands userId: {userId} vendorEventId: {vendorEventId}.  Loading from users DB instead!");

                    //Load fan into the stands
                    var user = await _userRepository.GetUser(userId);

                    if (user.Id == ObjectId.Empty)
                    {
                        continue;
                    }

                    fanName = user?.Preferences?.DisplayName ?? "";
                    string pfpProvider = user?.Preferences?.ActivePfpImageUrl ?? "";
                    if (pfpProvider == "twitter")
                    {
                        fanPfpUrl = user?.TwitterProvider?.Image ?? "";
                    }
                    else if (pfpProvider == "discord")
                    {
                        fanPfpUrl = user?.DiscordProvider?.Image ?? "";
                    }
                    else if (pfpProvider == "google")
                    {
                        fanPfpUrl = user?.GoogleProvider?.Image ?? "";
                    }
                    else if (pfpProvider == "wallet")
                    {
                        fanPfpUrl = user?.WalletProvider?.Pfp?.ImageUrl ?? "";
                    }

                    //Add to local hash table cache
                    usersCache.Add(userId, new UserNameAndPfp { UserName = fanName, PfpUrl = fanPfpUrl });

                    // Fetch fan details to get wildpasses and swagpins
                    GetWildpassesAndSwagPinsResponse getWildPassesAndSwagPins =
                        await _blockChainService.GetWildpassesAndSwagPins(userId);

                    Random random = new Random((int)currentTimestamp);
                    int seatSectionNumber = random.Next(0, 4);
                    int seatScore = 1;

                    //Don't allow staff users to get an airdrop
                    bool hasWalletAddress = true;

                    //Add the user to fans in the stands
                    FanInTheStands fanInTheStands = new FanInTheStands()
                    {
                        FanId = userId,
                        FanName = fanName,
                        FanPfpUrl = fanPfpUrl,
                        WildfileAgeDays = 1,
                        Timestamp = currentTimestamp,
                        SeatSectionNumber = seatSectionNumber,
                        SeatScore = seatScore,
                        HasWalletAddress = hasWalletAddress,
                        WalletAddress = user?.WalletProvider?.Address,
                        HasWildfilePfp = !String.IsNullOrEmpty(fanPfpUrl),
                        AdditionalWalletAddresses = null,
                        Wildpasses = getWildPassesAndSwagPins.Wildpasses,
                        SwagPins = getWildPassesAndSwagPins.SwagPins
                    };
                    await _fanVisibilityServiceService.AddFanInTheStand(vendorEventId, fanInTheStands);

                    Console.WriteLine($"Added fan to fansInTheStands: {JsonSerializer.Serialize(fanInTheStands)}");

                    //Send the Channel Entrance Message
                    ChannelEntranceMessage channelEntranceMessage = new ChannelEntranceMessage()
                    {
                        FanID = userId,
                        FanName = fanName,
                        FanPfpUrl = fanPfpUrl,
                        SeatSectionNumber = seatSectionNumber,
                        SeatScore = seatScore,
                        Timestamp = currentTimestamp,
                        HasWalletAddress = true
                    };

                    Console.WriteLine(channelEntranceMessage);

                    await _fanVisibilityServiceService.SendFanVisibilityEvent(vendorEventId, "ChannelEntrance",
                        channelEntranceMessage);
                }
                else
                {
                    fanName = fan.FanName;
                    fanPfpUrl = fan.FanPfpUrl;
                    usersCache.Add(userId, new UserNameAndPfp { UserName = fanName, PfpUrl = fanPfpUrl});
                }
            }

            //Look for personal progress start time 
            //long personalProgressStartTime = 0;
            //personalProgressStartTime = await _boostCacheRepository.GetPersonalProgressStartTime(stageId, userId, boostType, roundNumberString);

            //Console.WriteLine($"GetPersonalProgressStartTime: {personalProgressStartTime}");

            //If we haven't set a personal progress start time yet, then set it (first time user clicked a boost this round)
            /*
            if (personalProgressStartTime < 1)
            {
                personalProgressStartTime = currentTimestamp;
                needToSetPersonalProgressStartTimeForThisBoostThisLoop = true;
            }
            */

            Console.WriteLine("Start getting Total Boosts...");

            //Run on first loop only
            if (!totalRedBoostsInitialized)
            {
                //redMultiplier = await _boostCacheRepository.GetSharedBoostComboMultiplier(stageId, "red", roundNumberString);
                redMultiplier = await _boostCacheRepository.GetTotalBoost(stageId, "red", roundNumberString);
                redInitialSharedBoostComboMultiplierToTest = (int)Math.Floor(CalculateComboMultiplierFromTeamRallyPoints(redMultiplier, currentTimestamp, eventMatchStartTime) * 1000.0M);
                totalRedBoostsInitialized = true;
            }

            //Run on first loop only
            if (!totalBlueBoostsInitialized)
            {
                //blueMultiplier = await _boostCacheRepository.GetSharedBoostComboMultiplier(stageId, "blue", roundNumberString);
                blueMultiplier = await _boostCacheRepository.GetTotalBoost(stageId, "blue", roundNumberString);
                blueInitialSharedBoostComboMultiplierToTest = (int)Math.Floor(CalculateComboMultiplierFromTeamRallyPoints(blueMultiplier, currentTimestamp, eventMatchStartTime) * 1000.0M);
                totalBlueBoostsInitialized = true;
            }

            Console.WriteLine("End getting Total Boosts");

            int personalBoostProgress = 0;
            personalBoostProgress = await _boostCacheRepository.GetPersonalBoostProgress(stageId, userId, boostType, roundNumberString);

            Console.WriteLine("End getting Personal Boost Progress");

            //decimal adjustedPersonalBoostProgress = (decimal)personalBoostProgress - (decimal)((currentTimestamp - personalProgressStartTime) * 0.001M * _timeDecayFactor);
            decimal adjustedPersonalBoostProgress = (decimal)personalBoostProgress;
            Console.WriteLine($"adjustedPersonalBoostProgress: {adjustedPersonalBoostProgress}");
            if (adjustedPersonalBoostProgress <= 0.0M)
            {
                adjustedPersonalBoostProgress = 0.0M;

                //long adjustCurrentTimeStampByBoostProgress = currentTimestamp - (personalBoostProgress * (int)((decimal)(1.0M / 0.001M) * (1.0M/_timeDecayFactor)));
                long adjustCurrentTimeStampByBoostProgress = personalBoostProgress;
                //personalProgressStartTime = adjustCurrentTimeStampByBoostProgress;
                //needToSetPersonalProgressStartTimeForThisBoostThisLoop = true;

                Console.WriteLine($"Resetting personalProgressStartTime to {adjustCurrentTimeStampByBoostProgress}");
            }

            //Keep personal boost level in range
            int personalBoostLevel = (int)Math.Floor(adjustedPersonalBoostProgress / 100.0M) + 1;
            if (personalBoostLevel <= 1)
            {
                personalBoostLevel = 1;
            }
            if (personalBoostLevel > 7)
            {
                personalBoostLevel = 7;
            }

            //We check to make sure this boost has enough credits, before we write any data.  All previous code is just reading and calculating values.
            int? creditsLeft = null;
            decimal price = _boostLevelPrice[personalBoostLevel];

            //There was a discrepancy in price.  Honor the user's price, but log the discrepancy.
            if (boostEvent.Price != price)
            {
                //Free boost
                if (boostEvent.Price < 1)
                {
                    //If more than 1 level of personal boost difference, then ignore the Free boost
                    if (personalBoostLevel > 3)
                    {
                        await RemoveMessageFromQueue(message.ReceiptHandle);
                        continue;
                    }
                }
                else //Paid boost
                {
                    price = boostEvent.Price;
                    //Adjust their personal boost level down to the price so they don't get too much credit
                    personalBoostLevel = _boostPriceToLevel[price];
                }
            }

            if (boostEvent.BoostLevel != personalBoostLevel)
            {
                Console.WriteLine(
                    $"The incoming boost claims to be level {boostEvent.BoostLevel}, but the calculated level is {personalBoostLevel}");
            }

            int creditBalance = 0;
            if (price > 0)
            {
                creditBalance = await _creditBalanceRepository.GetCreditBalance(userId);
                if (price > creditBalance)
                {
                    Console.WriteLine($"You do not have enough funds: {creditBalance}");
                    // @todo send pubnub message user they do not have enough funds
                    continue;
                }

                /*
                // UpdateCreditBalance is actually increment (0 - (int)price) is the amount to decrease credits
                await _creditBalanceRepository.UpdateCreditBalance(userId, 0 - (int)price);

                //credits left is equal to the credit balance minus the price
                creditsLeft = creditBalance - (int)price;

                Console.WriteLine($"Deducted {0 - (int)price} credits");
                */
            }

            /*
            if (needToSetPersonalProgressStartTimeForThisBoostThisLoop)
            {
                //Set new personal progress start time
                await _boostCacheRepository.SetPersonalProgressStartTime(stageId, userId, boostType, roundNumberString, personalProgressStartTime);
            }
            */

            // how to keep track of shared ratio (red/blue) from redis key:value?
            int amountToIncrementPersonalBoostProgress = 0;
            int rallyPoints = 0;
            decimal comboMultiplier = 1M;
            if (boostType == "red")
            {
                amountToIncrementPersonalBoostProgress = _baseAmountToIncrementPersonalBoostProgress;

                await _boostCacheRepository.IncrementPersonalBoostProgress(stageId, userId, boostType, roundNumberString, amountToIncrementPersonalBoostProgress);

                comboMultiplier = CalculateComboMultiplierFromTeamRallyPoints(redMultiplier, currentTimestamp, eventMatchStartTime);

                Console.WriteLine($"Red comboMultiplier: {comboMultiplier}");

                rallyPoints = (int)(_boostLevelRallyPointMultiplier[personalBoostLevel] * comboMultiplier);
                if (rallyPoints < 1)
                {
                    rallyPoints = 1;
                }
                totalRedBoosts += rallyPoints;
            }
            else if (boostType == "blue")
            {
                amountToIncrementPersonalBoostProgress = _baseAmountToIncrementPersonalBoostProgress;

                await _boostCacheRepository.IncrementPersonalBoostProgress(stageId, userId, boostType, roundNumberString, amountToIncrementPersonalBoostProgress);

                comboMultiplier = CalculateComboMultiplierFromTeamRallyPoints(blueMultiplier, currentTimestamp, eventMatchStartTime);

                Console.WriteLine($"Blue comboMultiplier: {comboMultiplier}");

                rallyPoints = (int)(_boostLevelRallyPointMultiplier[personalBoostLevel] * comboMultiplier);
                if (rallyPoints < 1)
                {
                    rallyPoints = 1;
                }
                totalBlueBoosts += rallyPoints;
            }

                //Increment personal progress total delay time by 10 to stop the progress from going backwards each time you do a boost
                //await _boostCacheRepository.IncrementPersonalProgressTotalDelayTime(stageId, userId, boostType, roundNumberString, 10);
                //Get personal progress total delay time 
                //int personalProgressTotalDelayTime = await _boostCacheRepository.GetPersonalProgressTotalDelayTime(stageId, userId, roundNumberString, boostType);

                //We don't need to await this response
                /*
                _ = _boostRepository.AddBoost(stageId, roundNumber, new Boost
                {
                    UserId = userId,
                    IdentityId = "67868a71e05c5a59b4b28ee5", //Wildcard
                    VendorEventId = vendorEventId,
                    StageId = stageId,
                    TransactionId = new Guid().ToString(),
                    BoostType = boostType,
                    BoostAmount = boostAmountForAiCredit,
                    Timestamp = currentTimestamp
                });
                */

            var boostToAdd = new Boost
            {
                UserId = userId,
                IdentityId = "67868a71e05c5a59b4b28ee5", //Wildcard
                VendorEventId = vendorEventId,
                StageId = stageId,
                TransactionId = new Guid().ToString(),
                BoostType = boostType,
                BoostAmount = rallyPoints,
                BoostPrice = (int)price,
                Timestamp = currentTimestamp
            };

            //If this is paid, we need to add the boost and update the credit balance
            if (price > 0)
            {
                try
                {
                    //Write the boost row
                    await _boostRepository.AddBoost(stageId, roundNumber, boostToAdd);
                }
                catch (Exception ex)
                {
                    Console.WriteLine("IvsBoost: Failed to write boost: " + ex.ToString());
                    continue;
                }

                // UpdateCreditBalance is actually increment (0 - (int)price) is the amount to decrease credits
                await _creditBalanceRepository.UpdateCreditBalance(userId, 0 - (int)price);

                //credits left is equal to the credit balance minus the price
                creditsLeft = creditBalance - (int)price;

                Console.WriteLine($"Deducted {0 - (int)price} credits");

                //Delete processed message
                await RemoveMessageFromQueue(message.ReceiptHandle);
            }
            //If the boost is free, add to a list of boosts that we will write to the MongoDB all at once after we loop through all the boosts
            else {
                boostsList.Add(boostToAdd);
            }

            triggeredBoostsList.Add(new TriggeredBoost
            {
                Timestamp = currentTimestamp,
                UserId = userId,
                CreditsLeft = creditsLeft,
                UserName = fanName,
                PfpUrl = fanPfpUrl,
                BoostType = boostType,
                BoostLevel = personalBoostLevel,
                BoostProgress = personalBoostProgress + amountToIncrementPersonalBoostProgress,
                PersonalProgressStartTime = 0,
                PersonalProgressTotalDelayTime = 0
            });
        }

        //Write the list of boosts to boosts-segments in MongoDb
        var addBoostsTask = _boostRepository.AddBoosts(stageId, roundNumber, boostsList.ToArray());

        //Increment the credits spent running total
        //var incrementCreditsSpentTask = _

        //Increment the total boost amounts
        var incrementRedTotalBoostTask = _boostCacheRepository.IncrementTotalBoosts(stageId, "red", roundNumberString, totalRedBoosts);
        var incrementBlueTotalBoostTask = _boostCacheRepository.IncrementTotalBoosts(stageId, "blue", roundNumberString, totalBlueBoosts);

        Task.WaitAll(incrementRedTotalBoostTask, incrementBlueTotalBoostTask);

        //Increment the combo multipliers
        //var incrementRedSharedBoostComboMultiplierTask = _boostCacheRepository.IncrementSharedBoostComboMultiplier(stageId, "red", roundNumberString, amountToIncrementRedSharedBoostComboMultiplier);
        //var incrementBlueSharedBoostComboMultiplierTask = _boostCacheRepository.IncrementSharedBoostComboMultiplier(stageId, "blue", roundNumberString, amountToIncrementBlueSharedBoostComboMultiplier);
        var currentTotalRedBoostsTask = _boostCacheRepository.GetTotalBoost(stageId, "red", roundNumberString);
        var currentTotalBlueBoostsTask = _boostCacheRepository.GetTotalBoost(stageId, "blue", roundNumberString);

        Task.WaitAll(addBoostsTask, currentTotalRedBoostsTask, currentTotalBlueBoostsTask);

        int currentTotalRedBoosts = currentTotalRedBoostsTask.Result;
        int currentTotalBlueBoosts = currentTotalBlueBoostsTask.Result;

        //int redSharedBoostComboMultiplier = incrementRedSharedBoostComboMultiplierTask.Result;
        //int bluedSharedBoostComboMultiplier = incrementBlueSharedBoostComboMultiplierTask.Result;

        decimal redBlueRatio = 0.5M;
        int totalBoosts = currentTotalRedBoosts + currentTotalBlueBoosts;
        if (totalBoosts > 0)
        {
            redBlueRatio = Math.Round((decimal)currentTotalRedBoosts / (decimal)totalBoosts, 2);
        }

        BoostSignalMessage boostSignalMessage = new BoostSignalMessage
        {
            BoostEventType = "BoostsTriggered",
            EventId = stageId,
            RedBlueRatio = redBlueRatio,
            RedComboMultiplier = CalculateComboMultiplierFromTeamRallyPoints(currentTotalRedBoosts, currentTimestamp, eventMatchStartTime),
            BlueComboMultiplier = CalculateComboMultiplierFromTeamRallyPoints(currentTotalBlueBoosts, currentTimestamp, eventMatchStartTime),
            TotalRedBoosts = currentTotalRedBoosts,
            TotalBlueBoosts = currentTotalBlueBoosts,
            RoundNumber = roundNumber + 1, //We add one because roundNumber is zero based
            Boosts = triggeredBoostsList,
        };

        string boostSignalMessageString = JsonSerializer.Serialize(boostSignalMessage);

        Console.WriteLine(boostSignalMessageString);

        bool sendMessageSuccess = await _webSocketService.SendMessageSignalToPlatformClient($"s.{boostSignalMessage.EventId}", "system",
            boostSignalMessageString);

        int redSharedBoostComboMultiplierToTest = (int)Math.Floor(CalculateComboMultiplierFromTeamRallyPoints(currentTotalRedBoosts, currentTimestamp, eventMatchStartTime) * 1000.0M);
        int bluedSharedBoostComboMultiplierToTest = (int)Math.Floor(CalculateComboMultiplierFromTeamRallyPoints(currentTotalBlueBoosts, currentTimestamp, eventMatchStartTime) * 1000.0M);

        if (totalRedBoosts > 0)
        {
            await HandleComboMultiplierIncreaseAndFireOffGameEffects(vendorEventId, stageId, roundNumber.ToString(),
                redSharedBoostComboMultiplierToTest, redInitialSharedBoostComboMultiplierToTest, "red");
        }

        if (totalBlueBoosts > 0)
        {
            await HandleComboMultiplierIncreaseAndFireOffGameEffects(vendorEventId, stageId, roundNumber.ToString(),
                bluedSharedBoostComboMultiplierToTest, blueInitialSharedBoostComboMultiplierToTest, "blue");
        }

        return true;
    }

    private async Task ProcessMessageAsync(SQSEvent.SQSMessage message, ILambdaContext context)
    {
        context.Logger.LogInformation($"Processed message {message.Body}");

        // TODO: Do interesting work based on the new message
        await Task.CompletedTask;
    }

    private async Task HandleComboMultiplierIncreaseAndFireOffGameEffects(string vendorEventId, string stageId, string boostSegment, 
        int newComboMultiplier, int previousComboMultiplier, string teamColor)
    {
        Console.WriteLine($"HandleComboMultiplierIncreaseAndFireOffGameEffects - vendorEventId: {vendorEventId} {teamColor} {newComboMultiplier} {previousComboMultiplier}");

        string fanfareEventType = "FanfareEffect";
        string suffix = teamColor == "red" ? "_team1" : "_team0";

        if (previousComboMultiplier < 1140 && newComboMultiplier is >= 1140 and < 1210) //Camera flashes - 6 seconds
        {
            if (await CheckOrSetEffectLock(stageId, boostSegment))
            {
                return;
            }

            Console.WriteLine("Game Effect - Camera flashes");

            FanfareEffect fanfareEffect = new FanfareEffect()
            {
                Type = "AudienceNiagara",
                Name = "ff.ns.CameraFlashes01",
                Value = "RandomActivation",
                SectionId = 0,
                SectionName = "",
                Magnitude = 100,
                Delay = 0,
                Duration = 6,
                Notify = false
            };
            await _fanVisibilityServiceService.SendFanVisibilityEvent(vendorEventId, fanfareEventType, fanfareEffect);
        }
        else if (previousComboMultiplier < 1210 && newComboMultiplier is >= 1210 and < 1280) //low intensity clap emoji across the whole stadium - 6 seconds
        {
            if (await CheckOrSetEffectLock(stageId, boostSegment))
            {
                return;
            }

            Console.WriteLine("Game Effect - low intensity clap emoji across the whole stadium");

            FanfareEffect fanfareEffect = new FanfareEffect()
            {
                Type = "AudienceNiagara",
                Name = "ff.ns.group_clap" + suffix,
                Value = "RandomActivation",
                SectionId = 0,
                SectionName = "",
                Magnitude = 12, //quantity of emojiEvents
                Delay = 0,
                Duration = 6,
                Notify = false,
                Metadata = new AirDropMetadata()
            };
            await _fanVisibilityServiceService.SendFanVisibilityEvent(vendorEventId, fanfareEventType, fanfareEffect);
        }
        else if (previousComboMultiplier < 1280 && newComboMultiplier is >= 1280 and < 1350) //medium intensity party emoji across the whole stadium at low intensity - 6 seconds
        {
            if (await CheckOrSetEffectLock(stageId, boostSegment))
            {
                return;
            }

            Console.WriteLine("Game Effect - medium intensity party emoji across the whole stadium at low intensity");

            FanfareEffect fanfareEffect = new FanfareEffect()
            {
                Type = "AudienceNiagara",
                Name = "ff.ns.group_party" + suffix,
                Value = "RandomActivation",
                SectionId = 0,
                SectionName = "",
                Magnitude = 100, //quantity of emojiEvents
                Delay = 0,
                Duration = 6,
                Notify = false,
                Metadata = new AirDropMetadata()
            };
            await _fanVisibilityServiceService.SendFanVisibilityEvent(vendorEventId, fanfareEventType, fanfareEffect);
        }
        else if (previousComboMultiplier < 1350 && newComboMultiplier is >= 1350 and < 1420) //high intensity boom emoji across the whole stadium at low intensity - 8 seconds
        {
            if (await CheckOrSetEffectLock(stageId, boostSegment))
            {
                return;
            }

            Console.WriteLine("Game Effect - high intensity boom emoji across the whole stadium at low intensity");

            FanfareEffect fanfareEffect = new FanfareEffect()
            {
                Type = "AudienceNiagara",
                Name = "ff.ns.group_boom" + suffix,
                Value = "RandomActivation",
                SectionId = 0,
                SectionName = "",
                Magnitude = 1000, //quantity of emojiEvents
                Delay = 0,
                Duration = 8,
                Notify = false,
                Metadata = new AirDropMetadata()
            };
            await _fanVisibilityServiceService.SendFanVisibilityEvent(vendorEventId, fanfareEventType, fanfareEffect);
        }
        else if (previousComboMultiplier < 1420 && newComboMultiplier is >= 1420 and < 1490) //high intensity fire emoji across the whole stadium at low intensity - 8 seconds
        {
            if (await CheckOrSetEffectLock(stageId, boostSegment))
            {
                return;
            }

            Console.WriteLine("Game Effect - high intensity fire emoji across the whole stadium at low intensity");

            FanfareEffect fanfareEffect = new FanfareEffect()
            {
                Type = "AudienceNiagara",
                Name = "ff.ns.group_flame" + suffix,
                Value = "RandomActivation",
                SectionId = 0,
                SectionName = "",
                Magnitude = 1000, //quantity of emojiEvents
                Delay = 0,
                Duration = 8,
                Notify = false,
                Metadata = new AirDropMetadata()
            };
            await _fanVisibilityServiceService.SendFanVisibilityEvent(vendorEventId, fanfareEventType, fanfareEffect);
        }
        else if (previousComboMultiplier < 1490 && newComboMultiplier is >= 1490 and < 1560) //high intensity house signs/banners (champions, foam fingers, house banners, or summons) across the whole stadium - 10 seconds
        {
            if (await CheckOrSetEffectLock(stageId, boostSegment))
            {
                return;
            }

            Console.WriteLine("Game Effect - high intensity house signs/banners");

            FanfareEffect fanfareEffect = new FanfareEffect()
            {
                Type = "AudienceBillboard",
                Name = "ff.bb.foam_finger" + suffix,
                Value = "RandomActivation",
                SectionId = 0,
                SectionName = "",
                Magnitude = 1000,
                Delay = 0,
                Duration = 10,
                Notify = false
            };
            await _fanVisibilityServiceService.SendFanVisibilityEvent(vendorEventId, fanfareEventType, fanfareEffect);
        }
        else if (previousComboMultiplier < 1560 && newComboMultiplier is >= 1560 and < 1630) //Trigger high intensity smoke bombs across the whole stadium - 10 seconds
        {
            if (await CheckOrSetEffectLock(stageId, boostSegment))
            {
                return;
            }

            Console.WriteLine("Game Effect - Trigger high intensity smoke bombs across the whole stadium");

            FanfareEffect fanfareEffect = new FanfareEffect()
            {
                Type = "AudienceNiagara",
                Name = "ff.ns.group_smokebomb" + suffix,
                Value = "RandomActivation",
                SectionId = 0,
                SectionName = "",
                Magnitude = 500,
                Delay = 0,
                Duration = 10,
                Notify = false
            };
            await _fanVisibilityServiceService.SendFanVisibilityEvent(vendorEventId, fanfareEventType, fanfareEffect);
        }
        else if (previousComboMultiplier < 1630 && newComboMultiplier is >= 1630 and < 1700) //Trigger high intensity fireworks - 10 seconds
        {
            if (await CheckOrSetEffectLock(stageId, boostSegment))
            {
                return;
            }

            Console.WriteLine("Game Effect - Trigger high intensity fireworks");

            FanfareEffect fanfareEffect = new FanfareEffect()
            {
                Type = "AudienceNiagara",
                Name = "ff.ns.fireworks" + suffix,
                Value = "RandomActivation",
                SectionId = 0,
                SectionName = "",
                Magnitude = 75,
                Delay = 0,
                Duration = 10,
                Notify = false
            };
            await _fanVisibilityServiceService.SendFanVisibilityEvent(vendorEventId, fanfareEventType, fanfareEffect);
        }
        else if (previousComboMultiplier < 1700 && newComboMultiplier >= 1700) //THE WAVE - 12 seconds
        {
            if (await CheckOrSetEffectLock(stageId, boostSegment))
            {
                return;
            }

            Console.WriteLine("Game Effect - THE WAVE");

            FanfareEffect fanfareEffect = new FanfareEffect()
            {
                Type = "AudienceWave",
                Name = "ff.aw.AudienceWave01",
                Value = "string",
                SectionId = 0,
                SectionName = "",
                Magnitude = 2, //How many times it goes around
                Delay = 0,
                Duration = 0, //Not used for wave
                Notify = false
            };
            await _fanVisibilityServiceService.SendFanVisibilityEvent(vendorEventId, fanfareEventType, fanfareEffect);

            FanfareEffect fanfareEffect2 = new FanfareEffect()
            {
                Type = "Lighting",
                Name = "SomeEffect",
                Value = "string",
                SectionId = 0,
                SectionName = "",
                Magnitude = 1,
                Delay = 0,
                Duration = 30,
                Notify = false
            };
            await _fanVisibilityServiceService.SendFanVisibilityEvent(vendorEventId, fanfareEventType, fanfareEffect2);
        }
    }

    //returns true if there is a 10 second lock in place otherwise returns false and sets a new lock based on the currentTimestamp
    private async Task<bool> CheckOrSetEffectLock(string stageId, string boostSegment)
    {
        DateTimeOffset dto = new DateTimeOffset(DateTime.UtcNow);
        long currentTimestamp = dto.ToUnixTimeMilliseconds();

        long lastTriggedEffectTime = await _boostCacheRepository.GetLastTriggeredEffectTime(stageId, boostSegment);

        if (lastTriggedEffectTime == 0 || lastTriggedEffectTime + 10000 < currentTimestamp)
        {
            await _boostCacheRepository.SetLastTriggeredEffectTime(stageId, boostSegment, currentTimestamp);

            Console.WriteLine("Set Game Effect locked after playing effect");

            return false;
        }

        Console.WriteLine("Game Effect is locked and won't play!");

        return true;
    }

    private decimal CalculateComboMultiplierFromTeamRallyPoints(int teamRallyPoints, long currentTimestamp, long eventMatchStartTime)
    {
        Console.WriteLine($"CalculateComboMultiplierFromTeamRallyPoints - teamRallyPoints: {teamRallyPoints} currentTimestamp: {currentTimestamp} eventMatchStartTime: {eventMatchStartTime}");

        //decimal adjustedTeamRallyPoints = ((decimal)teamRallyPoints - (((decimal)currentTimestamp - (decimal)eventMatchStartTime) * 0.001M * _timeDecayFactorForComboMultiplier));
        decimal adjustedTeamRallyPoints = teamRallyPoints;

        Console.WriteLine($"initial adjustedTeamRallyPoints: {adjustedTeamRallyPoints}");

        if (adjustedTeamRallyPoints < 0)
            adjustedTeamRallyPoints = 0;

        decimal outputValue = Math.Max(1.0M, Math.Round(1.0M + (0.001M * (decimal)Math.Sqrt((double)adjustedTeamRallyPoints)), 2));
        Console.WriteLine($"CalculateComboMultiplierFromTeamRallyPoints output: {outputValue}");

        return outputValue;
    }

    private async Task<bool> RemoveMessageFromQueue(string messageReceiptHandle)
    {
        try
        {
            var deleteMessageResponse =
                await _amazonSQSClient.DeleteMessageAsync(_boostsQueueUrlEnvironmentVar, messageReceiptHandle);
            if (deleteMessageResponse.HttpStatusCode != HttpStatusCode.OK)
            {
                Console.WriteLine("Failed to delete message.");
            }
            else
            {
                Console.WriteLine("Message removed from queue.");
                return true;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex.Message);
        }

        return false;
    }
}
