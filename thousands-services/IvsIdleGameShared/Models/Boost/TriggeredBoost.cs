using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.Boost
{
    /*
     "timestamp": 12345678987,
       "userId": "huihfduf8svy87fdf",
       "pfpUrl": "https://",
       "boostType": "red",
       "boostLevel": 2,
       "boostProgress": 959599999
     *
     */

    public class TriggeredBoost
    {
        [JsonPropertyName("timestamp")] public long Timestamp { get; set; } = 0;
        [JsonPropertyName("userId")] public string UserId { get; set; } = "";
        [JsonPropertyName("creditsLeft")] public int? CreditsLeft { get; set; } = null;
        [JsonPropertyName("userName")] public string UserName { get; set; } = "";
        [JsonPropertyName("pfpUrl")] public string PfpUrl { get; set; } = "";
        [JsonPropertyName("boostType")] public string BoostType { get; set; } = "";
        [JsonPropertyName("boostLevel")] public int BoostLevel { get; set; } = 1;
        [JsonPropertyName("boostProgress")] public int BoostProgress { get; set; } = 0;
        [JsonPropertyName("personalProgressStartTime")] public long PersonalProgressStartTime { get; set; } = 0;
        [JsonPropertyName("personalProgressTotalDelayTime")] public int PersonalProgressTotalDelayTime { get; set; } = 0;
    }
}
