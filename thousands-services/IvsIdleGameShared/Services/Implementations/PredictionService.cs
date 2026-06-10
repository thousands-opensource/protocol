using System;
using System.Text.Json;
using System.Threading.Tasks;
using Amazon.IVSRealTime.Model;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Models.Boost;
using IvsIdleGameShared.Models.Leaderboard;
using IvsIdleGameShared.Models.Market;
using IvsIdleGameShared.Models.Prediction;
using IvsIdleGameShared.Models.TokenDistribution;
using IvsIdleGameShared.Repositories.Interfaces;
using IvsIdleGameShared.Services.Interfaces;
using NetTopologySuite.Triangulate;
using PubnubApi.EventEngine.Subscribe.Common;
using PubnubApi;
using NetTopologySuite.Index.HPRtree;
using Microsoft.Extensions.Logging;
using IvsIdleGameShared.Models.Skybox;
using System.Collections.Generic;
using System.Runtime.InteropServices.JavaScript;
using IvsIdleGameShared.Models.RallyPrediction;
using MongoDB.Bson;

namespace IvsIdleGameShared.Services.Implementations;

public class PredictionService : IPredictionService
{
    private readonly IPredictionCache _predictionCache;
    private readonly ICreditBalanceRepository _creditBalanceRepository;
    private readonly IIdleGameRepository _idleGameRepository;
    private readonly IBoostRepository _boostRepository;
    private readonly IStreamRepository _streamRepository;
    private readonly IWebSocketService _websocketService;
    private readonly ILeaderboardService _leaderboardService;
    private readonly ISkyboxRepository _skyboxRepository;
    private readonly ISkyboxCache _skyboxCache;
    private readonly IFanVisibilityService _fanVisibilityService;
    private readonly IRallyPredictionRepository _rallyPredictionRepository;
    private const decimal GoldenRatio = 1.618M;
    private const int NumberOfMinutesInSmallVelocityTimeSegment = 60;
    private const int NumberOfMinutesInLargeVelocityTimeSegment = 1440;
    private const int StartingSpendPerTeam = 5000;

    public PredictionService(IPredictionCache predictionCache, ICreditBalanceRepository creditBalanceRepository,
        IIdleGameRepository idleGameRepository, IBoostRepository boostRepository, IStreamRepository streamRepository, IWebSocketService websocketService, 
        ILeaderboardService leaderboardService, ISkyboxRepository skyboxRepository, ISkyboxCache skyboxCache, IFanVisibilityService fanVisibilityService,
        IRallyPredictionRepository rallyPredictionRepository)
    {
        _predictionCache = predictionCache;
        _creditBalanceRepository = creditBalanceRepository;
        _idleGameRepository = idleGameRepository;
        _boostRepository = boostRepository;
        _streamRepository = streamRepository;
        _websocketService = websocketService;
        _leaderboardService = leaderboardService;
        _skyboxCache = skyboxCache;
        _skyboxRepository = skyboxRepository;
        _fanVisibilityService = fanVisibilityService;
        _rallyPredictionRepository = rallyPredictionRepository;
    }

    public async Task<PredictionPriceQuote> GetPriceQuote(string userId, string teamName, int credits, string stageId)
    {
        DateTimeOffset dto = new DateTimeOffset(DateTime.UtcNow);
        long currentTimestamp = dto.ToUnixTimeMilliseconds();

        //Check for active event
        EventMatch? eventMatch = await _idleGameRepository.GetEventMatchFromStageId(stageId);
        if (eventMatch == null)
        {
            Console.WriteLine("ThousandsWarning: No active EventMatch!");

            //There isn't an active event match
            return new PredictionPriceQuote()
            {
                StageId = "",
                Segment = 0,
                Prediction = new Prediction
                {
                    UserId = userId,
                    TeamName = teamName,
                    Credits = 0,
                    Price = 0.00M,
                    Timestamp = currentTimestamp
                }
            };
        }

        var eventMatchStartTime = eventMatch.Timestamp;

        int segment = eventMatch.Segment;
        string segmentStr = segment.ToString();

        int creditBalance = await _creditBalanceRepository.GetCreditBalance(userId);
        Console.WriteLine($"ThousandsInfo: Credit Balance: {creditBalance}");
        if (creditBalance < credits)
        {
            Console.WriteLine($"ThousandsWarning: Not enough credits!");
            //The user doesn't have enough credits to complete this trade
            return new PredictionPriceQuote()
            {
                StageId = stageId,
                Segment = segment,
                Prediction = new Prediction
                {
                    UserId = userId,
                    TeamName = teamName,
                    Credits = -1,
                    Price = 0.00M,
                    Timestamp = currentTimestamp
                }
            };
        }

        decimal price;
        int totalSpentOnRedTeam = await _predictionCache.GetTotalSpent(stageId, "red", segmentStr);
        int totalSpentOnBlueTeam = await _predictionCache.GetTotalSpent(stageId, "blue", segmentStr);
        Console.WriteLine($"ThousandsInfo: Fetched total spent on red {totalSpentOnRedTeam} and blue {totalSpentOnBlueTeam}");
        totalSpentOnRedTeam += StartingSpendPerTeam;
        totalSpentOnBlueTeam += StartingSpendPerTeam;

        int totalSpent = totalSpentOnRedTeam + totalSpentOnBlueTeam;

        if (teamName == "red")
        {
            price = Math.Round((decimal)totalSpentOnRedTeam / totalSpent, 2);
        }
        else
        {
            price = Math.Round((decimal)totalSpentOnBlueTeam / totalSpent, 2);
        }

        var newPredictionPriceQuote = new PredictionPriceQuote()
        {
            StageId = stageId,
            Segment = segment,
            Prediction = new Prediction
            {
                UserId = userId,
                TeamName = teamName,
                Credits = credits,
                Price = price,
                Timestamp = currentTimestamp
            }
        };

        //Modified the following method to remove all existing price quotes for the user before storing the new price quote
        bool success = await _predictionCache.StorePredictionPriceQuote(userId, newPredictionPriceQuote);
        if (success)
        {
            Console.WriteLine($"ThousandsInfo: Stored prediction price quote to db");
            return newPredictionPriceQuote;
        }

        Console.WriteLine($"ThousandsInfo: Unable to store prediction price quote to db");
        //There was an error storing the prediction price quote
        return new PredictionPriceQuote()
        {
            StageId = stageId,
            Segment = segment,
            Prediction = new Prediction
            {
                UserId = userId,
                TeamName = teamName,
                Credits = -1,
                Price = 0.00M,
                Timestamp = currentTimestamp
            }
        };
    }

    public async Task<PredictionPriceQuote> GetPriceQuote(string userId, bool choice, int credits, string predictionId)
    {
        DateTimeOffset dto = new DateTimeOffset(DateTime.UtcNow);
        long currentTimestamp = dto.ToUnixTimeMilliseconds();

        //Lookup prediction to get start time
        RallyPredictionCache? rallyPredictionCache = await _predictionCache.GetRallyPrediction(predictionId);

        //We haven't yet cached this start time, so we need to look it up from MongoDB and cache it
        if (rallyPredictionCache == null)
        {
            Console.WriteLine($"GetRallyPrediction from cache is null!");
            //Lookup prediction in MongoDB
            var rallyPrediction = await _rallyPredictionRepository.GetRallyPrediction(predictionId);

            if (rallyPrediction == null)
            {
                Console.WriteLine($"ThousandsWarning: RallyPrediction not found for: {predictionId}");
                return new PredictionPriceQuote()
                {
                    StageId = predictionId,
                    Segment = 0,
                    Prediction = new Prediction
                    {
                        UserId = userId,
                        TeamName = choice.ToString(),
                        Credits = -3,
                        Price = 0.00M,
                        Timestamp = currentTimestamp
                    }
                };
            }

            rallyPredictionCache = new RallyPredictionCache();
            rallyPredictionCache.RallyPrediction = rallyPrediction;

            Console.WriteLine($"Storing Rally Prediction in Cache...");
            await _predictionCache.StoreRallyPrediction(predictionId, rallyPredictionCache);
        }

        string rallyPredictionCacheJsonString = JsonSerializer.Serialize(rallyPredictionCache);
        Console.WriteLine($"GetRallyPrediction: {rallyPredictionCacheJsonString}");

        //Check if the forecast is expired
        if (DateTime.UtcNow > rallyPredictionCache.RallyPrediction.EndDate)
        {
            Console.WriteLine($"ThousandsWarning: This forecast has expired!");
            return new PredictionPriceQuote()
            {
                StageId = predictionId,
                Segment = 0,
                Prediction = new Prediction
                {
                    UserId = userId,
                    TeamName = choice.ToString(),
                    Credits = -2,
                    Price = 0.00M,
                    Timestamp = currentTimestamp
                }
            };
        }

        //Check if this forecast is already halted
        if (rallyPredictionCache.HaltedUntil != null && DateTime.UtcNow < rallyPredictionCache.HaltedUntil)
        {
            Console.WriteLine($"ThousandsWarning: Velocity level is too high, halted predictions!");
            return new PredictionPriceQuote()
            {
                StageId = predictionId,
                Segment = 0,
                Prediction = new Prediction
                {
                    UserId = userId,
                    TeamName = choice.ToString(),
                    Credits = -2,
                    Price = 0.00M,
                    Timestamp = currentTimestamp
                }
            };
        }

        //Calculate time segment
        DateTimeOffset dtoStartTime = new DateTimeOffset(rallyPredictionCache.RallyPrediction.StartDate);
        DateTimeOffset dtoEndTime = new DateTimeOffset(rallyPredictionCache.RallyPrediction.EndDate);
        Console.WriteLine($"dtoStartTime: {dtoStartTime}");
        long startTimeTimeStamp = dtoStartTime.ToUnixTimeMilliseconds();
        long endTimeTimeStamp = dtoEndTime.ToUnixTimeMilliseconds();
        long millisecondsSinceStartTime = currentTimestamp - startTimeTimeStamp;
        Console.WriteLine($"millisecondsSinceStartTime: {millisecondsSinceStartTime}");

        long timeSegment = (long)Math.Floor((decimal)millisecondsSinceStartTime / (60000.0M * NumberOfMinutesInSmallVelocityTimeSegment));
        Console.WriteLine($"timeSegment: {timeSegment}");

        //Calculate the max credits allowed in a large time period
        var maxCreditSpent = rallyPredictionCache.RallyPrediction.MaxCreditSpend;
        long millisecondsTotal = endTimeTimeStamp - startTimeTimeStamp;
        long numberOfLargeTimePeriods = (long)Math.Floor((decimal)millisecondsTotal / (60000.0M * NumberOfMinutesInLargeVelocityTimeSegment));
        var maxCreditsPerLargeTimePeriod = maxCreditSpent / numberOfLargeTimePeriods;
        if (maxCreditsPerLargeTimePeriod < 1)
        {
            maxCreditsPerLargeTimePeriod = 1;
        }
        long numberOfSmallTimePeriods = (long)Math.Floor((decimal)millisecondsTotal / (60000.0M * NumberOfMinutesInSmallVelocityTimeSegment));
        var maxCreditsPerSmallTimePeriod = maxCreditSpent / numberOfSmallTimePeriods;
        if (maxCreditsPerSmallTimePeriod < 1)
        {
            maxCreditsPerSmallTimePeriod = 1;
        }
        Console.WriteLine($"numberOfLargeTimePeriods: {numberOfLargeTimePeriods}");
        Console.WriteLine($"maxCreditsPerLargeTimePeriod: {maxCreditsPerLargeTimePeriod}");
        Console.WriteLine($"numberOfSmallTimePeriods: {numberOfSmallTimePeriods}");
        Console.WriteLine($"maxCreditsPerSmallTimePeriod: {maxCreditsPerSmallTimePeriod}");

        //Check velocity
        long velocity = await _predictionCache.GetPredictionVelocity(predictionId, timeSegment.ToString());
        Console.WriteLine($"velocity: {velocity}");

        string velocityLevel = GetVelocityLevel(velocity, maxCreditsPerSmallTimePeriod);
        Console.WriteLine($"velocityLevel: {velocityLevel}");

        int totalSpentOnOptionA = await _predictionCache.GetTotalSpent(predictionId, "False", "0");
        int totalSpentOnOptionB = await _predictionCache.GetTotalSpent(predictionId, "True", "0");
        Console.WriteLine($"ThousandsInfo: Fetched total spent on false {totalSpentOnOptionA} and true {totalSpentOnOptionB}");

        //Check if the current spending is above the linear trend line.
        bool spendingIsAboveAverage = false;
        int totalSpending = totalSpentOnOptionA + totalSpentOnOptionB;
        decimal percentOfMaxCreditsSpent = (decimal)totalSpending / (decimal)maxCreditSpent;
        long millisecondsFromStartTimeToCurrentCreditSpending = (long)percentOfMaxCreditsSpent * millisecondsTotal;
        decimal percentageOfTimeBetweenStartAndEnd = (decimal)millisecondsSinceStartTime / (decimal)millisecondsTotal;
        int averageTrendlineCreditSpendingByThisTime = (int)Math.Ceiling(percentageOfTimeBetweenStartAndEnd * (decimal)maxCreditSpent);
        Console.WriteLine($"averageTrendlineCreditSpendingByThisTime: {averageTrendlineCreditSpendingByThisTime}");
        if (totalSpending > averageTrendlineCreditSpendingByThisTime)
        {
            Console.WriteLine($"totalSpending: {totalSpending} is greater than averageTrendlineCreditSpendingByThisTime: {averageTrendlineCreditSpendingByThisTime}");
            spendingIsAboveAverage = true;
        }

        //The velocity in a small time segment is so large it exceeded the large time period, so we need to instantly halt this forecast
        if (spendingIsAboveAverage && velocity > maxCreditsPerLargeTimePeriod)
        {
            Console.WriteLine($"The velocity in a small time segment is so large it exceeded the large time period, so we need to instantly halt this forecast: {velocity} > {maxCreditsPerLargeTimePeriod}");
            //Save the Halted until time
            rallyPredictionCache.HaltedUntil = rallyPredictionCache.RallyPrediction.StartDate.AddMilliseconds(millisecondsFromStartTimeToCurrentCreditSpending);
            await _predictionCache.StoreRallyPrediction(predictionId, rallyPredictionCache);

            Console.WriteLine($"ThousandsWarning: Velocity level is too high, halted predictions until: {rallyPredictionCache.HaltedUntil}!");
            return new PredictionPriceQuote()
            {
                StageId = predictionId,
                Segment = 0,
                Prediction = new Prediction
                {
                    UserId = userId,
                    TeamName = choice.ToString(),
                    Credits = -2,
                    Price = 0.00M,
                    Timestamp = currentTimestamp
                }
            };
        }

        //Check previous time segment
        long previousTimeSegment = timeSegment - 1;
        if (spendingIsAboveAverage && previousTimeSegment >= 0)
        {
            long previousVelocity = await _predictionCache.GetPredictionVelocity(predictionId, previousTimeSegment.ToString());
            Console.WriteLine($"previous velocity: {previousVelocity}");

            //The previous segment velocity exceeded the amount for that small time segment
            if (previousVelocity > maxCreditsPerSmallTimePeriod)
            {
                Console.WriteLine(
                    $"The previous velocity in a small time segment exceeded the small time period, so we need to calculate how long to halt this forecast: {previousVelocity} > {maxCreditsPerSmallTimePeriod}");

                //Save the Halted until time
                rallyPredictionCache.HaltedUntil = rallyPredictionCache.RallyPrediction.StartDate.AddMilliseconds(millisecondsFromStartTimeToCurrentCreditSpending);

                Console.WriteLine($"HaltedUntil: {rallyPredictionCache.HaltedUntil}");

                if (DateTime.UtcNow < rallyPredictionCache.HaltedUntil)
                {
                    await _predictionCache.StoreRallyPrediction(predictionId, rallyPredictionCache);

                    Console.WriteLine(
                        $"ThousandsWarning: Velocity level is too high, halted predictions until: {rallyPredictionCache.HaltedUntil}!");
                    return new PredictionPriceQuote()
                    {
                        StageId = predictionId,
                        Segment = 0,
                        Prediction = new Prediction
                        {
                            UserId = userId,
                            TeamName = choice.ToString(),
                            Credits = -2,
                            Price = 0.00M,
                            Timestamp = currentTimestamp
                        }
                    };
                }
            }
        }

        //If this is a free prediction, we need to make sure it is your first
        if (credits < 1)
        {
            //Check if the user has already made a free prediction
            var previousPredictions = await _predictionCache.GetPersonalPredictions(predictionId, "0", userId);

            foreach (var previousPrediction in previousPredictions)
            {
                //Look for a free prediction.  Free predictions have 0 credits.
                if (previousPrediction.Credits < 1)
                {
                    Console.WriteLine($"ThousandsWarning: This user has already used their free prediction!");
                    return new PredictionPriceQuote()
                    {
                        StageId = predictionId,
                        Segment = 0,
                        Prediction = new Prediction
                        {
                            UserId = userId,
                            TeamName = choice.ToString(),
                            Credits = -4,
                            Price = 0.00M,
                            Timestamp = currentTimestamp
                        }
                    };
                }
            }
        }

        int creditBalance = await _creditBalanceRepository.GetCreditBalance(userId);
        Console.WriteLine($"ThousandsInfo: Credit Balance: {creditBalance}");
        if (creditBalance < credits)
        {
            Console.WriteLine($"ThousandsWarning: Not enough credits!");
            //The user doesn't have enough credits to complete this trade
            return new PredictionPriceQuote()
            {
                StageId = predictionId,
                Segment = 0,
                Prediction = new Prediction
                {
                    UserId = userId,
                    TeamName = choice.ToString(),
                    Credits = -1,
                    Price = 0.00M,
                    Timestamp = currentTimestamp
                }
            };
        }

        decimal price;
        //Check if total credits spent exceeds maxCreditSpend
        if (totalSpending > rallyPredictionCache.RallyPrediction.MaxCreditSpend)
        {
            //Save the Halted until time which is set to the endDate of the forecast
            rallyPredictionCache.HaltedUntil = rallyPredictionCache.RallyPrediction.EndDate;
            await _predictionCache.StoreRallyPrediction(predictionId, rallyPredictionCache);

            Console.WriteLine($"ThousandsWarning: Velocity level is too high, halted predictions until: {rallyPredictionCache.HaltedUntil}!");
            return new PredictionPriceQuote()
            {
                StageId = predictionId,
                Segment = 0,
                Prediction = new Prediction
                {
                    UserId = userId,
                    TeamName = choice.ToString(),
                    Credits = -2,
                    Price = 0.00M,
                    Timestamp = currentTimestamp
                }
            };
        }

        totalSpentOnOptionA += StartingSpendPerTeam;
        totalSpentOnOptionB += StartingSpendPerTeam;

        int totalSpent = totalSpentOnOptionA + totalSpentOnOptionB;

        if (!choice)
        {
            price = Math.Round((decimal)totalSpentOnOptionA / totalSpent, 2);
        }
        else
        {
            price = Math.Round((decimal)totalSpentOnOptionB / totalSpent, 2);
        }

        var newPredictionPriceQuote = new PredictionPriceQuote()
        {
            StageId = predictionId,
            Segment = 0,
            TimeSegment = timeSegment.ToString(),
            Prediction = new Prediction
            {
                UserId = userId,
                TeamName = choice.ToString(),
                Credits = credits,
                Price = price,
                Timestamp = currentTimestamp
            }
        };

        //Modified the following method to remove all existing price quotes for the user before storing the new price quote
        bool success = await _predictionCache.StorePredictionPriceQuote(userId, newPredictionPriceQuote);
        if (success)
        {
            Console.WriteLine($"ThousandsInfo: Stored prediction price quote to db");
            return newPredictionPriceQuote;
        }

        Console.WriteLine($"ThousandsInfo: Unable to store prediction price quote to db");
        //There was an error storing the prediction price quote
        return new PredictionPriceQuote()
        {
            StageId = predictionId,
            Segment = 0,
            Prediction = new Prediction
            {
                UserId = userId,
                TeamName = choice.ToString(),
                Credits = -1,
                Price = 0.00M,
                Timestamp = currentTimestamp
            }
        };
    }

    public async Task<ConfirmPredictionResult> ConfirmPrediction(Guid predictionPriceQuoteGuid, string userId, string teamName, int credits, string stageId)
    {
        var predictionPriceQuote = await _predictionCache.GetPredictionPriceQuote(userId, predictionPriceQuoteGuid);

        if (predictionPriceQuote == null)
        {
            Console.WriteLine($"ThousandsWarning: Price quote has expired for {userId}");

            var newPredictionPriceQuote = await GetPriceQuote(userId, teamName, credits, stageId);

            return new ConfirmPredictionResult
            {
                WasOrderPlaced = false,
                UpdatedCreditBalance = -1,
                PriceQuote = newPredictionPriceQuote
            };
        }

        //Remove price quote so it can't be used twice
        await _predictionCache.RemovePriceQuote(userId);

        //Get values from predictionPriceQuote
        var storedStageId = predictionPriceQuote.StageId;
        var storedSegment = predictionPriceQuote.Segment;
        var storedUserId = predictionPriceQuote.Prediction.UserId;
        var storedCredits = predictionPriceQuote.Prediction.Credits;
        var storedTeamName = predictionPriceQuote.Prediction.TeamName;
        var storedPrice = predictionPriceQuote.Prediction.Price;
        var storedTimestamp = predictionPriceQuote.Prediction.Timestamp;
        string? skyboxId = null;
        int? skyboxTier = null;

        //Check to see if the user is in a skybox and get the skyboxId and skyboxTier
        var skybox = await _skyboxCache.GetSkyboxIdFromUserId(stageId, storedUserId);
        if (skybox != null)
        {
            skyboxId = skybox.SkyboxId;
            skyboxTier = skybox.SkyboxTier;
        }

        try
        {
            //Check credits
            int creditBalance = await _creditBalanceRepository.GetCreditBalance(userId);
            Console.WriteLine($"ThousandsInfo: Credit Balance: {creditBalance} for userId: {userId}");
            if (creditBalance < storedCredits)
            {
                Console.WriteLine($"ThousandsWarning: Not enough credits for {userId}!");

                //The user doesn't have enough credits to complete this trade
                return new ConfirmPredictionResult
                {
                    WasOrderPlaced = false,
                    UpdatedCreditBalance = -1
                };
            }

            var newPrediction = new Prediction
            {
                UserId = storedUserId,
                Credits = storedCredits,
                TeamName = storedTeamName,
                Price = storedPrice,
                Timestamp = storedTimestamp,
                SkyboxId = skyboxId,
                SkyboxTier = skyboxTier
            };

            try
            {
                var addPersonalPredictionTask =
                    _predictionCache.AddPersonalPrediction(storedStageId, storedSegment.ToString(), newPrediction);
                var addSharedPredictionTask =
                    _predictionCache.AddSharedPrediction(storedStageId, storedSegment.ToString(), newPrediction);

                Task.WaitAll(addPersonalPredictionTask, addSharedPredictionTask);
            }
            catch (Exception ex) //If there is an error trying to connect to redis to save the prediction, then just issue a new price quote
            {
                Console.WriteLine($"ThousandsError: Failed to add prediction to Redis! - {ex.Message}");

                var newPredictionPriceQuote = await GetPriceQuote(userId, teamName, credits, stageId);

                return new ConfirmPredictionResult
                {
                    WasOrderPlaced = false,
                    UpdatedCreditBalance = -1,
                    PriceQuote = newPredictionPriceQuote
                };
            }

            Console.WriteLine($"ThousandsInfo: Successfully added prediction for: {userId}");

            //Spend credits
            //UpdateCreditBalance is actually increment (0 - (int)storedPrice) is the amount to decrease credits
            await _creditBalanceRepository.UpdateCreditBalance(userId, 0 - (int)storedCredits);

            //credits left is equal to the credit balance minus the price
            int creditsLeft = creditBalance - (int)storedCredits;

            Console.WriteLine($"ThousandsInfo: UserId: {userId}  Beginning balance: {creditBalance}  Deducted {0 - (int)storedCredits}  New balance is: {creditsLeft}");

            //Send message to aggregation queue
            await _predictionCache.IncrementTotalSpent(storedStageId, storedTeamName, storedSegment.ToString(), storedCredits);

            ConfirmPredictionResult confirmPredictionResult = new ConfirmPredictionResult()
            {
                WasOrderPlaced = true,
                UpdatedCreditBalance = creditsLeft,
                Prediction = newPrediction
            };

            Console.WriteLine($"ThousandsInfo: New credit balance after deduction: {creditsLeft}");

            return confirmPredictionResult;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"ThousandsError: Unknown Exception! - {ex.Message}");

            var newPredictionPriceQuote = await GetPriceQuote(userId, teamName, credits, stageId);

            return new ConfirmPredictionResult
            {
                WasOrderPlaced = false,
                UpdatedCreditBalance = -1,
                PriceQuote = newPredictionPriceQuote
            };
        }
    }

    public async Task<ConfirmPredictionResult> ConfirmPrediction(Guid predictionPriceQuoteGuid, string userId, bool choice,
        int credits, string predictionId)
    {
        var predictionPriceQuote = await _predictionCache.GetPredictionPriceQuote(userId, predictionPriceQuoteGuid);

        if (predictionPriceQuote == null)
        {
            Console.WriteLine($"ThousandsWarning: Price quote has expired for {userId}");

            var newPredictionPriceQuote = await GetPriceQuote(userId, choice, credits, predictionId);

            return new ConfirmPredictionResult
            {
                WasOrderPlaced = false,
                UpdatedCreditBalance = -1,
                PriceQuote = newPredictionPriceQuote
            };
        }

        //Remove price quote so it can't be used twice
        await _predictionCache.RemovePriceQuote(userId);

        //Get values from predictionPriceQuote
        var storedStageId = predictionPriceQuote.StageId;
        var storedSegment = predictionPriceQuote.Segment;
        var storedTimeSegment = predictionPriceQuote.TimeSegment ?? "0";
        var storedUserId = predictionPriceQuote.Prediction.UserId;
        var storedCredits = predictionPriceQuote.Prediction.Credits;
        var storedTeamName = predictionPriceQuote.Prediction.TeamName;
        var storedPrice = predictionPriceQuote.Prediction.Price;
        var storedTimestamp = predictionPriceQuote.Prediction.Timestamp;

        bool optionAorOptionB = bool.Parse(storedTeamName);
        
        try
        {
            //Check credits
            int creditBalance = await _creditBalanceRepository.GetCreditBalance(userId);
            Console.WriteLine($"ThousandsInfo: Credit Balance: {creditBalance} for userId: {userId}");
            if (creditBalance < storedCredits)
            {
                Console.WriteLine($"ThousandsWarning: Not enough credits for {userId}!");

                //The user doesn't have enough credits to complete this trade
                return new ConfirmPredictionResult
                {
                    WasOrderPlaced = false,
                    UpdatedCreditBalance = -1
                };
            }

            var newPrediction = new Prediction
            {
                UserId = storedUserId,
                Credits = storedCredits,
                TeamName = storedTeamName,
                Price = storedPrice,
                Timestamp = storedTimestamp,
            };

            //Lookup prediction to get start time
            RallyPredictionCache? rallyPredictionCache = await _predictionCache.GetRallyPrediction(predictionId);

            string rallyPredictionCacheJsonString = JsonSerializer.Serialize(rallyPredictionCache);
            Console.WriteLine($"GetRallyPrediction from cache: {rallyPredictionCacheJsonString}");

            //This should never happen
            if (rallyPredictionCache == null)
            {
                //The rally prediction hasn't been cached in Redis.  This should be impossible.
                return new ConfirmPredictionResult
                {
                    WasOrderPlaced = false,
                    UpdatedCreditBalance = -2
                };
            }

            //Get new price after this is confirmed
            decimal newPriceAfterConfirmed;
            int totalSpentOnOptionA = await _predictionCache.GetTotalSpent(predictionId, "False", "0");
            int totalSpentOnOptionB = await _predictionCache.GetTotalSpent(predictionId, "True", "0");
            Console.WriteLine($"ThousandsInfo: Fetched total spent on false {totalSpentOnOptionA} and true {totalSpentOnOptionB}");
            totalSpentOnOptionA += StartingSpendPerTeam;
            totalSpentOnOptionB += StartingSpendPerTeam;

            if (storedTeamName == "False")
            {
                totalSpentOnOptionA += storedCredits;
            }
            else
            {
                totalSpentOnOptionB += storedCredits;
            }

            int totalSpent = totalSpentOnOptionA + totalSpentOnOptionB;

            newPriceAfterConfirmed = Math.Round((decimal)totalSpentOnOptionA / totalSpent, 2);

            var newUserRallyPrediction = new UserRallyPrediction
            {
                Id = ObjectId.GenerateNewId(),
                UserId = ObjectId.Parse(storedUserId),
                RallyPredictionId = ObjectId.Parse(storedStageId),
                Amount = storedCredits,
                Price = (double)storedPrice,
                ForOrAgainst = optionAorOptionB,
                QuestionText = rallyPredictionCache.RallyPrediction.Title,
                SelectedOptionText = (!optionAorOptionB ? rallyPredictionCache.RallyPrediction.OptionAText : rallyPredictionCache.RallyPrediction.OptionBText),
                SelectedOptionColor = (!optionAorOptionB ? rallyPredictionCache.RallyPrediction.OptionAButtonColor : rallyPredictionCache.RallyPrediction.OptionBButtonColor),
                Version = 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var newPredictionChartData = new PredictionChartData
            {
                Id = ObjectId.GenerateNewId(),
                RallyPredictionId = ObjectId.Parse(storedStageId),
                Timestamp = DateTime.UtcNow,
                Price = (double)newPriceAfterConfirmed,
                Version = 0
            };

            try
            {
                var addPersonalPredictionTask =
                    _predictionCache.AddPersonalPrediction(storedStageId, storedSegment.ToString(), newPrediction);
                var addSharedPredictionTask =
                    _predictionCache.AddSharedPrediction(storedStageId, storedSegment.ToString(), newPrediction);
                var incrementPredictionVelocityTask =
                    _predictionCache.IncrementPredictionVelocity(predictionId, storedTimeSegment, storedCredits);
                var addUserRallyPredictionTask =
                    _rallyPredictionRepository.AddUserRallyPrediction(newUserRallyPrediction);

                Task.WaitAll(addPersonalPredictionTask, addSharedPredictionTask, incrementPredictionVelocityTask, addUserRallyPredictionTask);
            }
            catch (Exception ex) //If there is an error trying to connect to redis to save the prediction, then just issue a new price quote
            {
                Console.WriteLine($"ThousandsError: Failed to add prediction to Redis! - {ex.Message}");

                var newPredictionPriceQuote = await GetPriceQuote(userId, choice, credits, predictionId);

                return new ConfirmPredictionResult
                {
                    WasOrderPlaced = false,
                    UpdatedCreditBalance = -1,
                    PriceQuote = newPredictionPriceQuote
                };
            }

            Console.WriteLine($"ThousandsInfo: Successfully added prediction for: {userId}");

            //Spend credits
            //UpdateCreditBalance is actually increment (0 - (int)storedPrice) is the amount to decrease credits
            await _creditBalanceRepository.UpdateCreditBalance(userId, 0 - (int)storedCredits);

            //credits left is equal to the credit balance minus the price
            int creditsLeft = creditBalance - (int)storedCredits;

            Console.WriteLine($"ThousandsInfo: UserId: {userId}  Beginning balance: {creditBalance}  Deducted {0 - (int)storedCredits}  New balance is: {creditsLeft}");

            //Send message to aggregation queue
            await _predictionCache.IncrementTotalSpent(storedStageId, storedTeamName, storedSegment.ToString(), storedCredits);

            //Update the chart data
            await _rallyPredictionRepository.AddPredictionChartData(newPredictionChartData);

            ConfirmPredictionResult confirmPredictionResult = new ConfirmPredictionResult()
            {
                WasOrderPlaced = true,
                UpdatedCreditBalance = creditsLeft,
                Prediction = newPrediction
            };

            Console.WriteLine($"ThousandsInfo: New credit balance after deduction: {creditsLeft}");

            return confirmPredictionResult;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"ThousandsError: Unknown Exception! - {ex.Message}");

            var newPredictionPriceQuote = await GetPriceQuote(userId, choice, credits, predictionId);

            return new ConfirmPredictionResult
            {
                WasOrderPlaced = false,
                UpdatedCreditBalance = -1,
                PriceQuote = newPredictionPriceQuote
            };
        }
    }

    public async Task<PredictionStats> GetPrediction(string predictionId)
    {
        DateTimeOffset dto = new DateTimeOffset(DateTime.UtcNow);
        long currentTimestamp = dto.ToUnixTimeMilliseconds();

        int totalSpentOnOptionA = await _predictionCache.GetTotalSpent(predictionId, "False", "0") + StartingSpendPerTeam;
        int totalSpentOnOptionB = await _predictionCache.GetTotalSpent(predictionId, "True", "0") + StartingSpendPerTeam;

        //Lookup prediction to get start time
        RallyPredictionCache? rallyPredictionCache = await _predictionCache.GetRallyPrediction(predictionId);

        Console.WriteLine($"GetRallyPrediction from cache: {rallyPredictionCache}");

        DateTime? haltedUntil = null;
        string velocityLevel = "Low";
        long startTimeTimestamp = 0;
        decimal percentageOfTimeBetweenStartAndEnd = 0.0M;
        if (rallyPredictionCache != null)
        {
            //Calculate time segment
            DateTimeOffset dtoStartTime = new DateTimeOffset(rallyPredictionCache.RallyPrediction.StartDate);
            Console.WriteLine($"dtoStartTime: {dtoStartTime}");
            DateTimeOffset dtoEndTime = new DateTimeOffset(rallyPredictionCache.RallyPrediction.EndDate);
            Console.WriteLine($"dtoEndTime: {dtoEndTime}");
            startTimeTimestamp = dtoStartTime.ToUnixTimeMilliseconds();
            long endTimeTimestamp = dtoEndTime.ToUnixTimeMilliseconds();
            long millisecondsSinceStartTime = currentTimestamp - startTimeTimestamp;
            long totalMillisecondsBetweenStartAndEnd = endTimeTimestamp - startTimeTimestamp;
            Console.WriteLine($"millisecondsSinceStartTime: {millisecondsSinceStartTime}");
            Console.WriteLine($"totalMillisecondsBetweenStartAndEnd: {totalMillisecondsBetweenStartAndEnd}");
            var maxCreditSpent = rallyPredictionCache.RallyPrediction.MaxCreditSpend;

            long millisecondsTotal = endTimeTimestamp - startTimeTimestamp;
            //long numberOfLargeTimePeriods = (long)Math.Floor((decimal)millisecondsTotal / (60000.0M * NumberOfMinutesInLargeVelocityTimeSegment));
            //var maxCreditsPerLargeTimePeriod = maxCreditSpent / numberOfLargeTimePeriods;
            long numberOfSmallTimePeriods = (long)Math.Floor((decimal)millisecondsTotal / (60000.0M * NumberOfMinutesInSmallVelocityTimeSegment));
            var maxCreditsPerSmallTimePeriod = maxCreditSpent / numberOfSmallTimePeriods;
            if (maxCreditsPerSmallTimePeriod < 1)
            {
                maxCreditsPerSmallTimePeriod = 1;
            }

            long timeSegment = (long)Math.Floor((decimal)millisecondsSinceStartTime / (60000.0M * NumberOfMinutesInSmallVelocityTimeSegment));
            Console.WriteLine($"timeSegment: {timeSegment}");

            //Check velocity
            long velocity = await _predictionCache.GetPredictionVelocity(predictionId, timeSegment.ToString());
            Console.WriteLine($"velocity: {velocity}");

            velocityLevel = GetVelocityLevel(velocity, maxCreditsPerSmallTimePeriod);
            Console.WriteLine($"velocityLevel: {velocityLevel}");

            percentageOfTimeBetweenStartAndEnd = (decimal)millisecondsSinceStartTime / (decimal)totalMillisecondsBetweenStartAndEnd;
            haltedUntil = rallyPredictionCache.HaltedUntil;
            if (haltedUntil != null && DateTime.UtcNow < haltedUntil)
            {
                velocityLevel = "Halted";
            }

            Console.WriteLine($"totalSpentOnOptionA: {totalSpentOnOptionA}");
            Console.WriteLine($"totalSpentOnOptionB: {totalSpentOnOptionB}");
            Console.WriteLine($"StartingSpendPerTeam: {StartingSpendPerTeam}");
            Console.WriteLine($"maxCreditSpent: {maxCreditSpent}");
            var totalCreditsSpent = (totalSpentOnOptionA + totalSpentOnOptionB) - (StartingSpendPerTeam * 2);
            Console.WriteLine($"totalCreditsSpent: {totalCreditsSpent}");
            if (totalCreditsSpent > maxCreditSpent)
            {
                Console.WriteLine($"totalCreditsSpent > maxCreditSpent");
                haltedUntil = rallyPredictionCache.RallyPrediction.EndDate;
                velocityLevel = "Halted";
            }
        }

        return new PredictionStats
        {
            TotalOptionA = totalSpentOnOptionA,
            TotalOptionB = totalSpentOnOptionB,
            TimingFactor = percentageOfTimeBetweenStartAndEnd,
            ActivityLevel = velocityLevel,
            StartTimestamp = startTimeTimestamp,
            HaltedUntil = haltedUntil
        };
    }

    public async Task<SuccessAndErrorMessage> SetWinner(string stageId, int segment, string teamName)
    {
        //Get stage - don't use incoming segment
        Models.Stage? stage;
        try
        {
            stage = await _streamRepository.GetStage(stageId);
            if (stage == null)
            {
                Console.WriteLine($"ThousandsWarning: Stage does not exist: stageId {stageId}");
                return new SuccessAndErrorMessage
                {
                    Success = false,
                    ErrorMessage = "Stage does not exist!"
                };
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"ThousandsError: Failed to fetch stage for stageId {stageId}, Error: {ex.Message}");
            return new SuccessAndErrorMessage
            {
                Success = false,
                ErrorMessage = "Failed to fetch stage!"
            };
        }

        if (!stage.CurrentSegment.HasValue)
        {
            Console.WriteLine($"ThousandsWarning: Stage is missing currentSegment.  Winner not set!");
            return new SuccessAndErrorMessage
            {
                Success = false,
                ErrorMessage = "Stage is missing currentSegment!"
            };
        }

        //Check to make sure we don't have an active Rally open
        var eventMatch = await _idleGameRepository.GetEventMatchFromStageId(stageId);
        if (eventMatch != null)
        {
            Console.WriteLine($"ThousandsWarning: Found an active rally.  Can't set the winner!");
            return new SuccessAndErrorMessage
            {
                Success = false,
                ErrorMessage = "A rally is still active.  Hide the rally before setting the winner!"
            };
        }

        var vendorEventId = stage.BeamableEventId;
        segment = (int)stage.CurrentSegment;

        //Check to make sure the currentSegment hasn't already been used.  We do this by checking the boosts-segments collection in MongoDB for a document with the same value.
        var boostSegment = await _boostRepository.GetBoosts(stageId, segment);

        //If there is already a boosts-segments document for this stageId and segment, then we cannot start the rallies
        if (boostSegment != null)
        {
            Console.WriteLine($"ThousandsWarning: There is already a boosts-segments document for this stageId and segment.  Winner not set!");
            return new SuccessAndErrorMessage
            {
                Success = false,
                ErrorMessage = "There is already a boosts-segments document for this stageId and segment.  Winner not set!"
            };
        }

        var predictions = await _predictionCache.GetSharedPredictions(stageId, segment.ToString());

        //Check to make sure there are predictions.  If there aren't any, don't continue.
        if (predictions.Count < 1)
        {
            Console.WriteLine($"ThousandsWarning: There are no predictions to process.  Winner not set!");
            return new SuccessAndErrorMessage
            {
                Success = false,
                ErrorMessage = "There are no predictions to process.  Winner not set!"
            };
        }

        Console.WriteLine($"ThousandsInfo: Number of predictions to process: {predictions.Count}");

        List<Boost> boosts = new List<Boost>();
        foreach (var prediction in predictions)
        {
            Boost boost = new Boost
            {
                StageId = stageId,
                UserId = prediction.UserId,
                BoostType = prediction.TeamName,
                BoostPrice = prediction.Credits,
                BoostAmount = 0,
                SkyboxId = prediction.SkyboxId,
                SkyboxTier = prediction.SkyboxTier,
                Timestamp = prediction.Timestamp
            };

            //If this prediction matches the winning team
            if (prediction.TeamName.ToUpper() == teamName.ToUpper())
            {
                boost.BoostAmount = (int)Math.Ceiling((decimal)prediction.Credits * (1.0M / prediction.Price));
            }

            boosts.Add(boost);
        }

        //Add Boosts
        try
        {
            Console.WriteLine($"ThousandsInfo: Writing {boosts.Count} boosts");
            await _boostRepository.AddBoosts(stageId, segment, boosts.ToArray());
        }
        catch (Exception ex)
        {
            Console.WriteLine($"ThousandsError: Failed to write boosts: {ex.Message.ToString()}");
            return new SuccessAndErrorMessage
            {
                Success = false,
                ErrorMessage = "Failed to write boosts!"
            };
        }

        //Update leaderboard with boosts (this method takes raw boosts and adds the GoldenRatio)
        await _leaderboardService.IncrementScores(stageId, boosts);

        //This dictionary is used to aggregate skybox owner bonuses (bonus from other members plus the bonus for purchasing in the segment it was purchased)
        var skyboxOwnerBonuses = new Dictionary<string, int>();

        //Get a list of all skyboxes for this stageId
        var skyboxes = await _skyboxRepository.GetAllSkyboxesByStageId(stageId);

        if (skyboxes.Count > 0)
        {
            Console.WriteLine("skyboxes: " + JsonSerializer.Serialize(skyboxes));

            //Calculate points per skybox from the boosts for this segment - this returns raw data without the GoldenRatio
            var skyboxPointsList = GetSkyboxSpendAndPredictionBonusFromBoostsExcludeOwners(boosts, skyboxes);

            Console.WriteLine("skyboxPointsList: " + JsonSerializer.Serialize(skyboxPointsList));

            //Update the leaderboard with skybox owner bonuses
            foreach (var skybox in skyboxes)
            {
                string ownerUserId = skybox.OwnerUserId;

                var foundSkyboxPoints = skyboxPointsList.Find(x => x.SkyboxIdAndTier.SkyboxId == skybox.IdString);
                if (foundSkyboxPoints != null)
                {
                    //Calculate the total points with GoldenRatio and skybox member bonus for the skybox
                    decimal skyboxTotalPointsWithGoldenRatioAndSkyboxMemberBonus =
                        (foundSkyboxPoints.CreditsSpent + foundSkyboxPoints.PredictionBonus) * 1.1M * GoldenRatio;

                    //10% of the total points from a skybox go back to the owner
                    int skyboxOwnerBonus = (int)Math.Ceiling(skyboxTotalPointsWithGoldenRatioAndSkyboxMemberBonus * 0.1M);

                    skyboxOwnerBonuses.Add(ownerUserId, skyboxOwnerBonus);

                    Console.WriteLine($"Adding points for skybox owner bonus - OwnerUserId: {ownerUserId} - Points: {skyboxOwnerBonus}");
                    await _leaderboardService.IncrementScore(stageId, ownerUserId, skyboxOwnerBonus);
                }
            }
        }


        //Get skybox purchases for this stageId and segment
        var skyboxPurchases = await _creditBalanceRepository.GetSkyboxPurchaseCreditTransactions(stageId, segment);

        Console.WriteLine("skyboxPurchases: " + JsonSerializer.Serialize(skyboxPurchases));

        //If we have at least one skybox purchase credit transaction
        if (skyboxPurchases.Count > 0)
        {
            //Update the Scores with points for the credit purchases
            foreach (CreditTransaction skyboxPurchaseCreditTransaction in skyboxPurchases)
            {
                if (skyboxPurchaseCreditTransaction.SkyboxTier == null)
                {
                    Console.WriteLine($"ThousandsWarning: Skipping skybox credit purchase transaction for: {skyboxPurchaseCreditTransaction.UserId} because skyboxTier is null!");
                    continue;
                }

                //Skybox purchase points is equal to the cost of the skybox multiplied by the 10% skybox bonus multiplied by the GoldenRatio
                int skyboxPurchasePoints = (int)Math.Ceiling((decimal)(0 - skyboxPurchaseCreditTransaction.Amount) * 1.1M * GoldenRatio);
                string userId = skyboxPurchaseCreditTransaction.UserId.ToString() ?? "";

                if (skyboxOwnerBonuses.ContainsKey(userId))
                {
                    skyboxOwnerBonuses[userId] += skyboxPurchasePoints;
                }
                else
                {
                    skyboxOwnerBonuses.Add(userId, skyboxPurchasePoints);
                }

                Console.WriteLine($"Adding points for credit purchase transaction - Points: {skyboxPurchasePoints}");
                await _leaderboardService.IncrementScore(stageId, userId, skyboxPurchasePoints);
            }
        }

        //Get leaderboard
        var leaders = await GetLeaders(stageId);

        //Send leaderboard push message
        BoostSignalMessage scoreBoostSignalMessage = new BoostSignalMessage
        {
            BoostEventType = "SetWinner",
            EventId = stageId,
            Leaders = leaders
        };
        Console.WriteLine(JsonSerializer.Serialize(scoreBoostSignalMessage));
        string boostSignalMessageString = JsonSerializer.Serialize(scoreBoostSignalMessage);

        Console.WriteLine(boostSignalMessageString);

        bool sendMessageSuccess = await _websocketService.SendMessageSignalToPlatformClient($"s.{scoreBoostSignalMessage.EventId}", "system",
            boostSignalMessageString);

        //Send push message to Twitch Leaderboard control with top ten users
        var topTenLeaders = leaders.Slice(0, 10);
        List<Leader> topTenLeadersWithUserNamesAndPfps = new List<Leader>();

        //Get pfpUrl's and usernames for each of the top ten
        foreach (var topTenLeader in topTenLeaders)
        {
            //GetFanInTheStands
            var fan = await _fanVisibilityService.GetFanInTheStands(vendorEventId, topTenLeader.UserId);
            if (fan != null)
            {
                Console.WriteLine(fan.FanName + " | " + fan.FanPfpUrl);
                topTenLeader.UserName = fan.FanName;
                topTenLeader.PfpUrl = fan.FanPfpUrl;
            }

            if (string.IsNullOrEmpty(topTenLeader.UserName))
            {
                topTenLeader.UserName = "Anonymous";
            }
            if (string.IsNullOrEmpty(topTenLeader.PfpUrl))
            {
                topTenLeader.PfpUrl = "https://www.thousands.tv/images/WildfileAssets/silhoutte.webp";
            }

            topTenLeadersWithUserNamesAndPfps.Add(topTenLeader);
        }

        BoostSignalMessage topTenBoostSignalMessage = new BoostSignalMessage
        {
            BoostEventType = "SetWinner",
            EventId = stageId,
            Leaders = topTenLeadersWithUserNamesAndPfps
        };
        string topTenBoostSignalMessageString = JsonSerializer.Serialize(topTenBoostSignalMessage);

        bool topTenSendMessageSuccess = await _websocketService.SendMessageSignalToPlatformClient($"leaderboard-overlay-channel", "system",
            topTenBoostSignalMessageString);

        Console.Write("topTenBoostSignalMessageString: " + topTenBoostSignalMessageString);


        //Notify all users
        string capitalizedTeamName = char.ToUpper(teamName[0]) + teamName.Substring(1);

        try
        {
            // Send message to everyone: Rally Completed
            string rallyCompletedMsg = $"RALLY COMPLETE!  {capitalizedTeamName} wins!  Thanks for participating!";
            Channel channel = stage.Channels.First();
            string channelId = channel.Id.ToString();
            await _websocketService.SendChatToPlatformClient($"g.{stageId}.{channelId}", "system", rallyCompletedMsg);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"ThousandsError: Failed to send Rally Complete message: {ex.Message}");
        }

        //Notify individual users
        try
        {
            Dictionary<string, UserTotal> userTotals = GetUserTotalsFromPredictions(predictions);

            foreach (var item in userTotals)
            {
                string userId = item.Key;
                int creditsSpent = item.Value.CreditsSpentOnRed + item.Value.CreditsSpentOnBlue;
                int creditsSpentOnWinningTeam =
                    (teamName == "red" ? item.Value.CreditsSpentOnRed : item.Value.CreditsSpentOnBlue);

                decimal averagePurchasePriceWinningTeam = (teamName == "red" ? item.Value.AveragePurchasePriceRed : item.Value.AveragePurchasePriceBlue);

                int basePoints = (int)Math.Round(creditsSpent * GoldenRatio);
                int bonusPoints = 0;
                if (averagePurchasePriceWinningTeam > 0)
                {
                    bonusPoints = (int)Math.Round((decimal)creditsSpentOnWinningTeam * (1.0M / averagePurchasePriceWinningTeam) * GoldenRatio);
                }

                int skyboxBonusPoints = 0;

                if (skyboxOwnerBonuses.TryGetValue(userId, out int skyboxOwnerBonus))
                {
                    skyboxBonusPoints = skyboxOwnerBonus;
                }

                //If the user is in a skybox they get 10% bonus on basePoints + bonusPoints
                if (IsUserInSkybox(userId, skyboxes))
                {
                    skyboxBonusPoints += (int)Math.Ceiling((basePoints + bonusPoints) * 0.1M);
                }

                int userPoints = basePoints + bonusPoints + skyboxBonusPoints;

                string message = $"Congratulations! The referees recorded your rallies for {creditsSpent} credits.  You scored {userPoints} points! (base: {basePoints} + bonus: {bonusPoints})";

                if (skyboxBonusPoints > 0)
                {
                    message =
                        $"Congratulations! The referees recorded your rallies for {creditsSpent} credits.  You scored {userPoints} points! (base: {basePoints} + bonus: {bonusPoints} + skybox bonus: {skyboxBonusPoints})";
                }

                var tokenRewardMessage = new TokenRewardMessage
                {
                    Message = message
                };
                var skyboxSignalMessage = new SkyboxSignalMessage<TokenRewardMessage>
                {
                    Data = tokenRewardMessage,
                    Type = MessageType.Message.ToString()
                };
                string skyboxSignalMessageString = JsonSerializer.Serialize(skyboxSignalMessage);

                await _websocketService.SendMessageSignalToPlatformClient($"u.{item.Key}", "system", skyboxSignalMessageString);
            }

            try
            {
                //Loop through all the skybox owners with a bonus
                foreach (var skyboxOwnerBonus in skyboxOwnerBonuses)
                {
                    string ownerUserId = skyboxOwnerBonus.Key;
                    if (!userTotals.ContainsKey(ownerUserId))
                    {
                        string message = $"Congratulations!  Your skybox bonus earned you {skyboxOwnerBonus.Value} points.";

                        var tokenRewardMessage = new TokenRewardMessage
                        {
                            Message = message
                        };
                        var skyboxSignalMessage = new SkyboxSignalMessage<TokenRewardMessage>
                        {
                            Data = tokenRewardMessage,
                            Type = MessageType.Message.ToString()
                        };
                        string skyboxSignalMessageString = JsonSerializer.Serialize(skyboxSignalMessage);

                        await _websocketService.SendMessageSignalToPlatformClient($"u.{ownerUserId}", "system", skyboxSignalMessageString);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ThousandsError: Failed to notify individual users of their skybox bonus (no rallies): {ex.Message}");
            }
            
        }
        catch (Exception ex)
        {
            Console.WriteLine($"ThousandsError: Failed to notify individual users: {ex.Message}");
        }

        return new SuccessAndErrorMessage
        {
            Success = true,
            ErrorMessage = ""
        };
    }

    public async Task<List<Leader>> GetLeaders(string eventId)
    {
        var allScores = await _leaderboardService.GetAllScores(eventId);

        List<Leader> leaders = new List<Leader>();
        foreach (var score in allScores)
        {
            var leaderToAdd = new Leader
            {
                Rank = score.Rank,
                UserId = score.UserId,
                Score = score.Score,
            };
            leaders.Add(leaderToAdd);
        }

        return leaders;
    }

    public Dictionary<string, UserTotal> GetUserTotalsFromPredictions(List<Prediction> predictions)
    {
        Dictionary<string, UserTotal> userTotals = new Dictionary<string, UserTotal>();
        foreach (var prediction in predictions)
        {
            int creditsSpentOnRed = 0;
            int creditsSpentOnBlue = 0;
            decimal averagePurchasePriceRed = 0;
            decimal averagePurchasePriceBlue = 0;
            if (userTotals.TryGetValue(prediction.UserId, out var userTotal))
            {
                creditsSpentOnRed = userTotal.CreditsSpentOnRed;
                creditsSpentOnBlue = userTotal.CreditsSpentOnBlue;
                averagePurchasePriceRed = userTotal.AveragePurchasePriceRed;
                averagePurchasePriceBlue = userTotal.AveragePurchasePriceBlue;
            }

            if (prediction.TeamName == "red")
            {
                decimal previousShares = (averagePurchasePriceRed > 0 && creditsSpentOnRed > 0 ? (decimal)creditsSpentOnRed / averagePurchasePriceRed : 0);
                decimal newShares = (decimal)prediction.Credits / prediction.Price;
                creditsSpentOnRed += prediction.Credits;
                averagePurchasePriceRed = creditsSpentOnRed / (decimal)(previousShares + newShares);
            }
            else
            {
                decimal previousShares = (averagePurchasePriceBlue > 0 && creditsSpentOnBlue > 0 ? (decimal)creditsSpentOnBlue / averagePurchasePriceBlue : 0);
                decimal newShares = (decimal)prediction.Credits / prediction.Price;
                creditsSpentOnBlue += prediction.Credits;
                averagePurchasePriceBlue = creditsSpentOnBlue / (decimal)(previousShares + newShares);
            }

            UserTotal newUserTotal = new UserTotal
            {
                CreditsSpentOnRed = creditsSpentOnRed,
                CreditsSpentOnBlue = creditsSpentOnBlue,
                AveragePurchasePriceRed = averagePurchasePriceRed,
                AveragePurchasePriceBlue = averagePurchasePriceBlue
            };

            //Overwrite with updated values
            userTotals[prediction.UserId] = newUserTotal;
        }

        Console.WriteLine(JsonSerializer.Serialize(userTotals));

        return userTotals;
    }

    public async Task<SharedAveragePoints> GetSharedAveragePoints(string stageId, string segment)
    {
        List<Prediction> predictions = await _predictionCache.GetSharedPredictions(stageId, segment);

        return CalculateSharedAveragePoints(predictions);
    }

    private SharedAveragePoints CalculateSharedAveragePoints(List<Prediction> predictions)
    {
        int totalUniqueUserCount = predictions.Select(p => p.UserId).Distinct().Count();

        Console.WriteLine($"user count: {totalUniqueUserCount}");

        decimal averagePointsRed = 0.00M;
        decimal averagePointsBlue = 0.00M;
        // Take care of division by 0
        if (totalUniqueUserCount > 0)
        {
            decimal totalPointsRed = 0.00M;
            decimal totalPointsBlue = 0.00M;
            foreach (Prediction prediction in predictions)
            {
                decimal points = prediction.Credits * (1 / prediction.Price);
                if (prediction.TeamName.Equals("red"))
                {
                    totalPointsRed += points;
                }
                else if (prediction.TeamName.Equals("blue"))
                {
                    totalPointsBlue += points;
                }
            }
            averagePointsRed = Math.Round(totalPointsRed, 1); //Math.Round(totalPointsRed / (decimal)totalUniqueUserCount, 1);
            averagePointsBlue = Math.Round(totalPointsBlue, 1); //Math.Round(totalPointsBlue / (decimal)totalUniqueUserCount, 1);
        }

        return new SharedAveragePoints()
        {
            RedTeamAveragePoints = averagePointsRed,
            BlueTeamAveragePoints = averagePointsBlue,
            TotalUniqueUserCount = totalUniqueUserCount,
        };
    }

    //Returns a list of SkyboxPoints that only contains skyboxes that had spending.  The owners are excluded from the point totals per skybox.
    private List<SkyboxPoints> GetSkyboxSpendAndPredictionBonusFromBoostsExcludeOwners(List<Boost> boosts, List<Skybox> skyboxes)
    {
        List<SkyboxPoints> skyboxPointsList = new List<SkyboxPoints>();

        Console.WriteLine("Boosts: " + JsonSerializer.Serialize(boosts));

        List<string> ownerUserIdList = new List<string>();
        foreach (var skybox in skyboxes)
        {
            ownerUserIdList.Add(skybox.OwnerUserId);
        }

        Dictionary<string, int> skyboxCreditsSpent = new Dictionary<string, int>();
        Dictionary<string, int> skyboxPredictionBonus = new Dictionary<string, int>();

        foreach (var boost in boosts)
        {
            //This prediction was in a skybox
            if (boost.SkyboxId != null && !ownerUserIdList.Contains(boost.UserId))
            {
                string skyboxId = boost.SkyboxId;
                if (skyboxCreditsSpent.ContainsKey(skyboxId))
                {
                    skyboxCreditsSpent[skyboxId] += boost.BoostPrice;
                }
                else
                {
                    skyboxCreditsSpent.Add(skyboxId, boost.BoostPrice);

                    //Since this is the first time we have encountered this skyboxId, this is where we add it to the skyboxPointsList
                    var skyboxPoints = new SkyboxPoints
                    {
                        SkyboxIdAndTier = new SkyboxIdAndTier()
                        {
                            SkyboxId = boost.SkyboxId,
                            SkyboxTier = boost.SkyboxTier ?? 1 //This is safe because SkyboxTier shouldn't ever be null in this case
                        }
                    };

                    skyboxPointsList.Add(skyboxPoints);
                }

                if (skyboxPredictionBonus.ContainsKey(skyboxId))
                {
                    skyboxPredictionBonus[skyboxId] += boost.BoostAmount;
                }
                else
                {
                    skyboxPredictionBonus.Add(skyboxId, boost.BoostAmount);
                }
            }
        }

        Console.WriteLine("skyboxCreditsSpent: " + JsonSerializer.Serialize(skyboxCreditsSpent));
        Console.WriteLine("skyboxPredictionBonus: " + JsonSerializer.Serialize(skyboxPredictionBonus));

        //Add the totals from skyboxCreditsSpent and skyboxPredictionBonus to the skyboxPointsList
        foreach (var skybxPoints in skyboxPointsList)
        {
            skybxPoints.CreditsSpent = skyboxCreditsSpent[skybxPoints.SkyboxIdAndTier.SkyboxId];
            skybxPoints.PredictionBonus = skyboxPredictionBonus[skybxPoints.SkyboxIdAndTier.SkyboxId];
        }

        return skyboxPointsList;
    }

    private bool IsUserInSkybox(string userId, List<Skybox> skyboxes)
    {
        bool userIsInSkybox = false;
        foreach (var skybox in skyboxes)
        {
            foreach (var user in skybox.SkyboxChannelMembers)
            {
                if (user == userId)
                {
                    userIsInSkybox = true;
                    break;
                }
            }

            if (userIsInSkybox)
            {
                break;
            }
        }

        return userIsInSkybox;
    }

    private string GetVelocityLevel(long velocity, long maxCreditsPerSmallTimePeriod)
    {
        if (velocity > maxCreditsPerSmallTimePeriod * 0.75)
        {
            return "High";
        }
        else if (velocity > maxCreditsPerSmallTimePeriod * 0.5)
        {
            return "Medium";
        }

        return "Low";
    }
}
