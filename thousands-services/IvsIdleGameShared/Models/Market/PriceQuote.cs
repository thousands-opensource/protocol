using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.Market
{
    public class PriceQuote
    {
        public Guid PriceQuoteGuid { get; set; } = Guid.NewGuid();
        public string UserId { get; set; } = string.Empty;
        public string OrderType { get; set; } = "buy";
        public CoinPrice CoinPrice { get; set; } = new();
        public int Quantity { get; set; } = 0;
        public decimal Tax { get; set; } = 0;
        public long Timestamp { get; set; } = 0;
    }
}
