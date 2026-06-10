using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Amazon.IVSRealTime.Model;
using IvsIdleGameShared.Models.Vote;

namespace IvsIdleGameShared.Repositories.Interfaces
{
    public interface IVoteHistoryRepository
    {
        Task<bool> AddVoteHistory(VoteHistory voteHistory);
        Task<List<VoteHistory>?> GetVoteHistory(string stageId);
    }
}
