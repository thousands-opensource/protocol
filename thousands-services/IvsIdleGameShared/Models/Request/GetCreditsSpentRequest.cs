using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.Request
{
    public class GetCreditsSpentRequest
    {
        [JsonPropertyName("stageId")]
        public string StageId { get; set; } = "";

        [JsonPropertyName("segment")]
        public string SegmentString { get; set; } = "";

        [JsonPropertyName("userId")]
        public string? UserId { get; set; } = null;
    }
}
