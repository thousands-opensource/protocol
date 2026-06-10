using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.RallyPrediction
{
    public class PredictionStats
    {
        [JsonPropertyName("totalOptionA")]
        public int TotalOptionA { get; set; } = 0;

        [JsonPropertyName("totalOptionB")]
        public int TotalOptionB { get; set; } = 0;

        [JsonPropertyName("timingFactor")]
        public decimal TimingFactor { get; set; } = 0.0M;

        [JsonPropertyName("activityLevel")]
        public string ActivityLevel { get; set; } = "Low";

        [JsonPropertyName("haltedUntil")]
        public DateTime? HaltedUntil { get; set; } = null;

        [JsonPropertyName("startTimestamp")]
        public long StartTimestamp { get; set; } = 0;
    }
}
