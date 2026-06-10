using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.ExternalStreams
{
    [BsonIgnoreExtraElements]
    public class ExternalStream
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString()!;

        [BsonElement("platformId")]
        [BsonRepresentation(BsonType.String)]
        public AccountProviderType PlatformId { get; set; }

        [BsonElement("platformUserName")]
        public string? PlatformUserName { get; set; }

        [BsonElement("platformUserId")]
        public string PlatformUserId { get; set; } = string.Empty;

        [BsonElement("channelId")]
        public string ChannelId { get; set; } = string.Empty;

        [BsonElement("thumbnail")]
        public string Thumbnail { get; set; } = string.Empty;

        [BsonElement("streamTitle")]
        public string StreamTitle { get; set; } = string.Empty;

        [BsonElement("viewerCount")]
        public int ViewerCount { get; set; } = 0;

        [BsonElement("language")]
        public string? Language { get; set; }

        [BsonElement("profilePicture")]
        public string? ProfilePicture { get; set; }

        [BsonElement("hasMatureContent")]
        public bool? HasMatureContent { get; set; }

        [BsonElement("startDate")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime StartDate { get; set; }

        [BsonElement("endDate")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime? EndDate { get; set; }

        [BsonElement("amountEarned")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal? AmountEarned { get; set; }

        [BsonElement("createdAt")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime? CreatedAt { get; set; }

        [BsonElement("updatedAt")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime? UpdatedAt { get; set; }

        [BsonElement("__v")]
        public int? Version { get; set; }
    }
}


