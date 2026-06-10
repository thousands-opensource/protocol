using System;
using IvsIdleGameShared.Models.Prediction;
using IvsIdleGameShared.Models.RallyPrediction;

namespace IvsIdleGameShared.Repositories.Interfaces;

public interface IPredictionCache
{
    Task<PredictionPriceQuote?> GetPredictionPriceQuote(string userId, Guid predictionPriceQuoteGuid);
    Task<bool> StorePredictionPriceQuote(string userId, PredictionPriceQuote predictionPriceQuote);
    Task<int> GetTotalSpent(string eventId, string teamName, string segment);
    Task<bool> IncrementTotalSpent(string eventId, string teamName, string segment, int incrementTotalAmount);
    Task<bool> AddPersonalPrediction(string eventId, string segment, Prediction prediction);
    Task<List<Prediction>> GetPersonalPredictions(string eventId, string segment, string userId);
    Task<bool> AddSharedPrediction(string eventId, string segment, Prediction prediction);
    Task<List<Prediction>> GetSharedPredictions(string eventId, string segment);
    Task<bool> RemovePriceQuote(string userId);
    Task<RallyPredictionCache?> GetRallyPrediction(string predictionId);
    Task<bool> StoreRallyPrediction(string predictionId, RallyPredictionCache rallyPredictionCache);
    Task<long> GetPredictionVelocity(string predictionId, string timeSegment);
    Task<long> IncrementPredictionVelocity(string predictionId, string timeSegment, long amountToIncrement);
}
