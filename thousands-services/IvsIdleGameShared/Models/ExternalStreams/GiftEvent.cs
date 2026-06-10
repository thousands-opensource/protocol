using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.ExternalStreams
{
    public class GiftEvent
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString()!;

        [BsonElement("userId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string UserId { get; set; } = string.Empty;

        [BsonElement("platformId")]
        [BsonRepresentation(BsonType.String)]
        public AccountProviderType PlatformId { get; set; }

        [BsonElement("platformUserName")]
        [BsonRepresentation(BsonType.String)]
        public string PlatformUserName { get; set; } = String.Empty;

        [BsonElement("numberOfSubs")]
        public int NumberOfSubs { get; set; }

        [BsonElement("completedOn")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime? CompletedOn { get; set; }

        [BsonElement("createdAt")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime? CreatedAt { get; set; }

        [BsonElement("updatedAt")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime? UpdatedAt { get; set; }

        [BsonElement("__v")]
        public int? Version { get; set; }
    }

    public enum AccountProviderType
    {
        Twitch,
        YouTube,
        Kick,
        // Add other providers as needed
    }
    
}