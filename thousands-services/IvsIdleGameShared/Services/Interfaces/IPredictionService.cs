using System;
using System.Threading.Tasks;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Models.Leaderboard;
using IvsIdleGameShared.Models.Prediction;
using IvsIdleGameShared.Models.RallyPrediction;

namespace IvsIdleGameShared.Services.Interfaces;

public interface IPredictionService
{
    Task<PredictionPriceQuote> GetPriceQuote(string userId, string teamName, int credits, string stageId);
    Task<PredictionPriceQuote> GetPriceQuote(string userId, bool choice, int credits, string predictionId);
    Task<ConfirmPredictionResult> ConfirmPrediction(Guid predictionPriceQuoteGuid, string userId, string teamName, int credits, string stageId);
    Task<ConfirmPredictionResult> ConfirmPrediction(Guid predictionPriceQuoteGuid, string userId, bool choice, int credits, string predictionId);
    Task<PredictionStats> GetPrediction(string predictionId);
    Task<SuccessAndErrorMessage> SetWinner(string stageId, int segment, string teamName);
    Dictionary<string, UserTotal> GetUserTotalsFromPredictions(List<Prediction> predictions);
    Task<SharedAveragePoints> GetSharedAveragePoints(string stageId, string segment);
    Task<List<Leader>> GetLeaders(string eventId);
}
