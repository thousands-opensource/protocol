using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.Prediction
{
    public class UserTotal
    {
        public int CreditsSpentOnRed { get; set; } = 0;
        public decimal AveragePurchasePriceRed { get; set; } = 0.0M;
        public int CreditsSpentOnBlue { get; set; } = 0;
        public decimal AveragePurchasePriceBlue { get; set; } = 0.0M;
    }
}
