using IvsIdleGameShared.Models.Queue;
using MongoDB.Driver.Core.Servers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Services.Interfaces
{
    public interface IQueueService
    {
        Task<PositionInQueue> JoinQueue(string queueId, string userId);
        Task<PositionInQueue> GetPositionInQueue(string queueId, string userId);
        Task<int> AdvanceQueue(string queueId, int amountToAdvanceTheQueue);
    }
}
