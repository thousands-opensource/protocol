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
    public class ChatReaction
    {
        [BsonElement("vendorEventId")]
        public string VendorEventId { get; set; } = "";

        [BsonElement("stageId")]
        public string StageId { get; set; } = "";

        [BsonElement("userId")]
        public string UserId { get; set; } = "";

        [BsonElement("originalMessage")]
        public string OriginalMessage { get; set; } = "";

        [BsonElement("originalMessageUserId")]
        public string OriginalMessageUserId { get; set; } = "";

        [BsonElement("emoji")]
        public string Emoji { get; set; } = "";

        [BsonElement("emojiAddedOrRemoved")]
        public bool EmojiAddedOrRemoved { get; set; } = false;

        [BsonElement("timestamp")]
        public long Timestamp { get; set; } = 0;
    }
}
