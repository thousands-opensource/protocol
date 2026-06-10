using System.Text.Json.Serialization;

namespace IvsIdleGameShared.Models
{
    public class EventMatch
    {
        [JsonPropertyName("VendorEventId")]
        public string VendorEventId { get; set; } = "";

        [JsonPropertyName("EventId")]
        public string EventId { get; set; } = "";

        [JsonPropertyName("MatchId")]
        public string MatchId { get; set; } = "";
        public string Team0Champion { get; set; } = "";
        public string Team1Champion { get; set; } = "";
        public string Team0Sidekick { get; set; } = "";
        public string Team1Sidekick { get; set; } = "";
        public string Team0Name { get; set; } = "";
        public string Team0GamerTag { get; set; } = "";
        public string Team1Name { get; set; } = "";
        public string Team1GamerTag { get; set; } = "";
        public string Team0ShortName { get; set; } = "";
        public string Team0Color { get; set; } = "";
        public string Team1ShortName { get; set; } = "";
        public string Team1Color { get; set; } = "";
        public long Timestamp { get; set; } = 0;
        public int Segment { get; set; } = 0;
    }
}
