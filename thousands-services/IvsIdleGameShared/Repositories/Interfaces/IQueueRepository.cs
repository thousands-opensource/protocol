using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Repositories.Interfaces
{
    public interface IQueueRepository
    {
        Task<int> GetBeginningOfLine(string queueId);
        Task<int> SetBeginningOfLine(string queueId, int newBeginningOfLine);
        Task<int> IncrementBeginningOfLine(string queueId, int incrementAmount);
        Task<int> GetEndOfLine(string queueId);
        Task<int> IncrementEndOfLine(string queueId, int incrementAmount);
        Task<bool> AddUserToLine(string queueId, string userId, int placeInLine);
        Task<int> GetUserPlaceInLine(string queueId, string userId);
        Task<string> GetUserInPlaceInLine(string queueId, int placeInLine);
    }
}
