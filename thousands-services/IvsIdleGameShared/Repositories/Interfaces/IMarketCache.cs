using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using IvsIdleGameShared.Models.Market;

namespace IvsIdleGameShared.Repositories.Interfaces
{
    public interface IMarketCache
    {
        Task<int> GetSupply(string coinName);
        Task<int> IncrementSupply(string coinName, int incrementAmount);
        Task<PriceQuote> GetPriceQuote(Guid priceQuoteGuid);
        Task<bool> RemovePriceQuote(Guid priceQuoteGuid);
        Task<bool> StorePriceQuote(PriceQuote priceQuote);
        Task<List<CoinPrice>> GetTopCoinPrices();
        Task<bool> SetCoinPrice(CoinPrice coinPrice);
    }
}
