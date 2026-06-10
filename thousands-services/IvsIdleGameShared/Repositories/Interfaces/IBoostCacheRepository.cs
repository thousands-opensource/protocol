using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Repositories.Interfaces
{
    public interface IBoostCacheRepository
    {
        Task<int> GetSharedBoostComboMultiplier(string eventId, string boostName, string boostSegment);
        Task<int> IncrementSharedBoostComboMultiplier(string eventId, string boostName, string boostSegment, int incrementAmount);

        //Task<int> GetPersonalBoostLevel(string eventId, string userId, string boostName);
        //Task<bool> IncrementPersonalBoostLevel(string eventId, string userId, string boostName, int incrementLevelAmount);

        Task<int> GetPersonalBoostProgress(string eventId, string userId, string boostName, string boostSegment);
        Task<bool> IncrementPersonalBoostProgress(string eventId, string userId, string boostName, string boostSegment, int incrementLevelAmount);

        Task<int> GetTotalBoost(string eventId, string boostName, string boostSegment);
        Task<bool> IncrementTotalBoosts(string eventId, string boostName, string boostSegment, int incrementTotalAmount);

        Task<int> GetTotalSpent(string eventId, string boostName, string boostSegment);
        Task<bool> IncrementTotalSpent(string eventId, string boostName, string boostSegment, int incrementSpentAmount);

        Task<long> GetPersonalProgressStartTime(string eventId, string userId, string boostName, string boostSegment);
        Task<bool> SetPersonalProgressStartTime(string eventId, string userId, string boostName, string boostSegment, long startTime);

        Task<int> GetPersonalProgressTotalDelayTime(string eventId, string userId, string boostName, string boostSegment);
        Task<bool> SetPersonalProgressTotalDelayTime(string eventId, string userId, string boostName, string boostSegment, int newDelayAmount);
        Task<bool> IncrementPersonalProgressTotalDelayTime(string eventId, string userId, string boostName, string boostSegment, int incrementDelayAmount);

        Task<long> GetLastTriggeredEffectTime(string eventId, string boostSegment);
        Task<bool> SetLastTriggeredEffectTime(string eventId, string boostSegment, long newTime);
    }
}
