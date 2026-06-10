using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.Queue
{
    public class PositionInQueue
    {
        public int PlaceInLine { get; set; } = -1;
        public int NumberAheadOfMe { get; set; } = -1;
        public int TotalInLine { get; set; } = -1;
        public bool LetUserInNow { get; set; } = false;
    }
}
