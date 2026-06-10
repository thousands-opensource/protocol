using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace IvsIdleGameShared.Models
{
    public class GameEventEvent
    {
        [JsonPropertyName("Name")]
        [BsonElement("Name")]
        public string Name { get; set; } = "";

        [JsonPropertyName("Timestamp")]
        [BsonElement("Timestamp")]
        public long Timestamp { get; set; } = 0;

        [JsonPropertyName("Target")]
        [BsonElement("Target")]
        public string Target { get; set; } = "";

        [JsonPropertyName("Instigator")]
        [BsonElement("Instigator")]
        public string Instigator { get; set; } = "";

        [JsonPropertyName("ContextTags")]
        [BsonElement("ContextTags")]
        public string[]? ContextTags { get; set; } = null;

        [JsonPropertyName("Data")]
        [BsonElement("Data")]
        public GameEventData? Data { get; set; } = null;
    }
}
