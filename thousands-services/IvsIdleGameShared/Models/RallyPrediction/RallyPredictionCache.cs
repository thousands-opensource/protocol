using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.RallyPrediction
{
    public class RallyPredictionCache
    {
        public RallyPrediction RallyPrediction { get; set; } = new RallyPrediction();
        public DateTime? HaltedUntil { get; set; } = null;
    }
}
