using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using IvsIdleGameShared.Models.Leaderboard;
using IvsIdleGameShared.Models.Skybox;
using IvsIdleGameShared.Models.Vote;

namespace IvsIdleGameShared.Models.Boost
{
    public class BoostSignalMessage
    {
        [JsonPropertyName("boostEventType")] public string BoostEventType { get; set; } = "";
        [JsonPropertyName("eventId")] public string EventId { get; set; } = ""; //StageId

        [JsonPropertyName("redBlueRatio")] public decimal? RedBlueRatio { get; set; }
        [JsonPropertyName("redComboMultiplier")] public decimal? RedComboMultiplier { get; set; }
        [JsonPropertyName("blueComboMultiplier")] public decimal? BlueComboMultiplier { get; set; }
        [JsonPropertyName("totalRedBoosts")] public int? TotalRedBoosts { get; set; }
        [JsonPropertyName("totalBlueBoosts")] public int? TotalBlueBoosts { get; set; }
        [JsonPropertyName("eventMatchStartTime")] public long? EventMatchStartTime { get; set; }
        [JsonPropertyName("roundNumber")] public int? RoundNumber { get; set; }
        [JsonPropertyName("boosts")] public List<TriggeredBoost>? Boosts { get; set; }
        [JsonPropertyName("averageRedBoost")] public decimal? AverageRedBoosts { get; set; } = 0.00M;
        [JsonPropertyName("averageBlueBoost")] public decimal? AverageBlueBoosts { get; set; } = 0.00M;
        [JsonPropertyName("totalUniqueUserCount")] public int? TotalUniqueUserCount { get; set; } = 0;
        [JsonPropertyName("leaders")] public List<Leader>? Leaders { get; set; } = null;
        [JsonPropertyName("skyboxes")] public List<Skybox.Skybox>? Skyboxes { get; set; } = null;
        [JsonPropertyName("voteUpdate")] public VoteUpdate? VoteUpdate { get; set; } = null;
        [JsonPropertyName("skyboxEmojis")] public List<SkyboxChatEmoji>? SkyboxEmojis { get; set; } = null;
    }
}
