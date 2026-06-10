using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.Leaderboard
{
    public class UserScore
    {
        public string UserId { get; set; } = "";
        public int Score { get; set; } = 0;
        public int Rank { get; set; } = 0;
    }
}
