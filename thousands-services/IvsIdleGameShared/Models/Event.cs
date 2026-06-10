using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace IvsIdleGameShared.Models
{
    [BsonIgnoreExtraElements]
    public class Event
    {
        [BsonId]
        [BsonElement("_id")]
        public ObjectId Id { get; set; }

        [BsonElement("seasonId")]
        public ObjectId SeasonId { get; set; }

        [BsonElement("beamableEventId")]
        public string BeamableEventId { get; set; } = "";

        [BsonElement("name")]
        public string Name { get; set; } = "";

        [BsonElement("description")]
        public string Description { get; set; } = "";

        [BsonElement("currentSegment")]
        public int? CurrentSegment { get; set; } = 0;
    }
}
