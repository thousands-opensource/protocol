using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.Market
{
    public class CoinHoldingWithCurrentPrice
    {
        public CoinHolding CoinHolding { get; set; } = new();
        public CoinPrice CurrentPrice { get; set; } = new();
    }
}
