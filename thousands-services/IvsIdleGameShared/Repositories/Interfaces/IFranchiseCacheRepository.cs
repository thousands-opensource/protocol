using System.Threading.Tasks;

namespace IvsIdleGameShared.Repositories.Interfaces
{
    public interface IFranchiseCacheRepository
    {
        Task<string?> GetUserNfts(string ownerWalletAddress);
        Task<bool> AddUserNfts(string ownerWalletAddress, string payload);
    }
}
