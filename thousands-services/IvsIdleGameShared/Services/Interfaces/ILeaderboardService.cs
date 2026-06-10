using IvsIdleGameShared.Models.Leaderboard;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using IvsIdleGameShared.Models.Boost;

namespace IvsIdleGameShared.Services.Interfaces
{
    public interface ILeaderboardService
    {
        Task IncrementScore(string eventId, string userId, int incrementAmount);
        Task IncrementScores(string eventId, List<Boost> boosts);
        Task<ChatLeaderboard> GetScores(string eventId, string vendorEventId, string userId);
        Task<List<UserScore>> GetAllScores(string eventId);
    }
}
