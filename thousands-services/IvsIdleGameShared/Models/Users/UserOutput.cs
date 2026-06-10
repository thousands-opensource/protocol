using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.Users
{
    [BsonIgnoreExtraElements]
    public class UserOutput
    {
        [BsonId]
        [BsonElement("_id")]
        [JsonPropertyName("id")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = "";

        [BsonElement("preferredProvider")]
        [JsonPropertyName("preferredProvider")]
        public string? PreferredProvider { get; set; } = string.Empty;

        [BsonElement("walletProvider")]
        [JsonPropertyName("walletProvider")]
        public WalletProvider? WalletProvider { get; set; } = null;

        [BsonElement("googleProvider")]
        [JsonPropertyName("googleProvider")]
        public GoogleProvider? GoogleProvider { get; set; } = null;

        [BsonElement("twitterProvider")]
        [JsonPropertyName("twitterProvider")]
        public TwitterProvider? TwitterProvider { get; set; } = null;

        [BsonElement("discordProvider")]
        [JsonPropertyName("discordProvider")]
        public DiscordProvider? DiscordProvider { get; set; } = null;

        [BsonElement("roles")]
        [JsonPropertyName("roles")]
        public List<string>? Roles { get; set; } = null;

        [BsonElement("status")]
        [JsonPropertyName("status")]
        public string? Status { get; set; } = string.Empty;

        [BsonElement("preferences")]
        [JsonPropertyName("preferences")]
        public Preferences? Preferences { get; set; } = null;

        [BsonElement("createdAt")]
        [JsonPropertyName("createdAt")]
        public DateTime? CreatedAt { get; set; } = null;

        [BsonElement("updatedAt")]
        [JsonPropertyName("updatedAt")]
        public DateTime? UpdatedAt { get; set; } = null;

        [BsonElement("__v")]
        [JsonPropertyName("__v")]
        public int V { get; set; }

        [BsonElement("beamableProvider")]
        [JsonPropertyName("beamableProvider")]
        public BeamableProvider? BeamableProvider { get; set; } = null;

        [BsonElement("latestFeatureRelease")]
        [JsonPropertyName("latestFeatureRelease")]
        public int LatestFeatureRelease { get; set; }

    }

}
