using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.SQSEvents;
using Amazon.Lambda.Core;
using Microsoft.Extensions.DependencyInjection;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Configuration.Implementations;
using IvsIdleGameShared.Configuration.Interfaces;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Repositories.Implementations;
using IvsIdleGameShared.Repositories.Interfaces;
using IvsIdleGameShared.Services.Interfaces;
using IvsIdleGameShared.Services.Implementations;
using System.Text.Json;
using IvsIdleGameShared.Models.IdleGame;
using IvsIdleGameShared.Models.Wildcard;
using Amazon.IVSRealTime.Model;
using IvsIdleGameShared.Models.Leaderboard;
using IvsIdleGameShared.Models.Prediction;
using IvsIdleGameShared.Models.Skybox;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace IvsIdleGamePlayerAction;


/*
 {
   "Command":"join"
 }
*/

public class IdleEventsSetup
{
    public IdleEventsSetup()
    {
        IdleEvents = new Dictionary<string, IdleEvent>
        {
            {
                "join",
                new IdleEvent()
                {
                    Name = "join",
                    Timestamp = 0,
                    Cost = 0,
                    Duration = -1,
                    PerTick = 1,
                    IsPersonalEvent = true
                }
            },
            {
                "fireworks",
                new IdleEvent()
                {
                    Name = "fireworks",
                    Timestamp = 0,
                    Cost = 200,
                    Duration = 20,
                    PerTick = 0,
                    IsPersonalEvent = true
                }
            },
            {
                "cheer",
                new IdleEvent()
                {
                    Name = "cheer",
                    Timestamp = 0,
                    Cost = 0,
                    Duration = 1,
                    PerTick = 0,
                    IsPersonalEvent = true
                }
            },
            {
                "confetti",
                new IdleEvent()
                {
                    Name = "confetti",
                    Timestamp = 0,
                    Cost = 50,
                    Duration = 55,
                    PerTick = 1,
                    IsPersonalEvent = true
                }
            },
            {
                "joinyes",
                new IdleEvent()
                {
                    Name = "joinyes",
                    Timestamp = 0,
                    Cost = 0,
                    Duration = 1,
                    PerTick = 200,
                    IsPersonalEvent = true
                }
            },
            {
                "joinno",
                new IdleEvent()
                {
                    Name = "joinno",
                    Timestamp = 0,
                    Cost = 0,
                    Duration = 1,
                    PerTick = 200,
                    IsPersonalEvent = true
                }
            },
            {
                "startthewave",
                new IdleEvent()
                {
                    Name = "startthewave",
                    Timestamp = 0,
                    Cost = 0,
                    Duration = 1,
                    PerTick = 100,
                    IsPersonalEvent = true
                }
            }

        };
    }

    public readonly Dictionary<string, IdleEvent> IdleEvents;
}

public class IdleGamePlayerActionRequest
{
    public string StreamId { get; set; } = "";
    public string EventId { get; set; } = "";
    public string VendorEventId { get; set; } = "";
    public string UserId { get; set; } = "";
    public string UserName { get; set; } = "";
    public string Command { get; set; } = "";
    public string? ChatActionGuid { get; set; } = null;
    public string? PfpUrl { get; set; } = "";
    public string? WalletAddress { get; set; } = "";
    public string? TicketTier { get; set; } = "";
    public string[]? AdditionalWalletAddresses { get; set; } = null;
}

public class Function
{
    private readonly IdleEventsSetup _idleEventsSetup;
    private static IServiceProvider? services;
    private readonly IIdleGameActionsRepository _idleGameActionsRepository;
    private readonly IIdleGameRepository _idleGameRepository;
    private readonly IEventRepository _eventRepository;
    private readonly IUserRepository _userRepository;
    private readonly IIdleEventProcessor _idleEventProcessor;
    private readonly IGameEventProcessor _gameEventProcessor;
    private readonly IWebSocketService _webSocketService;
    private readonly IFanVisibilityService _fanVisibilityServiceService;
    private readonly IMarketCache _marketCache;
    private readonly IBlockChainService _blockChainService;
    private readonly IBoostCacheRepository _boostCacheRepository;
    private readonly IPredictionService _predictionService;
    private readonly IPredictionCache _predictionCache;
    private readonly ISkyboxService _skyboxService;
    private readonly ISkyboxRepository _skyboxRepository;
    private readonly ISkyboxCache _skyboxCache;
    private readonly string? _platformApiKeyEnvironmentVar;
    private readonly string? _gameApiKeyEnvironmentVar;
    private readonly string? _fetchFanDetailsUrlEnvironmentVar;
    private readonly string? _platformXApiKeyEnvironmentVar;

    public Function()
    {
        _fetchFanDetailsUrlEnvironmentVar =
            Environment.GetEnvironmentVariable("PLATFORM_FETCH_FAN_DETAILS_URL");

        if (String.IsNullOrEmpty(_fetchFanDetailsUrlEnvironmentVar))
        {
            Console.WriteLine("PLATFORM_FETCH_FAN_DETAILS_URL Environment Variable is not set!");
        }

        _platformXApiKeyEnvironmentVar = Environment.GetEnvironmentVariable("PLATFORM_X_API_KEY");

        if (String.IsNullOrEmpty(_platformXApiKeyEnvironmentVar))
        {
            Console.WriteLine("PLATFORM_X_API_KEY Environment Variable is not set!");
        }

        _platformApiKeyEnvironmentVar =
            Environment.GetEnvironmentVariable("PLATFORM_API_KEY");

        if (String.IsNullOrEmpty(_platformApiKeyEnvironmentVar))
        {
            Console.WriteLine("PLATFORM_API_KEY Environment Variable is not set!");
        }

        _gameApiKeyEnvironmentVar =
            Environment.GetEnvironmentVariable("GAME_API_KEY");

        if (String.IsNullOrEmpty(_gameApiKeyEnvironmentVar))
        {
            Console.WriteLine("GAME_API_KEY Environment Variable is not set!");
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

        _idleEventsSetup = new IdleEventsSetup();
        var serviceCollection = new ServiceCollection();
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
            BoostsSegmentsCollectionName = "boosts-segments",
            SkyboxesCollectionName = "skyboxes"
        });
        serviceCollection.AddSingleton<IRedisSettings>(x => new RedisSettings()
        {
            EndPoint = fanVisibilityServiceEndpointEnvironmentVar,
            Port = fanVisibilityServicePort,
            Password = fanVisibilityServicePasswordEnvironmentVar,
            User = fanVisibilityServiceUserEnvironmentVar,
        });
        serviceCollection.AddSingleton<IRedisDbProvider, RedisDbProvider>();
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
        serviceCollection.AddScoped<IIdleGameActionsRepository, MongoIdleGameActionsRepository>();
        serviceCollection.AddScoped<IUserRepository, MongoUserRepository>();
        serviceCollection.AddScoped<IEventRepository, MongoEventRepository>();
        serviceCollection.AddScoped<IIdleGameRepository, RedisIdleGameRepository>();
        serviceCollection.AddSingleton<IIdleEventProcessor, IdleEventProcessor>();
        serviceCollection.AddSingleton<ILeaveEventProcessor, LeaveEventProcessor>();
        serviceCollection.AddScoped<IGameEventProcessor, GameEventProcessor>();
        serviceCollection.AddScoped<IWebSocketService, PubNubWebSocketService>();
        serviceCollection.AddSingleton<IFanVisibilityService, RedisFanVisibilityService>();
        serviceCollection.AddSingleton<IMarketCache, RedisMarketCache>();
        serviceCollection.AddSingleton<IBlockChainService, NextJsBlockchainService>();
        serviceCollection.AddSingleton<IBoostCacheRepository, RedisBoostCacheRepository>();
        serviceCollection.AddSingleton<ICreditBalanceRepository, MongoCreditBalanceRepository>();
        serviceCollection.AddSingleton<IBoostRepository, MongoBoostRepository>();
        serviceCollection.AddSingleton<IStreamRepository, MongoStreamRepository>();
        serviceCollection.AddSingleton<ILeaderboardRepository, RedisLeaderboardRepository>();
        serviceCollection.AddSingleton<ILeaderboardService, LeaderboardService>();
        serviceCollection.AddSingleton<IPredictionService, PredictionService>();
        serviceCollection.AddSingleton<IPredictionCache, RedisPredictionCache>();
        serviceCollection.AddSingleton<ISkyboxRepository, MongoSkyboxRepository>();
        serviceCollection.AddSingleton<ISkyboxService, SkyboxService>();
        serviceCollection.AddSingleton<ISkyboxCache, RedisSkyboxCache>();
        services = serviceCollection.BuildServiceProvider();

        _idleGameActionsRepository = services.GetRequiredService<IIdleGameActionsRepository>();
        _userRepository = services.GetRequiredService<IUserRepository>();
        _eventRepository = services.GetRequiredService<IEventRepository>();
        _idleGameRepository = services.GetRequiredService<IIdleGameRepository>();
        _idleEventProcessor = services.GetRequiredService<IIdleEventProcessor>();
        _gameEventProcessor = services.GetRequiredService<IGameEventProcessor>();
        _webSocketService = services.GetRequiredService<IWebSocketService>();
        _fanVisibilityServiceService = services.GetRequiredService<IFanVisibilityService>();
        _marketCache = services.GetRequiredService<IMarketCache>();
        _blockChainService = services.GetRequiredService<IBlockChainService>();
        _boostCacheRepository = services.GetRequiredService<IBoostCacheRepository>();
        _predictionCache = services.GetRequiredService<IPredictionCache>();
        _predictionService = services.GetRequiredService<IPredictionService>();
        _skyboxService = services.GetRequiredService<ISkyboxService>();
        _skyboxRepository = services.GetRequiredService<ISkyboxRepository>();
        _skyboxCache = services.GetRequiredService<ISkyboxCache>();
    }
    
    public async Task PresenceLeaveEventHandler(SQSEvent events,
        ILambdaContext context)
    {
        //This method is only triggered by SQS, which has its own security between AWS and PubNub

        //Console.WriteLine("PresenceLeaveEventHandler", events);

        DateTimeOffset dto = new DateTimeOffset(DateTime.UtcNow);
        long currentTimestamp = dto.ToUnixTimeMilliseconds();

        //This array is to stop duplicate leave events from processing twice for the same user
        List<string> userIdsThatHaveAlreadyBeenProcessed = new List<string>();
        foreach (var message in events.Records)
        {
            PubNubEvent? pubNubEvent = JsonSerializer.Deserialize<PubNubEvent>(message.Body);
            if (pubNubEvent == null)
            {
                Console.WriteLine("PresenceLeaveEventHandler Error Deserializing pubNubEvent");
            }
            else
            {
                Console.WriteLine($"PresenceLeaveEventHandler PubNubEvents: {message.Body}");
                if (pubNubEvent?.Event?.Payload?.Data == null)
                {
                    continue;
                }

                foreach (var eventItem in pubNubEvent?.Event?.Payload?.Data)
                {
                    string json = JsonSerializer.Serialize(eventItem);
                    Console.WriteLine($"pubNubEvent {json}");

                    //Leave event
                    if (eventItem.Data2?.Action == "leave")
                    {
                        Console.WriteLine("This is a leave event");
                        string userId = eventItem.Data2.Uuid;

                        //If we have already processed a leave event successfully for this userId, then don't do it again
                        //This fixes a duplicate credits issue
                        if (userIdsThatHaveAlreadyBeenProcessed.Contains(userId))
                        {
                            continue;
                        }

                        string channelName = eventItem.Channel;

                        //Parse out eventId
                        string channelNameWithoutPrefix = channelName.Replace("g.", "");
                        int positionOfFirstPeriod = channelNameWithoutPrefix.IndexOf('.');
                        if (positionOfFirstPeriod < 1)
                        {
                            Console.WriteLine($"PresenceLeaveEvent - Couldn't parse channelName: {channelName}");
                            continue;
                        }
                        string eventId = channelNameWithoutPrefix.Substring(0, positionOfFirstPeriod);

                        Console.WriteLine($"PresenceLeaveEvent - eventId: {eventId}");

                        //Get active events for this player
                        var idleGameEvents = await _idleGameRepository.GetEventsForPlayer(eventId, userId);

                        long firstJoinTimeStamp = 0;
                        string vendorEventId = "";
                        //Find join event
                        foreach (var idleGameEvent in idleGameEvents)
                        {
                            if (idleGameEvent.Name == "join")
                            {
                                firstJoinTimeStamp = idleGameEvent.Timestamp;
                                vendorEventId = idleGameEvent.VendorEventId ?? "";
                                break;
                            }
                        }

                        int credits = 0;
                        if (firstJoinTimeStamp > 0)
                        {
                            credits = (int)Math.Round(((double)currentTimestamp - (double)firstJoinTimeStamp) / (double)1000);
                        }

                        Console.WriteLine($"PresenceLeaveEvent - credits before rolled up: {credits}");

                        int previousRolledUpPersonalCredits = 0;

                        //Get rolled up personal credits
                        previousRolledUpPersonalCredits = await _idleGameRepository.GetRolledUpPersonalCredits(eventId, userId);

                        credits += previousRolledUpPersonalCredits;

                        Console.WriteLine($"PresenceLeaveEvent - credits after rolled up: {credits}");

                        //Update credits on user in MongoDB
                        var successUpdatingUserPoints = await _userRepository.AddToUserPoints(userId, credits);

                        if (successUpdatingUserPoints)
                        {
                            userIdsThatHaveAlreadyBeenProcessed.Add(userId);

                            //Remove personal credits
                            await _idleGameRepository.RemoveAllEventsForPlayer(eventId, userId);
                        }

                        //Remove fan in the stand
                        await _fanVisibilityServiceService.RemoveFanInTheStand(vendorEventId, userId);

                        //Send Channel Exit Message to Game
                        if (!String.IsNullOrEmpty(vendorEventId))
                        {
                            ChannelExitMessage channelExitMessage = new ChannelExitMessage()
                            {
                                FanID = userId,
                                Timestamp = currentTimestamp,
                            };
                            await _fanVisibilityServiceService.SendFanVisibilityEvent(vendorEventId, "ChannelExit",
                                channelExitMessage);
                        }
                    }
                }
            }
        }
    }

    /// <summary>
    /// Handle Idle Game Player Action requests
    /// </summary>
    /// <param name="proxyRequest">The Request for the Lambda function handler to process.</param>
    /// <param name="context">Incoming context</param>. 
    /// <returns></returns>
    public async Task<IdleGamePlayerActionResponse> FunctionHandler(APIGatewayHttpApiV2ProxyRequest proxyRequest, ILambdaContext context)
    {
        //Security to make sure the _platformApiKeyEnvironmentVar is set (not empty) and that the incoming x-api-key matches the _platformApiKeyEnvironmentVar
        if (String.IsNullOrEmpty(_platformApiKeyEnvironmentVar) || !proxyRequest.Headers.ContainsKey("x-api-key") || _platformApiKeyEnvironmentVar != proxyRequest.Headers["x-api-key"])
        {
            return new IdleGamePlayerActionResponse()
            {
                Success = false,
                Err = "Invalid API Key",
                Timestamp = 0,
                RolledUpPersonalCredits = 0
            };
        }

        //If we get this far, this is a secure request

        DateTimeOffset dto = new DateTimeOffset(DateTime.UtcNow);
        long currentTimestamp = dto.ToUnixTimeMilliseconds();

        Console.WriteLine(JsonSerializer.Serialize(proxyRequest));

        if (proxyRequest.Body == null)
        {
            return new IdleGamePlayerActionResponse()
            {
                Success = false,
                Err = "Invalid Request Body",
                Timestamp = currentTimestamp,
                RolledUpPersonalCredits = 0
            };
        }

        IdleGamePlayerActionRequest? request = JsonSerializer.Deserialize<IdleGamePlayerActionRequest>(proxyRequest.Body);

        if (request == null)
        {
            return new IdleGamePlayerActionResponse()
            {
                Success = false,
                Err = "Invalid Request",
                Timestamp = currentTimestamp,
                RolledUpPersonalCredits = 0
            };
        }

        string command = request?.Command ?? "";
        string streamId = request?.StreamId ?? "";
        string userId = request?.UserId ?? "";
        string userName = request?.UserName ?? "";
        string eventId = request?.EventId ?? ""; //This is actually the stageId
        string vendorEventId = request?.VendorEventId ?? "";
        string chatActionGuid = request?.ChatActionGuid ?? "";
        string pfpUrl = request?.PfpUrl ?? "";
        string walletAddress = request?.WalletAddress ?? "";
        string ticketTier = request?.TicketTier ?? "";
        string[]? additionalWalletAddresses = request?.AdditionalWalletAddresses;

        Console.WriteLine($"eventId: {eventId}  vendorEventId: {vendorEventId}");

        //Modified version for boost/rallies chat app
        decimal redBlueRatio = 0.5M;
        decimal redSharedBoostComboMultiplier = 1;
        decimal blueSharedBoostComboMultiplier = 1;
        int redBoostProgress = 0;
        long redPersonalProgressStartTime = 0;
        int blueBoostProgress = 0;
        long bluePersonalProgressStartTime = 0;

        IdleEvent idleEvent = _idleEventsSetup.IdleEvents[command];
        //Create a chatActionGuid
        idleEvent.ChatActionGuid = Guid.NewGuid();
        //Set the timestamp to Now
        idleEvent.Timestamp = currentTimestamp;
        int currentTotalRedBoosts = 0;
        int currentTotalBlueBoosts = 0;
        long eventMatchStartTime = 0;
        bool isEventMatchActive = false;
        int roundNumber = 1;
        decimal predictionRedPrice = 0.00M;
        decimal predictionBluePrice = 0.00M;
        int predictionPersonalCreditsSpentRed = 0;
        int predictionPersonalCreditsSpentBlue = 0;
        decimal predictionAvgPriceRed = 0.00M;
        decimal predictionAvgPriceBlue = 0.00M;
        decimal predictionAveragePointsRed = 0.00M;
        decimal predictionAveragePointsBlue = 0.00M;
        int predictionTotalUniqueUserCount = 0;

        List<Leader>? leadersForLeaderboard = null;
        List<Skybox> skyboxes = new List<Skybox>();

        string? pubNubToken = null;

        //Join event
        if (idleEvent.Name == "join")
        {
            idleEvent.PerTick = 0;

            bool hasWalletAddress = !String.IsNullOrEmpty(walletAddress);
            bool hasPfpUrl = !String.IsNullOrEmpty(pfpUrl);
            Random random = new Random((int)currentTimestamp);
            int seatSectionNumber = random.Next(0, 4);
            int seatScore = 1;

            if (hasWalletAddress)
            {
                seatScore++;
            }
            if (hasPfpUrl)
            {
                seatScore++;
            }

            Console.WriteLine($"ticketTier: {ticketTier}");

            //Added for handling max general admission users
            if (ticketTier == "general-admission")
            {
                //We use seat score of zero to determine they are a general admission user
                seatScore = 0;
            }

            //Check to see if we are already in fanInTheStands
            FanInTheStands? fan = await _fanVisibilityServiceService.GetFanInTheStands(vendorEventId, userId);
            //If we aren't in the stands, add us
            if (fan == null)
            {
                // Fetch fan details to get wildpasses and swagpins
                GetWildpassesAndSwagPinsResponse getWildPassesAndSwagPins =
                    await _blockChainService.GetWildpassesAndSwagPins(userId);

                //Add the user to fans in the stands
                FanInTheStands fanInTheStands = new FanInTheStands()
                {
                    FanId = userId,
                    FanName = userName,
                    FanPfpUrl = pfpUrl,
                    WildfileAgeDays = 1,
                    Timestamp = currentTimestamp,
                    SeatSectionNumber = seatSectionNumber,
                    SeatScore = seatScore,
                    HasWalletAddress = hasWalletAddress,
                    WalletAddress = walletAddress,
                    HasWildfilePfp = hasPfpUrl,
                    AdditionalWalletAddresses = additionalWalletAddresses,
                    Wildpasses = getWildPassesAndSwagPins.Wildpasses,
                    SwagPins = getWildPassesAndSwagPins.SwagPins
                };
                await _fanVisibilityServiceService.AddFanInTheStand(vendorEventId, fanInTheStands);

                Console.WriteLine($"Added fan to fansInTheStands: {JsonSerializer.Serialize(fanInTheStands)}");

                //Send the Channel Entrance Message
                ChannelEntranceMessage channelEntranceMessage = new ChannelEntranceMessage()
                {
                    FanID = userId,
                    FanName = userName,
                    FanPfpUrl = pfpUrl,
                    SeatSectionNumber = seatSectionNumber,
                    SeatScore = seatScore,
                    Timestamp = currentTimestamp,
                    HasWalletAddress = hasWalletAddress
                };

                Console.WriteLine(channelEntranceMessage);

                await _fanVisibilityServiceService.SendFanVisibilityEvent(vendorEventId, "ChannelEntrance",
                    channelEntranceMessage);
            }

            var eventMatch = await _idleGameRepository.GetEventMatchFromStageId(eventId);
            if (eventMatch != null)
            {
                Console.WriteLine("Found Event Match");

                isEventMatchActive = true;
                int segment = eventMatch.Segment;
                //Segment is zero based, so roundNumber is segment + 1
                roundNumber = segment + 1;
                string segmentStr = segment.ToString();
                eventMatchStartTime = eventMatch.Timestamp;

                Console.WriteLine($"Looking up personal predictions: {eventId}-{segmentStr}-{userId}");

                List<Prediction> predictions = await _predictionCache.GetPersonalPredictions(eventId, segmentStr, userId);
                int startingSpendPerTeam = 5000;
                int totalPersonalRedShares = 0;
                int totalPersonalBlueShares = 0;


                Console.WriteLine($"Number of predictions: {predictions.Count}");

                if (predictions.Count > 0)
                {
                    var userTotals = _predictionService.GetUserTotalsFromPredictions(predictions);

                    Console.WriteLine(JsonSerializer.Serialize(userTotals));

                    if (userTotals.TryGetValue(userId, out var userTotal))
                    {
                        predictionPersonalCreditsSpentRed = userTotal.CreditsSpentOnRed;
                        predictionPersonalCreditsSpentBlue = userTotal.CreditsSpentOnBlue;
                        predictionAvgPriceRed = userTotal.AveragePurchasePriceRed;
                        predictionAvgPriceBlue = userTotal.AveragePurchasePriceBlue;
                    }
                }

                var totalSpentOnRedTeamTask = _predictionCache.GetTotalSpent(eventId, "red", segmentStr);
                var totalSpentOnBlueTeamTask = _predictionCache.GetTotalSpent(eventId, "blue", segmentStr);
                Task.WaitAll(totalSpentOnRedTeamTask, totalSpentOnBlueTeamTask);

                int totalSpentOnRedTeam = totalSpentOnRedTeamTask.Result + startingSpendPerTeam;
                int totalSpentOnBlueTeam = totalSpentOnBlueTeamTask.Result + startingSpendPerTeam;
                int totalSpent = totalSpentOnRedTeam + totalSpentOnBlueTeam;
                predictionRedPrice = Math.Round((decimal)totalSpentOnRedTeam / totalSpent, 2);
                predictionBluePrice = Math.Round(1 - predictionRedPrice, 2);

                redBlueRatio = (decimal)totalSpentOnRedTeam / (decimal)totalSpent;

                SharedAveragePoints sharedAveragePoints = await _predictionService.GetSharedAveragePoints(streamId, segmentStr);
                predictionAveragePointsRed = sharedAveragePoints.RedTeamAveragePoints;
                predictionAveragePointsBlue = sharedAveragePoints.BlueTeamAveragePoints;
                predictionTotalUniqueUserCount = sharedAveragePoints.TotalUniqueUserCount;
            }

            var leaders = await _predictionService.GetLeaders(eventId);
            if (leaders.Count > 0)
            {
                leadersForLeaderboard = leaders;
            }

            skyboxes = await _skyboxRepository.GetAllSkyboxesByStageId(eventId);

            //Check if the user is in a sky box
            var skybox = await _skyboxService.GetSkyboxUserIsIn(eventId, userId);

            //The user is in a sky box
            if (skybox != null)
            {
                pubNubToken = await _skyboxService.GrantChannelPermissionsForUser(eventId, userId, skybox);
                Console.WriteLine($"PubNubToken: {pubNubToken}");
            }
        }

        return new IdleGamePlayerActionResponse()
        {
            Success = true,
            Err = "",
            Timestamp = currentTimestamp,
            RolledUpPersonalCredits = 0,
            IdleEvent = idleEvent,
            IdleEvents = null,
            Button1Supply = 0,
            Button2Supply = 0,
            Button3Supply = 0,
            StreamScore = 0,
            RedBlueRatio = redBlueRatio,
            RedSharedBoostComboMultiplier = redSharedBoostComboMultiplier,
            BlueSharedBoostComboMultiplier = blueSharedBoostComboMultiplier,
            RedBoostProgress = redBoostProgress,
            RedPersonalProgressStartTime = redPersonalProgressStartTime,
            BlueBoostProgress = blueBoostProgress,
            BluePersonalProgressStartTime = bluePersonalProgressStartTime,
            RoundNumber = roundNumber,
            EventMatchStartTime = eventMatchStartTime,
            IsEventMatchActive = isEventMatchActive,
            TotalRedBoost = currentTotalRedBoosts,
            TotalBlueBoost = currentTotalBlueBoosts,

            PredictionRedPrice = predictionRedPrice,
            PredictionBluePrice = predictionBluePrice,
            PredictionPersonalCreditsSpentRed = predictionPersonalCreditsSpentRed,
            PredictionPersonalCreditsSpentBlue = predictionPersonalCreditsSpentBlue,
            PredictionAveragePriceRed = predictionAvgPriceRed,
            PredictionAveragePriceBlue = predictionAvgPriceBlue,
            PredictionAveragePointsRed = predictionAveragePointsRed,
            PredictionAveragePointsBlue = predictionAveragePointsBlue,
            PredictionTotalUniqueUserCount = predictionTotalUniqueUserCount,

            Leaders = leadersForLeaderboard,
            Skyboxes = skyboxes,

            PubNubToken = pubNubToken
        };



        decimal personalCredits = 0;
        decimal previousRolledUpPersonalCredits = 0;

        //Get rolled up personal credits
        previousRolledUpPersonalCredits = await _idleGameRepository.GetRolledUpPersonalCredits(eventId, userId);

        Console.WriteLine($"previousRolledUpPersonalCredits: {previousRolledUpPersonalCredits}");

        personalCredits = previousRolledUpPersonalCredits;

        //Get the event template for the event type
        //IdleEvent idleEvent = _idleEventsSetup.IdleEvents[command];
        //Create a chatActionGuid
        idleEvent.ChatActionGuid = Guid.NewGuid();
        //Set the timestamp to Now
        idleEvent.Timestamp = currentTimestamp;

        //Get active events for this player
        var idleEvents = await _idleGameRepository.GetEventsForPlayer(eventId, userId);

        //Calculate personal credits and rollup expired idle game actions
        decimal rolledUpPersonalCredits = 0;
        List<IdleEvent> eventsBeingRemoved = new List<IdleEvent>();
        personalCredits = _idleEventProcessor.CalculatePersonalCreditsFromEvents(currentTimestamp, idleEvents, ref rolledUpPersonalCredits, ref eventsBeingRemoved);

        //Remove expired idle game events from cache
        if (eventsBeingRemoved.Count > 0)
        {
            string eventsBeingRemovedJson = JsonSerializer.Serialize(eventsBeingRemoved);
            Console.WriteLine($"Removing event: {eventsBeingRemovedJson}");
            bool success = await _idleGameRepository.RemoveEventsForPlayer(eventId, userId, eventsBeingRemoved);
            if (success)
            {
                bool success2 = await _idleGameRepository.IncrementRolledUpPersonalCredits(eventId, userId, rolledUpPersonalCredits);
            }
            else
            {
                Console.WriteLine("Error removing events for player!");
            }
        }

        //Wait until after IncrementRolledUpPersonalCredits to add back the previousRolledUpPersonalCredits 
        rolledUpPersonalCredits += previousRolledUpPersonalCredits;

        //Verify if the cost is met if it has a cost
        Console.WriteLine($"idleEvent.Cost: {idleEvent.Cost}");
        if (idleEvent.Cost > 0)
        {
            if (personalCredits < idleEvent.Cost)
            {
                Console.WriteLine($"currentTimestamp: {currentTimestamp}");
                Console.WriteLine($"personalCredits: {personalCredits}");
                return new IdleGamePlayerActionResponse()
                {
                    Success = false,
                    Err = $"Action cost not met.  Your credits are: {personalCredits}",
                    Timestamp = currentTimestamp,
                    RolledUpPersonalCredits = rolledUpPersonalCredits
                };
            }
        }

        //If the event is a "join", then set the vendorEventId, and get the button supplies
        int button1Supply = 0;
        int button2Supply = 0;
        int button3Supply = 0;
        long streamScore = -1;
        decimal basePointsPerSeconds = 1;
        decimal amountToNextStreamScoreLevel = 100;
        decimal streamScoreBoostMultiplier = 0.1M;
        if (idleEvent.Name == "join")
        {
            idleEvent.VendorEventId = vendorEventId;

            button1Supply = await _marketCache.GetSupply("BUTTON_1.1X");
            button2Supply = await _marketCache.GetSupply("BUTTON_1.5X");
            button3Supply = await _marketCache.GetSupply("BUTTON_2X");

            streamScore = await _idleGameRepository.GetStreamScore(eventId);

            decimal streamScoreLevel = Math.Floor(streamScore / amountToNextStreamScoreLevel) + 1;
            streamScoreBoostMultiplier = streamScoreLevel * 0.1M;
        }

        //Check to see if this is a duplicate join (iterate in reverse)
        for (int eventIndex = idleEvents.Count - 1; eventIndex >= 0; eventIndex--)
        {
            var previousJoinIdleEvent = idleEvents[eventIndex];
            if (idleEvent.Name == "join")
            {
                Console.WriteLine("Already joined!");

                previousJoinIdleEvent.PerTick = basePointsPerSeconds + streamScoreBoostMultiplier;

                //Already joined
                return new IdleGamePlayerActionResponse()
                {
                    Success = true,
                    Err = "",
                    Timestamp = currentTimestamp,
                    RolledUpPersonalCredits = rolledUpPersonalCredits,
                    IdleEvent = previousJoinIdleEvent,
                    IdleEvents = idleEvents.ToArray(),
                    Button1Supply = button1Supply,
                    Button2Supply = button2Supply,
                    Button3Supply = button3Supply,
                    StreamScore = streamScore
                };
            }
        }

        //Send event to projection
        bool successfullyAddedIdleEvent = await _idleGameRepository.AddEventForPlayer(eventId, userId, idleEvent);

        //Adjust the score if there is a cost
        if (idleEvent.Cost > 0)
        {
            personalCredits -= idleEvent.Cost;
        }

        //Add the event to the repository
        StoredIdleEvent storedIdleEvent = new StoredIdleEvent()
        {
            UserId = userId,
            EventId = eventId,
            IdleEvent = idleEvent
        };
        await _idleGameActionsRepository.AddIdleGameAction(storedIdleEvent);

        if (command == "joinyes" || command == "joinno")
        {
            Console.WriteLine($"chatActionGuid: {chatActionGuid}");

            //Lookup up the action based on the chatActionGuid
            IdleEvent? joinIdleEvent = await _idleGameRepository.GetSharedEvent(eventId, chatActionGuid);

            if (joinIdleEvent == null)
            {
                return new IdleGamePlayerActionResponse()
                {
                    Success = false,
                    Err = $"No event found to join!",
                    Timestamp = currentTimestamp,
                    RolledUpPersonalCredits = rolledUpPersonalCredits
                };
            }

            //Join to list of Yes or No
            string option = command.Replace("join", "");
            await _idleGameRepository.AddPlayerToSharedEvent(eventId, userId, chatActionGuid, option);
        }

        //Join event
        if (idleEvent.Name == "join")
        {
            idleEvent.PerTick = basePointsPerSeconds + streamScoreBoostMultiplier;

            bool hasWalletAddress = !String.IsNullOrEmpty(walletAddress);
            bool hasPfpUrl = !String.IsNullOrEmpty(pfpUrl);
            Random random = new Random((int)currentTimestamp);
            int seatSectionNumber = random.Next(0, 4);
            int seatScore = 1;
            
            if (hasWalletAddress)
            {
                seatScore++;
            }
            if (hasPfpUrl)
            {
                seatScore++;
            }

            Console.WriteLine($"ticketTier: {ticketTier}");

            //Added for handling max general admission users
            if (ticketTier == "general-admission")
            {
                //We use seat score of zero to determine they are a general admission user
                seatScore = 0;
            }

            // Fetch fan details to get wildpasses and swagpins
            List<Wildpass> wildpasses = new List<Wildpass>();
            List<SwagPin> swagpins = new List<SwagPin>();

            GetWildpassesAndSwagPinsResponse getWildpassesAndSwagPins = await _blockChainService.GetWildpassesAndSwagPins(userId);
            wildpasses = getWildpassesAndSwagPins.Wildpasses;
            swagpins = getWildpassesAndSwagPins.SwagPins;

            //Add the user to fans in the stands
            FanInTheStands fanInTheStands = new FanInTheStands()
            {
                FanId = userId,
                FanName = userName,
                FanPfpUrl = pfpUrl,
                WildfileAgeDays = 1,
                Timestamp = currentTimestamp,
                SeatSectionNumber = seatSectionNumber,
                SeatScore = seatScore,
                HasWalletAddress = hasWalletAddress,
                WalletAddress = walletAddress,
                HasWildfilePfp = hasPfpUrl,
                AdditionalWalletAddresses = additionalWalletAddresses,
                Wildpasses = wildpasses,
                SwagPins = swagpins
            };
            await _fanVisibilityServiceService.AddFanInTheStand(vendorEventId, fanInTheStands);

            //Send the Channel Entrance Message
            ChannelEntranceMessage channelEntranceMessage = new ChannelEntranceMessage()
            {
                FanID = userId,
                FanName = userName,
                FanPfpUrl = pfpUrl,
                SeatSectionNumber = seatSectionNumber,
                SeatScore = seatScore,
                Timestamp = currentTimestamp,
                HasWalletAddress = hasWalletAddress
            };

            Console.WriteLine(channelEntranceMessage);

            await _fanVisibilityServiceService.SendFanVisibilityEvent(vendorEventId, "ChannelEntrance", channelEntranceMessage);

            //Get a list of active shared events
        }
        //Send the Fanfare event
        else if (idleEvent.Name == "cheer")
        {
            string fanfareEventType = "FanfareEffect";
            FanfareEffect fanfareEffect = new FanfareEffect()
            {
                Type = "AudienceBillboard",
                Name = "ff.bb.MalusFoamFinger",
                Value = "RandomActivation",
                SectionId = 0,
                SectionName = "SpectatorSplines/Section1B",
                Magnitude = 15,
                Delay = 0,
                Duration = 25,
                Notify = false
            };
            await _fanVisibilityServiceService.SendFanVisibilityEvent(vendorEventId, fanfareEventType, fanfareEffect);
        }

        Console.WriteLine(JsonSerializer.Serialize(idleEvent));
        Console.WriteLine($"currentTimestamp: {currentTimestamp}");
        Console.WriteLine($"personalCredits: {personalCredits}");
        Console.WriteLine($"rolledUpPersonalCredits: {rolledUpPersonalCredits}");

        //If idleEvents is empty, return null
        IdleEvent[]? idleEventsToReturn = null;
        if (idleEvents.Count > 0)
        {
            idleEventsToReturn = idleEvents.ToArray();
        }

        return new IdleGamePlayerActionResponse()
        {
            Success = true,
            Err = "",
            Timestamp = currentTimestamp,
            RolledUpPersonalCredits = rolledUpPersonalCredits,
            IdleEvent = idleEvent,
            IdleEvents = idleEventsToReturn,
            Button1Supply = button1Supply,
            Button2Supply = button2Supply,
            Button3Supply = button3Supply,
            StreamScore = streamScore
        };
    }

    private decimal CalculateComboMultiplierFromTeamRallyPoints(int teamRallyPoints)
    {
        return Math.Round(1 + (0.001M * (decimal)Math.Sqrt(teamRallyPoints)), 2);
    }
}


