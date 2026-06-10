using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models
{
    public class GameEventData
    {
        [JsonPropertyName("Team0Champion")]
        [BsonElement("Team0Champion")]
        public string Team0Champion { get; set; } = "";

        [JsonPropertyName("Team1Champion")]
        [BsonElement("Team1Champion")]
        public string Team1Champion { get; set; } = "";

        [JsonPropertyName("Team0Sidekick")]
        [BsonElement("Team0Sidekick")]
        public string Team0Sidekick { get; set; } = "";

        [JsonPropertyName("Team1Sidekick")]
        [BsonElement("Team1Sidekick")]
        public string Team1Sidekick { get; set; } = "";

        [JsonPropertyName("Team0Name")]
        [BsonElement("Team0Name")]
        public string Team0Name { get; set; } = "";

        [JsonPropertyName("Team0GamerTag")]
        [BsonElement("Team0GamerTag")]
        public string Team0GamerTag { get; set; } = "";

        [JsonPropertyName("Team1Name")]
        [BsonElement("Team1Name")]
        public string Team1Name { get; set; } = "";

        [JsonPropertyName("Team1GamerTag")]
        [BsonElement("Team1GamerTag")]
        public string Team1GamerTag { get; set; } = "";

        [JsonPropertyName("Team0ShortName")]
        [BsonElement("Team0ShortName")]
        public string Team0ShortName { get; set; } = "";

        [JsonPropertyName("Team0Color")]
        [BsonElement("Team0Color")]
        public string Team0Color { get; set; } = "";

        [JsonPropertyName("Team1ShortName")]
        [BsonElement("Team1ShortName")]
        public string Team1ShortName { get; set; } = "";

        [JsonPropertyName("Team1Color")]
        [BsonElement("Team1Color")]
        public string Team1Color { get; set; } = "";
    }
}
