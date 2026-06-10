using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.Events
{
    [BsonIgnoreExtraElements]
    public class EventOutput
    {
        [BsonId]
        [BsonElement("_id")]
        [JsonPropertyName("_id")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        [BsonElement("seriesId")]
        [JsonPropertyName("seriesId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string SeriesId { get; set; }

        [BsonElement("eventName")]
        [JsonPropertyName("eventName")]
        public string EventName { get; set; } = "";

        [BsonElement("startDate")]
        [JsonPropertyName("startDate")]
        public DateTime? StartDate { get; set; }

        [BsonElement("eventDate")]
        [JsonPropertyName("eventDate")]
        public DateTime? EndDate { get; set; }

        [BsonElement("imageUrl")]
        [JsonPropertyName("imageUrl")]
        public string ImageUrl { get; set; } = "";

        [BsonElement("createdAt")]
        [JsonPropertyName("createdAt")]
        public DateTime? CreatedAt { get; set; }

        [BsonElement("updatedAt")]
        [JsonPropertyName("updatedAt")]
        public DateTime? UpdatedAt { get; set; }

    }
}
