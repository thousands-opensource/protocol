using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Configuration.Implementations;
using IvsIdleGameShared.Configuration.Interfaces;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Models.Boost;
using IvsIdleGameShared.Models.Prediction;
using IvsIdleGameShared.Models.Vote;
using IvsIdleGameShared.Repositories.Implementations;
using IvsIdleGameShared.Repositories.Interfaces;
using IvsIdleGameShared.Services.Implementations;
using IvsIdleGameShared.Services.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using MongoDB.Bson;
using System.Text.Json;

namespace IvsPeriodicPredictionUpdates
{
    internal class Program
    {
        private static IFanVisibilityService? _fanVisibilityServiceService;
        private static IBoostCacheRepository? _boostCacheRepository;
        private static IIdleGameRepository? _idleGameRepository;
        private static IVoteRepository? _voteRepository;
        private static IVoteHistoryRepository? _voteHistoryRepository;
        private static IWebSocketService? _webSocketService;
        private static IPredictionCache? _predictionCache;
        private static IPredictionService? _predictionService;
        private static IServiceProvider? services;
        private static string stageId = "67eef4e1c29b87857c152aaa";
        private static int startingSpendPerTeam = 5000;
        private static int totalCreditsSpentPerLevel = 100000;

        public Program()
        {
            var config = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                .Build();

            stageId = config["stageId"] ?? "";

            string fanVisibilityServiceEndpointEnvironmentVar = config["fanVisibilityServiceEndpoint"] ?? "";

            int fanVisibilityServicePort = int.Parse(config["fanVisibilityServicePort"] ?? "0");

            string fanVisibilityServicePasswordEnvironmentVar = config["fanVisibilityServicePassword"] ?? "";

            string fanVisibilityServiceUserEnvironmentVar = config["fanVisibilityServiceUser"] ?? "";

            string streamRepositoryConnectionUriEnvironmentVar = config["streamRepositoryConnectionUri"] ?? "";

            string streamRepositoryDatabaseNameEnvironmentVar = config["streamRepositoryDatabaseName"] ?? "";

            string chatWebSocketPublisherKeyEnvironmentVar = config["chatWebSocketPublisherKey"] ?? "";

            string chatWebSocketSubscriberKeyEnvironmentVar = config["chatWebSocketSubscriberKey"] ?? "";

            string chatWebSocketSecretKeyEnvironmentVar = config["chatWebSocketSecretKey"] ?? "";

            Console.WriteLine($"stageId: {stageId}");
            Console.WriteLine($"fanVisibilityServiceEndpoint: {fanVisibilityServiceEndpointEnvironmentVar}");
            Console.WriteLine($"fanVisibilityServicePort: {fanVisibilityServicePort}");
            Console.WriteLine($"fanVisibilityServicePassword: {fanVisibilityServicePasswordEnvironmentVar}");
            Console.WriteLine($"fanVisibilityServiceUser: {fanVisibilityServiceUserEnvironmentVar}");
            Console.WriteLine($"streamRepositoryConnectionUri: {streamRepositoryConnectionUriEnvironmentVar}");
            Console.WriteLine($"streamRepositoryDatabaseName: {streamRepositoryDatabaseNameEnvironmentVar}");
            Console.WriteLine($"chatWebSocketPublisherKey: {chatWebSocketPublisherKeyEnvironmentVar}");
            Console.WriteLine($"chatWebSocketSubscriberKey: {chatWebSocketSubscriberKeyEnvironmentVar}");
            Console.WriteLine($"chatWebSocketSecretKey: {chatWebSocketSecretKeyEnvironmentVar}");

            //Configure dependency inject for services and repositories
            var serviceCollection = new ServiceCollection();
            serviceCollection.AddSingleton<IRedisSettings>(x => new RedisSettings()
            {
                EndPoint = fanVisibilityServiceEndpointEnvironmentVar,
                Port = fanVisibilityServicePort,
                Password = fanVisibilityServicePasswordEnvironmentVar,
                User = fanVisibilityServiceUserEnvironmentVar,
            });
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
                VoteHistoryCollectionName = "vote-history",
                SkyboxesCollectionName = "skyboxes"
            });
            serviceCollection.AddSingleton<IChatWebSocketSettings>(x => new PubNubChatWebSocketSettings()
            {
                PublisherKey = chatWebSocketPublisherKeyEnvironmentVar,
                SubscriberKey = chatWebSocketSubscriberKeyEnvironmentVar,
                SecretKey = chatWebSocketSecretKeyEnvironmentVar,
            });
            serviceCollection.AddSingleton<IRedisDbProvider, RedisDbProvider>();
            serviceCollection.AddSingleton<IFanVisibilityService, RedisFanVisibilityService>();
            serviceCollection.AddSingleton<IStreamRepository, MongoStreamRepository>();
            serviceCollection.AddSingleton<ICreditBalanceRepository, MongoCreditBalanceRepository>();
            serviceCollection.AddSingleton<IBoostCacheRepository, RedisBoostCacheRepository>();
            serviceCollection.AddScoped<IWebSocketService, PubNubWebSocketService>();
            serviceCollection.AddScoped<IIdleGameRepository, RedisIdleGameRepository>();
            serviceCollection.AddSingleton<IUserRepository, MongoUserRepository>();
            serviceCollection.AddSingleton<IBoostRepository, MongoBoostRepository>();
            serviceCollection.AddSingleton<IVoteRepository, RedisVoteRepository>();
            serviceCollection.AddSingleton<IVoteHistoryRepository, MongoVoteHistoryRepository>();
            serviceCollection.AddSingleton<IPredictionService, PredictionService>();
            serviceCollection.AddSingleton<IPredictionCache, RedisPredictionCache>();
            serviceCollection.AddSingleton<IBoostCacheRepository, RedisBoostCacheRepository>();
            serviceCollection.AddSingleton<ILeaderboardRepository, RedisLeaderboardRepository>();
            serviceCollection.AddSingleton<ILeaderboardService, LeaderboardService>();
            serviceCollection.AddSingleton<ISkyboxCache, RedisSkyboxCache>();
            serviceCollection.AddSingleton<ISkyboxRepository, MongoSkyboxRepository>();

            services = serviceCollection.BuildServiceProvider();
            _fanVisibilityServiceService = services.GetRequiredService<IFanVisibilityService>();
            _boostCacheRepository = services.GetRequiredService<IBoostCacheRepository>();
            _idleGameRepository = services.GetRequiredService<IIdleGameRepository>();
            _voteRepository = services.GetRequiredService<IVoteRepository>();
            _voteHistoryRepository = services.GetRequiredService<IVoteHistoryRepository>();
            _webSocketService = services.GetRequiredService<IWebSocketService>();

            _predictionCache = services.GetRequiredService<IPredictionCache>();
            _predictionService = services.GetRequiredService<IPredictionService>();
        }

        static async Task Main(string[] args)
        {
            Console.WriteLine("Running periodic prediction updates...");
            var program = new Program();

            int periodicUpdateMs = 5000; //5 seconds
            decimal prevRedTeamPrice = 0.00M;
            decimal prevBlueTeamPrice = 0.00M;
            int prevTotalSpent = 0;
            while (true)
            {
                Console.WriteLine("**********************************************");
                try
                {
                    var activeVoting = await _voteRepository.GetActiveVoting(stageId);

                    if (activeVoting != null)
                    {
                        string voteIdString = activeVoting.VoteId.ToString();
                        var voteConfig = await _voteRepository.GetVoteConfig(stageId, voteIdString);

                        if (voteConfig != null)
                        {
                            Dictionary<string, int> voteTotals = new Dictionary<string, int>();

                            foreach (var voteOptionName in voteConfig.VoteOptions)
                            {
                                voteTotals[voteOptionName] = 0;
                            }

                            var votes = await _voteRepository.GetVotes(stageId, voteIdString);
                            
                            var voteUpdate = new VoteUpdate
                            {
                                VoteTitle = voteConfig.VoteTitle,
                                VoteTimeSeconds = voteConfig.VoteTimeSeconds,
                                NumberOfVotes = votes.Count
                            };

                            foreach (var vote in votes)
                            {
                                if (voteTotals.ContainsKey(vote.VoteOption))
                                {
                                    voteTotals[vote.VoteOption]++;
                                }
                            }

                            foreach (var vote in voteTotals)
                            {
                                var voteOptionWithVotes = new VoteOptionWithVotes
                                {
                                    Name = vote.Key,
                                    NumberOfVotes = vote.Value
                                };
                                voteUpdate.VoteResults.Add(voteOptionWithVotes);
                            }

                            DateTimeOffset dto = new DateTimeOffset(DateTime.UtcNow);
                            long currentTimestamp = dto.ToUnixTimeMilliseconds();
                            if (currentTimestamp >= voteConfig.VoteStartTimestamp + (voteConfig.VoteTimeSeconds * 1000))
                            {
                                //Remove the active vote
                                await _voteRepository.RemoveActiveVoting(stageId);

                                var newVoteHistory = new VoteHistory
                                {
                                    StageId = ObjectId.Parse(stageId),
                                    VoteTitle = voteConfig.VoteTitle,
                                    VoteOptionResults = voteUpdate.VoteResults,
                                    CreatedAt = DateTime.UtcNow,
                                    UpdatedAt = DateTime.UtcNow,
                                    V = 0
                                };

                                //Store the results
                                await _voteHistoryRepository.AddVoteHistory(newVoteHistory);

                                //Set final update
                                voteUpdate.IsFinalUpdate = true;
                            }

                            try
                            {
                                BoostSignalMessage boostSignalMessage = new BoostSignalMessage()
                                {
                                    BoostEventType = "VoteUpdate",
                                    EventId = stageId,
                                    VoteUpdate = voteUpdate
                                };
                                string message = JsonSerializer.Serialize(boostSignalMessage);
                                await _webSocketService?.SendMessageSignalToPlatformClient($"s.{stageId}", "Wildcard", message);

                                Console.WriteLine($"Successfully send vote update message - {message}");
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"Error - Failed to send updated vote via pubnub - {ex.Message}");
                            }
                        }
                    }
                    else
                    {
                        Console.WriteLine($"No Active Vote");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error - Failed to fetch active vote, stageId: {stageId} - {ex.Message}");
                }


                Console.WriteLine("**********************************************");
                //Get event match from stageId and do nothing if there is no valid event match
                EventMatch? eventMatch;
                try
                {
                    eventMatch = await _idleGameRepository?.GetEventMatchFromStageId(stageId);
                    if (eventMatch == null)
                    {
                        Console.WriteLine("PeriodicPredictionUpdates: No active EventMatch!");
                        //Wait periodicUpdateMs seconds
                        Thread.Sleep(periodicUpdateMs);
                        continue;
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error - Failed to fetch event match, stageId: {stageId} - {ex.Message}");
                    //Wait periodicUpdateMs seconds
                    Thread.Sleep(periodicUpdateMs);
                    continue;
                }


                //Get total credits spent on Red and Blue
                int totalSpentOnRedTeam;
                int totalSpentOnBlueTeam;
                int totalSpent;
                string segmentStr = eventMatch.Segment.ToString();
                try
                {

                    totalSpentOnRedTeam = await _predictionCache?.GetTotalSpent(stageId, "red", segmentStr);
                    totalSpentOnBlueTeam = await _predictionCache?.GetTotalSpent(stageId, "blue", segmentStr);
                    totalSpentOnRedTeam += startingSpendPerTeam;
                    totalSpentOnBlueTeam += startingSpendPerTeam;

                    totalSpent = totalSpentOnRedTeam + totalSpentOnBlueTeam;
                    Console.WriteLine($"Fetch current total spent on red: {totalSpentOnRedTeam} and total spent on blue: {totalSpentOnBlueTeam}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error - Failed to fetch total spent on red and blue team - {ex.Message}");
                    //Wait periodicUpdateMs seconds
                    Thread.Sleep(periodicUpdateMs);
                    continue;
                }

                //Calculate the prices for each button
                decimal redTeamButtonPrice = Math.Round((decimal)totalSpentOnRedTeam / totalSpent, 2);
                decimal blueTeamButtonPrice = Math.Round(1 - redTeamButtonPrice, 2);

                // If neither change, then don't send a PubNub update
                if (redTeamButtonPrice < prevRedTeamPrice && blueTeamButtonPrice < prevBlueTeamPrice)
                {
                    //Wait periodicUpdateMs seconds
                    Thread.Sleep(periodicUpdateMs);
                    continue;
                }

                prevRedTeamPrice = redTeamButtonPrice;
                prevBlueTeamPrice = blueTeamButtonPrice;

                //Get list of prediction and calculate average points for red&blue
                decimal averagePointsRed;
                decimal averagePointsBlue;
                int totalUniqueUserCount;
                try
                {
                    SharedAveragePoints sharedAveragePoints = await _predictionService?.GetSharedAveragePoints(stageId, segmentStr);
                    averagePointsRed = sharedAveragePoints.RedTeamAveragePoints;
                    averagePointsBlue = sharedAveragePoints.BlueTeamAveragePoints;
                    totalUniqueUserCount = sharedAveragePoints.TotalUniqueUserCount;
                    Console.WriteLine($"Average points on red team {averagePointsRed} and average points on blue team {averagePointsBlue}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error - Failed to fetch list of predictions - {ex.Message}");
                    //@todo skip or proceed with previous values of average points (red/blue)
                    Thread.Sleep(periodicUpdateMs);
                    continue;
                }

                //Send an object with the price for Red and price for Blue to Thousands via the PubNub Signal Message channel with a new event type to get picked up in the StreamChat control
                try
                {
                    BoostSignalMessage boostSignalMessage = new BoostSignalMessage()
                    {
                        BoostEventType = "PeriodicUpdate",
                        EventId = stageId,
                        RedBlueRatio = redTeamButtonPrice,
                        TotalRedBoosts = totalSpentOnRedTeam,
                        TotalBlueBoosts = totalSpentOnBlueTeam,
                        RoundNumber = eventMatch.Segment,
                        AverageRedBoosts = averagePointsRed,
                        AverageBlueBoosts = averagePointsBlue,
                        TotalUniqueUserCount = totalUniqueUserCount,
                    };
                    string message = JsonSerializer.Serialize(boostSignalMessage);
                    await _webSocketService?.SendMessageSignalToPlatformClient($"s.{stageId}", "Wildcard", message);

                    await _webSocketService?.SendMessageSignalToPlatformClient($"rally-overlay-channel", "Wildcard", message);

                    Console.WriteLine($"Successfully send message - {message}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error - Failed to send updated red and blue team button price via pubnub - {ex.Message}");
                    //Wait periodicUpdateMs seconds
                    Thread.Sleep(periodicUpdateMs);
                    continue;
                }

                string teamColor = totalSpentOnRedTeam > totalSpentOnBlueTeam ? "red" : "blue";
                int prevLevel = (int)Math.Floor((decimal)prevTotalSpent / (decimal)totalCreditsSpentPerLevel) + 1;
                int level = (int)Math.Floor((decimal)totalSpent / (decimal)totalCreditsSpentPerLevel) + 1;

                try
                {
                    await HandleFireOffGameEffects(eventMatch.VendorEventId, level, prevLevel, teamColor);
                    prevTotalSpent = totalSpent;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error - Failed to fire game effect - {ex.Message}");
                }

                //Wait periodicUpdateMs seconds
                Thread.Sleep(periodicUpdateMs);
            }
        }

        private static async Task HandleFireOffGameEffects(string vendorEventId, int level, int prevLevel, string teamColor)
        {
            Console.WriteLine($"HandleComboMultiplierIncreaseAndFireOffGameEffects - vendorEventId: {vendorEventId} {teamColor} {level} {prevLevel}");

            string fanfareEventType = "FanfareEffect";
            string suffix = teamColor == "red" ? "_team1" : "_team0";

            if (prevLevel < level && level == 2) //Camera flashes - 6 seconds
            {
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
            else if (prevLevel < level && level == 3) //low intensity clap emoji across the whole stadium - 6 seconds
            {
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
            else if (prevLevel < level && level == 4) //medium intensity party emoji across the whole stadium at low intensity - 6 seconds
            {
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
            else if (prevLevel < level && level == 5) //high intensity boom emoji across the whole stadium at low intensity - 8 seconds
            {
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
            else if (prevLevel < level && level == 6) //high intensity fire emoji across the whole stadium at low intensity - 8 seconds
            {
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
            else if (prevLevel < level && level == 7) //high intensity house signs/banners (champions, foam fingers, house banners, or summons) across the whole stadium - 10 seconds
            {
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
            else if (prevLevel < level && level == 8) //Trigger high intensity smoke bombs across the whole stadium - 10 seconds
            {
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
            else if (prevLevel < level && level == 9) //Trigger high intensity fireworks - 10 seconds
            {
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
            else if (prevLevel < level && level == 10) //THE WAVE - 12 seconds
            {
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
    }
}
