using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using IvsIdleGameShared.Models.Market;

namespace IvsIdleGameShared.Services.Interfaces
{
    public interface IMarketService
    {
        Task<PriceQuote> GetPriceQuote(string userId, string coinName, int quantity, string orderType, string formula);
        Task<PlaceOrderResult> PlaceOrder(string eventId, string userId, Guid priceQuoteGuid, string coinName, int quantity, string orderType, string formula);
        Task<List<CoinPrice>> GetTopCoins();
        Task<List<CoinHoldingWithCurrentPrice>> GetMyCoins(string userId);
    }
}
