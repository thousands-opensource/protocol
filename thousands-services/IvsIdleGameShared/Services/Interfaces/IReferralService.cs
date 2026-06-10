using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using IvsIdleGameShared.Models.Snag;

namespace IvsIdleGameShared.Services.Interfaces
{
    public interface IReferralService
    {
        Task<GetReferralUsersResponse> GetReferralUsers(string walletAddress);
        Task<bool> CreateLoyaltyTransaction(string walletAddress, string transactionId, int amount);
    }
}
