using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.Chat
{
    [BsonIgnoreExtraElements]
    public class ChatReactionsSegment
    {
        [BsonId]
        [BsonElement("_id")]
        public ObjectId Id { get; set; }

        [BsonElement("stageId")]
        public string StageId { get; set; } = "";
        [BsonElement("segment")]
        public int Segment { get; set; } = 0;
        [BsonElement("chatReactions")]
        public List<ChatReaction> ChatReactions { get; set; } = new List<ChatReaction>();
    }
}
