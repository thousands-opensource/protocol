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
    public class ChatMessageOutput
    {
        [BsonElement("userId")]
        [JsonPropertyName("userId")]
        public string UserId { get; set; } = "";

        [BsonElement("message")]
        [JsonPropertyName("message")]
        public string Message { get; set; } = "";

        [BsonElement("timestamp")]
        [JsonPropertyName("timestamp")]
        public long Timestamp { get; set; } = 0;
    }
}
