using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.Leaderboard
{
    public class ChatLeaderboard
    {
        public string CurrentUserId { get; set; } = "";
        public int CurrentUserRank { get; set; } = 0;
        public List<Leader> Leaders { get; set; } = new List<Leader>();
    }
}
