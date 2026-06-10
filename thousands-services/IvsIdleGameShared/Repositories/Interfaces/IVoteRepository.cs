using IvsIdleGameShared.Models.Vote;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Repositories.Interfaces
{
    public interface IVoteRepository
    {
        Task<bool> AddActiveVoting(string eventId, Guid voteId);
        Task<ActiveVoting?> GetActiveVoting(string eventId);
        Task<bool> RemoveActiveVoting(string eventId);
        Task<bool> AddVoteConfig(string eventId, string voteId, VoteConfig voteConfig);
        Task<VoteConfig?> GetVoteConfig(string eventId, string voteId);
        Task<bool> AddVote(string eventId, string userId, string voteId, string voteOption);
        Task<List<StoredVote>> GetVotes(string eventId, string voteId);
        
    }
}
