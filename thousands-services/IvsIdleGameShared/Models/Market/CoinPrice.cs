using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.Market
{
    public class CoinPrice
    {
        public string CoinName { get; set; } = "";
        public decimal Price { get; set; } = decimal.Zero;
    }
}
