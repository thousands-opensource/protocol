using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.Request
{
    public class GetChatMessagesRequest
    {
        [JsonPropertyName("stageId")]
        public string StageId { get; set; } = "";

        [JsonPropertyName("segment")]
        public string SegmentString { get; set; } = "";

        [JsonPropertyName("timestamp")]
        public string? TimestampString { get; set; } = null;
    }
}
