using IvsIdleGameShared.Models.RallyPrediction;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Repositories.Interfaces
{
    public interface IRallyPredictionRepository
    {
        Task<RallyPrediction?> GetRallyPrediction(string rallyPredictionId);
        Task<List<RallyPrediction>> GetRallyPredictions();

        Task<List<UserRallyPrediction>> GetUserRallyPredictions(bool includeFreeCalls, string? rallyPredictionId = null);
        Task<bool> AddUserRallyPrediction(UserRallyPrediction userRallyPrediction);

        Task<bool> AddPredictionChartData(PredictionChartData predictionChartData);
    }
}
