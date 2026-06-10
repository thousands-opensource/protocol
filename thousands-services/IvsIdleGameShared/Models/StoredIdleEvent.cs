using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace IvsIdleGameShared.Models
{
    [BsonIgnoreExtraElements]
    public class StoredIdleEvent
    {
        [BsonId]
        [BsonElement("_id")]
        public ObjectId Id { get; set; }

        [BsonElement("userId")] 
        public string UserId { get; set; } = string.Empty;

        [BsonElement("eventId")]
        public string EventId { get; set; } = string.Empty;

        [BsonElement("idleEvent")]
        public required IdleEvent IdleEvent { get; set; }

        /*
        [BsonElement("createdAt")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime? CreatedAt { get; set; }

        [BsonElement("updatedAt")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime? UpdatedAt { get; set; }
        */
    }
}
