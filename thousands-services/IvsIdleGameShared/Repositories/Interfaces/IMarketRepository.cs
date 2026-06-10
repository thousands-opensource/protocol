using IvsIdleGameShared.Models.Market;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Repositories.Interfaces
{
    public interface IMarketRepository
    {
        Task<bool> AddMarketTransaction(string userId, long timestamp, string coinName, string orderType, int quantity, decimal totalValue, decimal tax);
        Task<UserCoin?> AddCoinToUser(string userId, string coinName, int quantity, decimal avgPurchasePricePerCoin, UserCoin? userCoins);
        Task<UserCoin?> GetUserCoins(string userId);
        Task<bool> DoesUserHaveEnoughCoins(string userId, string coinName, int quantity);
    }
}
