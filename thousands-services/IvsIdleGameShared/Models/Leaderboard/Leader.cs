using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.Leaderboard
{
    public class Leader
    {
        [JsonPropertyName("r")] public int Rank { get; set; } = 0;
        //public int PreviousRank { get; set; } = 0;
        [JsonPropertyName("u")] public string UserId { get; set; } = "";
        //public string Username { get; set; } = "";
        //public string PfpImageUrl { get; set; } = "";
        [JsonPropertyName("s")] public int Score { get; set; } = 0;
        [JsonPropertyName("p")] public string? PfpUrl { get; set; } = null;
        [JsonPropertyName("n")] public string? UserName { get; set; } = null;
    }
}
