using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Models.Users;

namespace IvsIdleGameShared.Repositories.Interfaces
{
    public interface IUserRepository
    {
        Task<User> GetUser(string userId);
        Task<User> GetUserByWalletAddress(string walletAddress);
        Task<List<UserOutput>> GetUsers(string? userId, string? displayName, string? walletAddress, int? page, int? pageSize);
        Task<List<UserWithNameAndWalletAddress>> GetAllUsersWithNameAndPrimaryWalletAddress();
        Task<List<User>> GetStreamerUsers();
        Task<string> GetPFPUrlFromGamerTag(string gamerTag);

        Task<bool> AddToUserPoints(string userId, int creditsToAdd);
    }
}
