using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace IvsIdleGameShared.Models.ExternalStreams
{
    public class UserExternalStreamWatchMinutes
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public required string Id { get; set; }

        [BsonElement("userId")]
        public required string UserId { get; set; }

        [BsonElement("externalStreamId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public required string ExternalStreamId { get; set; }

        [BsonElement("sessionId")]
        public string? SessionId { get; set; }

        [BsonElement("minutesWatched")]
        public int MinutesWatched { get; set; }

        [BsonElement("periodStartUtc")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime PeriodStartUtc { get; set; }

        [BsonElement("periodEndUtc")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime PeriodEndUtc { get; set; }

        [BsonElement("placement")]
        public string? Placement { get; set; }

        [BsonElement("userAgentHash")]
        public string? UserAgentHash { get; set; }

        [BsonElement("createdAt")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime CreatedAt { get; set; }
    }
}
