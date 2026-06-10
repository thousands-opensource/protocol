using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.Request
{
    public class GetEventsRequest
    {
        [JsonPropertyName("eventStatus")]
        public string? EventStatus { get; set; } = null;

        [JsonPropertyName("startTime")]
        public DateTime? StartTime { get; set; } = null;

        [JsonPropertyName("endTime")]
        public DateTime? EndTime { get; set; } = null;
    }
}
