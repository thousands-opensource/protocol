using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.Market
{
    public class PlaceOrderResult
    {
        public bool WasOrderPlaced { get; set; } = false;
        public string ErrorMessage { get; set; } = string.Empty;
        public PriceQuote? PriceQuote { get; set; } = null;
        public int UpdatedCredits { get; set; } = -1;
        public int UpdatedSupply { get; set; } = -1;
        public UserCoin? UpdatedUserCoins { get; set; } = null;
    }
}
