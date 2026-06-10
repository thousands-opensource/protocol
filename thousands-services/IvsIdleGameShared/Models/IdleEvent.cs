using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace IvsIdleGameShared.Models
{
    public class IdleEvent
    {
        [JsonPropertyName("chatActionGuid")]
        [BsonElement("chatActionGuid")]
        public Guid ChatActionGuid { get; set; } = Guid.Empty;

        [JsonPropertyName("name")]
        [BsonElement("name")]
        public string Name { get; set; } = "";

        [JsonPropertyName("timestamp")]
        [BsonElement("timestamp")]
        public long Timestamp { get; set; } = 0;

        [JsonPropertyName("cost")]
        [BsonElement("cost")]
        public int Cost { get; set; } = 0;

        [JsonPropertyName("duration")]
        [BsonElement("duration")]
        public int Duration { get; set; } = 0;

        [JsonPropertyName("perTick")]
        [BsonElement("perTick")]
        public decimal PerTick { get; set; } = 0;

        [JsonPropertyName("isPersonalEvent")]
        [BsonElement("isPersonalEvent")]
        public bool IsPersonalEvent { get; set; } = true;

        [JsonPropertyName("vendorEventId")]
        [BsonElement("vendorEventId")]
        public string? VendorEventId { get; set; } = null;
    }
}
