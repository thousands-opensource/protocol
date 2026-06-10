using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Threading.Channels;

namespace IvsIdleGameShared.Models
{
    [BsonIgnoreExtraElements]
    public class Stage
    {
        [BsonId]
        [BsonElement("_id")]
        public ObjectId Id { get; set; }

        [BsonElement("serverId")]
        public ObjectId? ServerId { get; set; }

        [BsonElement("seriesId")]
        public ObjectId? SeriesId { get; set; }

        [BsonElement("eventId")]
        public ObjectId? EventId { get; set; }

        [BsonElement("beamableEventId")]
        public string? BeamableEventId { get; set; } = null;

        [BsonElement("maxGeneralAdmission")]
        public int? MaxGeneralAdmission { get; set; } = null;

        [BsonElement("currentSegment")]
        public int? CurrentSegment { get; set; } = 0;

        [BsonElement("createdAt")]
        public DateTime? CreatedAt { get; set; }

        [BsonElement("updatedAt")]
        public DateTime? UpdatedAt { get; set; }
        [BsonElement("channels")]
        public List<Channel> Channels { get; set; } = new List<Channel>();
        [BsonElement("status")]
        public string Status { get; set; } = string.Empty;
    }
}
