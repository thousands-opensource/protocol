using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.Vote
{
    [BsonIgnoreExtraElements]
    public class VoteHistory
    {
        [BsonId]
        [BsonElement("_id")]
        [JsonPropertyName("_id")]
        public ObjectId Id { get; set; }

        [BsonElement("stageId")]
        [JsonPropertyName("stageId")]
        public ObjectId StageId { get; set; }

        [BsonElement("voteTitle")]
        [JsonPropertyName("voteTitle")]
        public string VoteTitle { get; set; } = "";

        [BsonElement("voteOptionResults")]
        [JsonPropertyName("voteOptionResults")]
        public List<VoteOptionWithVotes> VoteOptionResults { get; set; } = new List<VoteOptionWithVotes>();

        [BsonElement("createdAt")]
        [JsonPropertyName("createdAt")]
        public DateTime? CreatedAt { get; set; } = null;

        [BsonElement("updatedAt")]
        [JsonPropertyName("updatedAt")]
        public DateTime? UpdatedAt { get; set; } = null;

        [BsonElement("__v")]
        [JsonPropertyName("__v")]
        public int V { get; set; }
    }
}
