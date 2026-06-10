using System;
using System.Collections.Generic;
using System.Text.Json;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Models.Prediction;
using IvsIdleGameShared.Models.RallyPrediction;
using IvsIdleGameShared.Repositories.Interfaces;
using NetTopologySuite.Geometries;
using PubnubApi;
using StackExchange.Redis;

namespace IvsIdleGameShared.Repositories.Implementations;

public class RedisPredictionCache : IPredictionCache
{
    private readonly IDatabase _redisDb;

    public RedisPredictionCache(IRedisDbProvider redisDbProvider)
    {
        _redisDb = redisDbProvider.database;
    }


    private string GetTotalPredictionPriceFromEventIdAndTeamName(string eventId, string teamName, string segment)
    {
        return $"prediction-price-quote-{eventId}-{segment}-{teamName}";
    }

    private string GetStoredPredictionPriceQuoteKey(string userId)
    {
        return $"prediction-price-quote-personal-{userId}";
    }

    private string GetPersonalPredictionsKey(string eventId, string segment, string userId)
    {
        return $"prediction-personal-predictions-{eventId}-{segment}-{userId}";
    }

    private string GetSharedPredictionsKey(string eventId, string segment)
    {
        return $"prediction-shared-predictions-{eventId}-{segment}";
    }

    private string GetRallyPredictionKey(string predictionId)
    {
        return $"prediction-shared-rally-prediction-{predictionId}";
    }

    private string GetPredictionVelocityKey(string predictionId)
    {
        return $"prediction-shared-velocity-{predictionId}";
    }

    public async Task<PredictionPriceQuote?> GetPredictionPriceQuote(string userId, Guid predictionPriceQuoteGuid)
    {
        string key = GetStoredPredictionPriceQuoteKey(userId);
        string predictionPriceQuoteGuidString = predictionPriceQuoteGuid.ToString();

        RedisValue redisValue = await _redisDb.StringGetAsync(key);
        if (redisValue.HasValue)
        {
            string jsonString = redisValue.ToString();

            if (!String.IsNullOrEmpty(jsonString))
            {
                PredictionPriceQuote? predictionPriceQuote = JsonSerializer.Deserialize<PredictionPriceQuote>(jsonString);

                //We are purposefully checking to make sure the predictionPriceQuoteGuid's match.  If they don't then this is probably someone who has multiple browsers open.
                //If the predictionPriceQuoteGuid's don't match, we return that we don't have a price quote
                if (predictionPriceQuote != null && predictionPriceQuote.PriceQuoteGuid == predictionPriceQuoteGuid)
                {
                    return predictionPriceQuote;
                }
            }
        }

        return null;
    }

    public async Task<int> GetTotalSpent(string eventId, string teamName, string segment)
    {
        string key = GetTotalPredictionPriceFromEventIdAndTeamName(eventId, teamName, segment);
        RedisValue redisValue = await _redisDb.StringGetAsync(key);

        if (redisValue.HasValue)
        {
            string stringValue = redisValue.ToString();

            if (!string.IsNullOrEmpty(stringValue) && Int32.TryParse(stringValue, out int intValue))
            {
                return intValue;
            }
        }

        return 0;
    }

    public async Task<bool> IncrementTotalSpent(string eventId, string teamName, string segment, int incrementTotalAmount)
    {
        string key = GetTotalPredictionPriceFromEventIdAndTeamName(eventId, teamName, segment);

        await _redisDb.StringIncrementAsync(key, incrementTotalAmount);

        return true;
    }

    public async Task<bool> StorePredictionPriceQuote(string userId, PredictionPriceQuote predictionPriceQuote)
    {
        string key = GetStoredPredictionPriceQuoteKey(userId);

        await _redisDb.StringSetAsync(key, JsonSerializer.Serialize(predictionPriceQuote), expiry: TimeSpan.FromSeconds(15));

        return true;
    }

    public async Task<bool> AddPersonalPrediction(string eventId, string segment, Prediction prediction)
    {
        string key = GetPersonalPredictionsKey(eventId, segment, prediction.UserId);

        await _redisDb.ListRightPushAsync(key, JsonSerializer.Serialize(prediction));

        return true;
    }

    public async Task<List<Prediction>> GetPersonalPredictions(string eventId, string segment, string userId)
    {
        string key = GetPersonalPredictionsKey(eventId, segment, userId);

        RedisValue[] redisValues = await _redisDb.ListRangeAsync(key, 0, -1); //Get all items in list.  It should never be that large.

        var outputList = new List<Prediction>();

        foreach (var value in redisValues)
        {
            if (value.IsNullOrEmpty)
            {
                continue;
            }

            string? valueString = value;
            if (!string.IsNullOrWhiteSpace(valueString))
            {
                try
                {
                    var item = JsonSerializer.Deserialize<Prediction>(valueString);
                    if (item != null)
                    {
                        outputList.Add(item);
                    }
                }
                catch (JsonException jsonException)
                {
                    Console.WriteLine($"Failed to deserialize Personal Predictions: {jsonException.Message}");
                }
            }
        }

        return outputList;
    }

    public async Task<bool> AddSharedPrediction(string eventId, string segment, Prediction prediction)
    {
        string key = GetSharedPredictionsKey(eventId, segment);

        await _redisDb.ListRightPushAsync(key, JsonSerializer.Serialize(prediction));

        return true;
    }

    public async Task<List<Prediction>> GetSharedPredictions(string eventId, string segment)
    {
        string key = GetSharedPredictionsKey(eventId, segment);

        RedisValue[] redisValues = await _redisDb.ListRangeAsync(key, 0, -1); //Get all items in list.  It should never be that large.

        var outputList = new List<Prediction>();

        foreach (var value in redisValues)
        {
            if (value.IsNullOrEmpty)
            {
                continue;
            }

            string? valueString = value;
            if (!string.IsNullOrWhiteSpace(valueString))
            {
                try
                {
                    var item = JsonSerializer.Deserialize<Prediction>(valueString);
                    if (item != null)
                    {
                        outputList.Add(item);
                    }
                }
                catch (JsonException jsonException)
                {
                    Console.WriteLine($"Failed to deserialize Personal Predictions: {jsonException.Message}");
                }
            }
        }

        return outputList;
    }

    public async Task<bool> RemovePriceQuote(string userId)
    {
        string key = GetStoredPredictionPriceQuoteKey(userId);

        await _redisDb.KeyDeleteAsync(key);

        return true;
    }

    public async Task<RallyPredictionCache?> GetRallyPrediction(string predictionId)
    {
        string key = GetRallyPredictionKey(predictionId);

        RedisValue redisValue = await _redisDb.StringGetAsync(key);

        if (redisValue.IsNullOrEmpty)
        {
            return null;
        }

        RallyPredictionCache? rallyPredictionCache = JsonSerializer.Deserialize<RallyPredictionCache>((string)redisValue!);

        if (rallyPredictionCache == null)
        {
            return null;
        }

        return rallyPredictionCache;
    }

    public async Task<bool> StoreRallyPrediction(string predictionId, RallyPredictionCache rallyPredictionCache)
    {
        string key = GetRallyPredictionKey(predictionId);

        string rallyPredictionJsonString = JsonSerializer.Serialize(rallyPredictionCache);
        RedisValue redisValue = await _redisDb.StringSetAsync(key, rallyPredictionJsonString);

        return true;
    }

    public async Task<long> GetPredictionVelocity(string predictionId, string timeSegment)
    {
        string key = GetPredictionVelocityKey(predictionId);

        RedisValue redisValue = await _redisDb.HashGetAsync(key, timeSegment);

        if (redisValue.IsNullOrEmpty)
        {
            return 0;
        }

        return (long)redisValue;
    }

    public async Task<long> IncrementPredictionVelocity(string predictionId, string timeSegment, long amountToIncrement)
    {
        string key = GetPredictionVelocityKey(predictionId);

        long newIncrementedValue = await _redisDb.HashIncrementAsync(key, timeSegment, amountToIncrement);

        return newIncrementedValue;
    }
}
