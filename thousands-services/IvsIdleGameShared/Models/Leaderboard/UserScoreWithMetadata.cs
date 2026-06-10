using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.Leaderboard
{
    public class UserScoreWithMetadata
    {
        UserScore UserScore { get; set; } = new UserScore();
        public string Username { get; set; } = "";
        public string PfpImageUrl { get; set; } = "";
    }
}
