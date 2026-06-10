using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.Chat
{
    [BsonIgnoreExtraElements]
    public class ChatMessage
    {
        [BsonElement("vendorEventId")]
        public string VendorEventId { get; set; } = "";

        [BsonElement("stageId")]
        public string StageId { get; set; } = "";

        [BsonElement("userId")]
        public string UserId { get; set; } = "";

        [BsonElement("message")]
        public string Message { get; set; } = "";

        [BsonElement("timestamp")]
        public long Timestamp { get; set; } = 0;
    }
}
