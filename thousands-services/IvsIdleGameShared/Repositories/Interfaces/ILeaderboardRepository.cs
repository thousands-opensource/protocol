using IvsIdleGameShared.Models.Leaderboard;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Models.Boost;

namespace IvsIdleGameShared.Repositories.Interfaces
{
    public interface ILeaderboardRepository
    {
        Task<double> IncrementUserIdToScoreMappingSortedSet(string eventId, string userId, int incrementAmount);
        Task<bool> IncrementUserIdsToScoresMappingSortedSet(string eventId, List<Boost> boosts);
        Task<bool> AddScoreToRankMappingSortedSet(string eventId, int score, int rank);
        Task<long> IncrementScoreCount(string eventId, int score, int incrementAmount);
        Task<long> GetUserIdRank(string eventId, string userId);
        Task<List<UserScore>> GetAllScores(string eventId);
        Task<List<UserScore>> GetTopThreeUserScores(string eventId);
        Task<List<UserScore>> GetThreeScoresAroundUser(string eventId, string userId);
    }
}
