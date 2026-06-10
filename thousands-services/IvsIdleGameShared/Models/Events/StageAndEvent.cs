using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using IvsIdleGameShared.Models.Response;

namespace IvsIdleGameShared.Models.Events
{
    [BsonIgnoreExtraElements]
    public class StageAndEvent
    {
        [BsonId]
        [BsonElement("_id")]
        [JsonPropertyName("_id")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        [BsonElement("serverId")]
        [JsonPropertyName("serverId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? ServerId { get; set; }

        [BsonElement("seriesId")]
        [JsonPropertyName("seriesId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? SeriesId { get; set; }

        [BsonElement("eventId")]
        [JsonPropertyName("eventId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? EventId { get; set; }

        [BsonElement("beamableEventId")]
        [JsonPropertyName("beamableEventId")]
        public string? BeamableEventId { get; set; } = null;

        [BsonElement("description")]
        [JsonPropertyName("description")]
        public string? Description { get; set; } = null;

        [BsonElement("startDate")]
        [JsonPropertyName("startDate")]
        public DateTime? StartDate { get; set; } = null;

        [BsonElement("endDate")]
        [JsonPropertyName("endDate")]
        public DateTime? EndDate { get; set; } = null;

        [BsonElement("maxGeneralAdmission")]
        [JsonPropertyName("maxGeneralAdmission")]
        public int? MaxGeneralAdmission { get; set; } = null;

        [BsonElement("eventType")]
        [JsonPropertyName("eventType")]
        public string? EventType { get; set; } = null;

        [BsonElement("gameMode")]
        [JsonPropertyName("gameMode")]
        public string? GameMode { get; set; } = null;

        [BsonElement("cameraOperator")]
        [JsonPropertyName("cameraOperator")]
        public string? CameraOperator { get; set; } = null;

        [BsonElement("currentSegment")]
        [JsonPropertyName("currentSegment")]
        public int? CurrentSegment { get; set; } = 0;

        [BsonElement("createdAt")]
        [JsonPropertyName("createdAt")]
        public DateTime? CreatedAt { get; set; }

        [BsonElement("updatedAt")]
        [JsonPropertyName("updatedAt")]
        public DateTime? UpdatedAt { get; set; }
        
        [BsonElement("eventDetails")]
        [JsonPropertyName("eventDetails")]
        public List<EventOutput>? EventDetails { get; set; } = null;
    }
}
