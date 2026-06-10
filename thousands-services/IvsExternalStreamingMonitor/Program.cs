using IvsIdleGameShared.Configuration.Interfaces;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Configuration.Implementations;
using IvsIdleGameShared.Repositories.Implementations;
using IvsIdleGameShared.Repositories.Interfaces;
using IvsIdleGameShared.Services.Implementations;
using IvsIdleGameShared.Services.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Amazon.Runtime.Internal.Endpoints.StandardLibrary;
using IvsIdleGameShared.Models;
using System.Text.Json;
using IvsIdleGameShared.Models.ExternalStreams;
using MongoDB.Bson;
using MongoDB.Driver;
using IvsIdleGameShared.Models.Wildcard;
using System.Text;
using System.Net.Http.Headers;
using Microsoft.Extensions.DependencyInjection.Extensions;
using System;
using System.Text.RegularExpressions;
using Amazon.Runtime.Internal.Transform;
using MongoDB.Driver.Linq;

namespace IvsExternalStreamingMonitor
{
    class RedirectHandler : HttpClientHandler
    {
        private readonly string _token;

        public RedirectHandler(string token)
        {
            _token = token;
            AllowAutoRedirect = true; // still allow redirects
        }
        /*
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _token);
            return base.SendAsync(request, cancellationToken);
        }
        */
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            // Reapply Authorization header
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _token);

            // Clone content if needed (because HttpContent is one-time-use)
            string requestBody = null;
            if (request.Content != null)
            {
                requestBody = await request.Content.ReadAsStringAsync(cancellationToken);
                // Rebuild content after reading
                request.Content = new StringContent(requestBody, Encoding.UTF8, "application/json");
            }

            // Log raw request
            //Console.WriteLine("---- HTTP REQUEST ----");
            //Console.WriteLine($"{request.Method} {request.RequestUri}");
            foreach (var header in request.Headers)
            {
                //Console.WriteLine($"{header.Key}: {string.Join(", ", header.Value)}");
            }
            if (requestBody != null)
            {
                //Console.WriteLine("Body:");
                //Console.WriteLine(requestBody);
            }
            //Console.WriteLine("----------------------");

            return await base.SendAsync(request, cancellationToken);
        }

    }


    internal class Program
    {
        private static IFanVisibilityService? _fanVisibilityServiceService;
        private static IBoostCacheRepository? _boostCacheRepository;
        private static IIdleGameRepository? _idleGameRepository;
        private static IVoteRepository? _voteRepository;
        private static IVoteHistoryRepository? _voteHistoryRepository;
        private static IExternalStreamRepository? _externalStreamRepository;
        private static IUserRepository? _userRepository;
        private static IWebSocketService? _webSocketService;
        private static IPredictionCache? _predictionCache;
        private static IPredictionService? _predictionService;
        private static IServiceProvider? services;
        private static long streamerGamerTag = 1885625512079360;

        public Program()
        {
            var config = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                .Build();


            string fanVisibilityServiceEndpointEnvironmentVar = config["fanVisibilityServiceEndpoint"] ?? "";

            int fanVisibilityServicePort = int.Parse(config["fanVisibilityServicePort"] ?? "0");

            string fanVisibilityServicePasswordEnvironmentVar = config["fanVisibilityServicePassword"] ?? "";

            string fanVisibilityServiceUserEnvironmentVar = config["fanVisibilityServiceUser"] ?? "";

            string streamRepositoryConnectionUriEnvironmentVar = config["streamRepositoryConnectionUri"] ?? "";

            string streamRepositoryDatabaseNameEnvironmentVar = config["streamRepositoryDatabaseName"] ?? "";

            string chatWebSocketPublisherKeyEnvironmentVar = config["chatWebSocketPublisherKey"] ?? "";

            string chatWebSocketSubscriberKeyEnvironmentVar = config["chatWebSocketSubscriberKey"] ?? "";

            string chatWebSocketSecretKeyEnvironmentVar = config["chatWebSocketSecretKey"] ?? "";

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
                SkyboxesCollectionName = "skyboxes",
                GiftEventsCollectionName = "gift-events",
                ExternalStreamsCollectionName = "external-streams",
                ExternalStreamStatsCollectionName = "external-stream-stats"
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
            serviceCollection.AddSingleton<IExternalStreamRepository, MongoExternalStreamRepository>();

            services = serviceCollection.BuildServiceProvider();
            _fanVisibilityServiceService = services.GetRequiredService<IFanVisibilityService>();
            _boostCacheRepository = services.GetRequiredService<IBoostCacheRepository>();
            _idleGameRepository = services.GetRequiredService<IIdleGameRepository>();
            _voteRepository = services.GetRequiredService<IVoteRepository>();
            _voteHistoryRepository = services.GetRequiredService<IVoteHistoryRepository>();
            _externalStreamRepository = services.GetService<IExternalStreamRepository>();
            _userRepository = services.GetService<IUserRepository>();
            _webSocketService = services.GetRequiredService<IWebSocketService>();

            _predictionCache = services.GetRequiredService<IPredictionCache>();
            _predictionService = services.GetRequiredService<IPredictionService>();
        }

        static async Task Main(string[] args)
        {
            Console.WriteLine("Running stream monitoring...");
            var program = new Program();

            if (_externalStreamRepository == null)
            {
                Console.WriteLine("_externalStreamRepository is null!  Exiting...");
                return;
            }

            //Get list of streamers
            var streamerUsers = await _userRepository.GetStreamerUsers();

            Console.WriteLine(JsonSerializer.Serialize(streamerUsers));

            Dictionary<string, string> twitchIdToUserId = new Dictionary<string, string>();
            Dictionary<string, string> gamerTagToUserId = new Dictionary<string, string>();
            Dictionary<string, string> userIdToTwitchId = new Dictionary<string, string>();
            Dictionary<string, string> userIdToTwitchName = new Dictionary<string, string>();

            foreach (var streamerUser in streamerUsers)
            {
                if (streamerUser?.Id != null /*&& streamerUser?.TwitchProvider?.id != null*/)
                {
                    string userId = streamerUser?.Id.ToString()!;
                    string twitchId = "68978631";
                    if (streamerUser?.Id != new ObjectId("687a9ff256cf424dd0088bf0"))
                    {
                        twitchId = "866886131";
                    }

                    string? gamerTag = streamerUser?.BeamableProvider?.Id;
                    if (gamerTag != null)
                    {
                        gamerTag = streamerGamerTag.ToString();
                        Console.WriteLine(
                            $"Adding: {userId} - {twitchId} - {streamerUser?.TwitchProvider?.Name ?? ""}");
                        twitchIdToUserId.TryAdd(twitchId, userId);
                        gamerTagToUserId.TryAdd(gamerTag, userId);
                        userIdToTwitchId.TryAdd(userId, twitchId);
                        userIdToTwitchName.TryAdd(userId,
                            streamerUser?.TwitchProvider?.Name ?? "");
                    }
                    else
                    {
                        Console.WriteLine($"Can't find gamertag for userId: {userId}");
                    }
                }
            }


            // 🔌 Connection string and database/collection name
            var connectionString = "mongodb+srv://1676368290596864DE_1795922961378453:Kc%29Z%21xkvGgC7%23hb%24djPvc%297z@cluster0.zbsmp.mongodb.net/test?authSource=admin&ssl=true"; // or your connection string
            var mongoDbClient = new MongoClient(connectionString);
            var database = mongoDbClient.GetDatabase("1676368290596864DE_1795922961378453_PurchaseStorage");
            var collection = database.GetCollection<MatchResult>("match_results");

            DateTime lastWildcardMatchEntryDateTime = new DateTime(2025, 7, 27);

            int periodicUpdateMs = 30000; //60 seconds
            while (true)
            {
                Console.WriteLine("**********************************************");
                try
                {
                    //Get all active streams
                    var activeStreams = await _externalStreamRepository.GetAllActiveExternalStreams();

                    //Console.WriteLine(JsonSerializer.Serialize(activeStreams));

                    //Check for Twitch streams
                    /*
                    using HttpClient client = new HttpClient();
                    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "z3t3IjCqfn9fPXOm6eQP0V+Ywbnbz0ux2obNj9W6EeY=");
                    string url = "https://test.thousands.tv/api/platform/twitch/getViewCountByIds";
                    GetViewCountRequest getViewCountRequest = new GetViewCountRequest();
                    getViewCountRequest.UserIds.Add(streamerTwitchId);
                    var request = new HttpRequestMessage(HttpMethod.Post, url);
                    string bodyJson = JsonSerializer.Serialize(getViewCountRequest);
                    Console.WriteLine(bodyJson);
                    //request.Headers.Add("Authorization", "Bearer z3t3IjCqfn9fPXOm6eQP0V+Ywbnbz0ux2obNj9W6EeY=");
                    request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", "z3t3IjCqfn9fPXOm6eQP0V+Ywbnbz0ux2obNj9W6EeY=");
                    request.Content = new StringContent(bodyJson, Encoding.UTF8, "application/json");
                    
                    Console.WriteLine(request.Content.Headers.First().Key + " | " + request.Content.Headers.First().Value.First());

                    HttpResponseMessage response = await client.PostAsync(url, new StringContent(bodyJson, Encoding.UTF8, "application/json"));
                    response.EnsureSuccessStatusCode();

                    string content = await response.Content.ReadAsStringAsync();
                    */

                    var apiUrl = "https://test.thousands.tv/api/platform/twitch/getViewCountByIds/";
                    var token = "z3t3IjCqfn9fPXOm6eQP0V+Ywbnbz0ux2obNj9W6EeY=";
                    var handler = new RedirectHandler(token);

                    var payload = new
                    {
                        userIds = new[] { "68978631" }
                    };

                    using var client = new HttpClient();

                    // Set headers
                    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
                    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                    var json = JsonSerializer.Serialize(payload);
                    var content = new StringContent(json, Encoding.UTF8, "application/json");

                    var response = await client.PostAsync(apiUrl, content);
                    var responseContent = await response.Content.ReadAsStringAsync();

                    Console.WriteLine($"Status: {response.StatusCode}");
                    Console.WriteLine("Response:");
                    Console.WriteLine(responseContent);

                    //Console.WriteLine(content);

                    TwitchViewCounts? twitchViewCounts = JsonSerializer.Deserialize<TwitchViewCounts>(responseContent);

                    if (twitchViewCounts == null)
                    {
                        Console.WriteLine("Failed to deserialize response or content was null.");
                        continue;
                    }

                    if (!twitchViewCounts.Success)
                    {
                        Console.WriteLine($"Failed {twitchViewCounts.Message}");
                        continue;
                    }

                    foreach (var viewCount in twitchViewCounts.Data.ViewerCounts)
                    {
                        Console.WriteLine($"{viewCount.UserId} - {viewCount.IsLive} - {viewCount.ViewerCountValue}");

                        string twitchId = viewCount.UserId;
                        //If this is a live stream
                        if (viewCount.IsLive)
                        {
                            Console.WriteLine("Try getting userIdForTwitchId...");
                            if (twitchIdToUserId.TryGetValue(viewCount.UserId, out string? userIdForTwitchId))
                            {
                                Console.WriteLine($"Found userId: {userIdForTwitchId}");
                                string twitchUserName = userIdToTwitchName[userIdForTwitchId];
                                Console.WriteLine($"Found Twitch UserName: {twitchUserName}");

                                //Check for a live external stream
                                if (activeStreams !=null && activeStreams.Count > 0)
                                {
                                    var activeStream = activeStreams.Find(x =>
                                        x.UserId == userIdForTwitchId);

                                    //No active stream so we need to add one
                                    if (activeStream == null)
                                    {
                                        ExternalStream externalStream = new ExternalStream
                                        {
                                            Id = ObjectId.GenerateNewId().ToString()!,
                                            UserId = new ObjectId(userIdForTwitchId).ToString()!, //Dartanlla
                                            StartDate = DateTime.UtcNow,
                                            PlatformId = AccountProviderType.Twitch,
                                            PlatformUserName = twitchUserName,
                                            AmountEarned = 0
                                        };

                                        await _externalStreamRepository.AddExternalStream(externalStream);
                                    }
                                }
                                else
                                {
                                    ExternalStream externalStream = new ExternalStream
                                    {
                                        Id = ObjectId.GenerateNewId().ToString()!,
                                        UserId = new ObjectId(userIdForTwitchId).ToString()!,
                                        StartDate = DateTime.UtcNow,
                                        PlatformId = AccountProviderType.Twitch,
                                        PlatformUserName = twitchUserName,
                                        AmountEarned = 0
                                    };

                                    await _externalStreamRepository.AddExternalStream(externalStream);
                                }
                            }

                            //Write data to MongoDB
                            if (viewCount.ViewerCountValue > -1)
                            {
                                ExternalStreamStats externalStreamStats = new ExternalStreamStats
                                {
                                    Id = ObjectId.GenerateNewId().ToString()!,
                                    UserId = new ObjectId(userIdForTwitchId).ToString()!,
                                    CreatedAt = DateTime.UtcNow,
                                    ViewerCount = viewCount.ViewerCountValue
                                };

                                await _externalStreamRepository.AddExternalStreamStats(externalStreamStats);
                            }
                        }
                    }








                    //Check for new Wildcard matches that have ended
                    var filter = Builders<MatchResult>.Filter.Gt(
                        "matchResults.createdAt",
                        lastWildcardMatchEntryDateTime
                    );

                    Console.WriteLine($"lastWildcardMatchEntryDateTime: {lastWildcardMatchEntryDateTime}");

                    var results = await collection.Find(filter).ToListAsync();

                    //Loop through new matches completed
                    foreach (var result in results)
                    {
                        //Console.WriteLine(result.ToJson());
                        var foundStreamerMatches =
                            result.MatchResults.PlayerData.FindAll(x => x.GamerTag == streamerGamerTag);
                        if (foundStreamerMatches.Count > 0)
                        {
                            foreach (var foundStreamerMatch in foundStreamerMatches)
                            {
                                Console.WriteLine($"Streamer GamerTag: {foundStreamerMatch.GamerTag}, Match Lobby: {result.MatchResults.LobbyId}, Winner Team: {result.MatchResults.WinningTeamId}");

                                int matchDurationSeconds = (int)Math.Ceiling(result.MatchResults.Duration);

                                var externalStreamStats = 
                                    await _externalStreamRepository.GetExternalStreamStatsByDateRange(result.CreatedAt.AddSeconds(0 - matchDurationSeconds), 
                                        result.CreatedAt);

                                int totalViewers = 0;
                                int averageViewers = 0;

                                if (externalStreamStats.Count > 0)
                                {
                                    foreach (var externalStreamStat in externalStreamStats)
                                    {
                                        totalViewers += externalStreamStat.ViewerCount;
                                    }

                                    averageViewers =
                                        (int)Math.Ceiling((float)totalViewers / (float)externalStreamStats.Count);
                                }

                                Console.WriteLine($"averageViewers: {averageViewers}");

                                if (averageViewers > 0)
                                {
                                    //Calculate the length of the Wildcard match.  Paul said to boost it by 50%.
                                    int paddedMatchDurationSeconds =
                                        (int)Math.Ceiling((double)matchDurationSeconds * (double)1.5);

                                    Console.WriteLine($"paddedMatchDurationSeconds: {paddedMatchDurationSeconds}");

                                    //Calculate viewer minutes
                                    int viewerMinutesForThisMatch =
                                        (int)Math.Ceiling((double)(paddedMatchDurationSeconds * averageViewers) /
                                                          (double)60);

                                    Console.WriteLine($"viewerMinutesForThisMatch: {viewerMinutesForThisMatch}");

                                    //We are paying $0.00167 per viewer minute.  Calculate how much we own the streamer.
                                    decimal amountEarnedForThisMatch =
                                        Math.Ceiling((decimal)viewerMinutesForThisMatch * 0.00167M * 100) / 100;

                                    Console.WriteLine($"amountEarnedForThisMatch: {amountEarnedForThisMatch}");

                                    //Update the active stream to increase the amount earned by amountEarnedForThisMatch
                                    if (activeStreams != null && activeStreams.Count > 0)
                                    {
                                        Console.WriteLine("Found at least one active stream");
                                        Console.WriteLine(JsonSerializer.Serialize(gamerTagToUserId));
                                        if (gamerTagToUserId.TryGetValue(foundStreamerMatch.GamerTag.ToString(), out string? userIdFromGamerTag))
                                        {
                                            Console.WriteLine("Found a matching active stream");
                                            if (!string.IsNullOrEmpty(userIdFromGamerTag))
                                            {
                                                Console.WriteLine($"userIdFromGamerTag: {userIdFromGamerTag}");
                                                var activeStream = activeStreams.Find(x =>
                                                    x.UserId == userIdFromGamerTag);

                                                if (activeStream != null && !string.IsNullOrEmpty(activeStream.Id))
                                                {
                                                    Console.WriteLine("Active stream is valid!");
                                                    string activeStreamId = activeStream.Id;
                                                    decimal previousAmountEarned = activeStream?.AmountEarned ?? 0;
                                                    decimal newAmountEarned =
                                                        previousAmountEarned + amountEarnedForThisMatch;
                                                    Console.WriteLine($"newAmountEarned: {newAmountEarned}");
                                                    decimal subCost = 0.02M;
                                                    if (newAmountEarned >= subCost)
                                                    {
                                                        //Calculate how many to gift
                                                        int numberOfSubsToGift =
                                                            (int)Math.Floor(newAmountEarned / subCost);
                                                        Console.WriteLine($"numberOfSubsToGift: {numberOfSubsToGift}");
                                                        //Calculate how much is left over
                                                        decimal amountEarnedLeft = newAmountEarned % subCost;
                                                        Console.WriteLine($"amountEarnedLeft: {amountEarnedLeft}");
                                                        //Get Twitch user name from userId
                                                        string twitchUserName = userIdToTwitchName[userIdFromGamerTag];
                                                        Console.WriteLine($"twitchUserName: {twitchUserName}");
                                                        GiftEvent giftEvent = new GiftEvent
                                                        {
                                                            Id = ObjectId.GenerateNewId().ToString()!,
                                                            UserId =
                                                                new ObjectId(userIdFromGamerTag)
                                                                    .ToString()!,
                                                            CreatedAt = DateTime.UtcNow,
                                                            NumberOfSubs = numberOfSubsToGift,
                                                            PlatformId = AccountProviderType.Twitch,
                                                            PlatformUserName = twitchUserName,
                                                            UpdatedAt = DateTime.UtcNow
                                                        };
                                                        if (await _externalStreamRepository.AddGiftEvent(giftEvent))
                                                        {
                                                            //Modify the stream amountEarned to set it to what is leftover after gifting subs
                                                            await _externalStreamRepository
                                                                .UpdateExternalStreamSetAmountEarned(
                                                                    activeStreamId, amountEarnedLeft);
                                                        }
                                                        else
                                                        {
                                                            Console.WriteLine($"Unable to add gift event.");
                                                            await _externalStreamRepository
                                                                .UpdateExternalStreamSetAmountEarned(
                                                                    activeStreamId, newAmountEarned);
                                                        }
                                                    }
                                                    else
                                                    {
                                                        //We don't have enough newAmountEarned to gift a sub, so just update the external-streams row with newAmountEarned
                                                        await _externalStreamRepository
                                                            .UpdateExternalStreamSetAmountEarned(
                                                                activeStreamId, newAmountEarned);
                                                    }
                                                }
                                            }
                                        }
                                    }

                                    
                                }
                            }
                        }

                        lastWildcardMatchEntryDateTime = result.CreatedAt;
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error - Failed - {ex.Message}");
                    Thread.Sleep(periodicUpdateMs);
                    continue;
                }


                Thread.Sleep(periodicUpdateMs);
            }
        }
    }
}


