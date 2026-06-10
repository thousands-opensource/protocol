using System.Threading.Tasks;
using IvsIdleGameShared.Repositories.Interfaces;
using StackExchange.Redis;

namespace IvsIdleGameShared.Repositories.Implementations
{
    public class RedisFranchiseCacheRepository : IFranchiseCacheRepository
    {
        private readonly IDatabase _redisDb;

        public RedisFranchiseCacheRepository(IRedisDbProvider redisDbProvider)
        {
            _redisDb = redisDbProvider.database;
        }

        private string GetUserNftsKey(string ownerWalletAddress)
        {
            return $"franchise:user:nfts:{ownerWalletAddress}";
        }

        public async Task<string?> GetUserNfts(string ownerWalletAddress)
        {
            string key = GetUserNftsKey(ownerWalletAddress);
            RedisValue redisValue = await _redisDb.StringGetAsync(key);

            if (redisValue.HasValue)
            {
                return redisValue.ToString();
            }

            return null;
        }

        public async Task<bool> AddUserNfts(string ownerWalletAddress, string payload)
        {
            string key = GetUserNftsKey(ownerWalletAddress);

            return await _redisDb.StringSetAsync(key, payload);
        }
    }
}
