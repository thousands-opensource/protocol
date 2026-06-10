using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models
{
    public  class CreatorEvent
    {
        [JsonPropertyName("eventId")]
        [BsonElement("eventId")]
        public string EventId { get; set; } = "";

        [JsonPropertyName("creatorEventName")]
        [BsonElement("creatorEventName")]
        public string CreatorEventName { get; set; } = "";

        [JsonPropertyName("questionText")]
        [BsonElement("questionText")]
        public string QuestionText { get; set; } = "";

        [JsonPropertyName("textOptions")]
        [BsonElement("textOptions")]
        public string[]? TextOptions { get; set; } = null;
    }
}
