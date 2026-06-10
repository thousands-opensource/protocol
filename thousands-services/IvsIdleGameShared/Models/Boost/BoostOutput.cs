using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.Boost
{
    [BsonIgnoreExtraElements]
    public class BoostOutput
    {
        [BsonElement("userId")]
        [JsonPropertyName("userId")]
        public string UserId { get; set; } = "";
        
        [BsonElement("boostType")]
        [JsonPropertyName("boostType")]
        public string BoostType { get; set; } = "";
        
        [BsonElement("boostAmount")]
        [JsonPropertyName("boostAmount")]
        public int BoostAmount { get; set; } = 0;
        
        [BsonElement("boostPrice")]
        [JsonPropertyName("boostPrice")]
        public int BoostPrice { get; set; } = 0;

        [BsonElement("timestamp")]
        [JsonPropertyName("timestamp")]
        public long Timestamp { get; set; } = 0;
    }
}
