using IvsIdleGameShared.Models.Users;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace IvsIdleGameShared.Models
{
    public enum UserRole
    {
        Admin,
        Organizer
    }
    [BsonIgnoreExtraElements]
    public class BeamableProvider
    {
        [BsonElement("id")]
        [JsonPropertyName("id")]
        public string? Id { get; set; } = string.Empty;

        [BsonElement("name")]
        [JsonPropertyName("name")]
        public string? Name { get; set; } = string.Empty;

        [BsonElement("email")]
        [JsonPropertyName("email")]
        public string? Email { get; set; } = string.Empty;

        [BsonElement("isVerified")]
        [JsonPropertyName("isVerified")]
        public bool IsVerified { get; set; } = false;
    }

    [BsonIgnoreExtraElements]
    public class GoogleProvider
    {
        [BsonElement("id")]
        [JsonPropertyName("id")]
        public string? id { get; set; } = string.Empty;

        [BsonElement("name")]
        [JsonPropertyName("name")]
        public string? Name { get; set; } = string.Empty;

        [BsonElement("image")]
        [JsonPropertyName("image")]
        public string? Image { get; set; } = string.Empty;

        [BsonElement("email")]
        [JsonPropertyName("email")]
        public string? Email { get; set; } = string.Empty;
    }

    [BsonIgnoreExtraElements]
    public class TwitterProvider
    {
        [BsonElement("id")]
        [JsonPropertyName("id")]
        public string? id { get; set; } = string.Empty;

        [BsonElement("name")]
        [JsonPropertyName("name")]
        public string? Name { get; set; } = string.Empty;

        [BsonElement("image")]
        [JsonPropertyName("image")]
        public string? Image { get; set; } = string.Empty;

        [BsonElement("email")]
        [JsonPropertyName("email")]
        public string? Email { get; set; } = string.Empty;
    }

    [BsonIgnoreExtraElements]
    public class DiscordProvider
    {
        [BsonElement("id")]
        [JsonPropertyName("id")]
        public string? id { get; set; } = string.Empty;

        [BsonElement("name")]
        [JsonPropertyName("name")]
        public string? Name { get; set; } = string.Empty;

        [BsonElement("image")]
        [JsonPropertyName("image")]
        public string? Image { get; set; } = string.Empty;

        [BsonElement("email")]
        [JsonPropertyName("email")]
        public string? Email { get; set; } = string.Empty;
    }

    [BsonIgnoreExtraElements]
    public class TwitchProvider
    {
        [BsonElement("id")]
        [JsonPropertyName("id")]
        public string? id { get; set; } = string.Empty;

        [BsonElement("name")]
        [JsonPropertyName("name")]
        public string? Name { get; set; } = string.Empty;

        [BsonElement("image")]
        [JsonPropertyName("image")]
        public string? Image { get; set; } = string.Empty;

        [BsonElement("email")]
        [JsonPropertyName("email")]
        public string? Email { get; set; } = string.Empty;
    }

    [BsonIgnoreExtraElements]
    public class Pfp
    {
        [BsonElement("imageUrl")]
        [JsonPropertyName("imageUrl")]
        public string? ImageUrl { get; set; } = string.Empty;
    }

    [BsonIgnoreExtraElements]
    public class Preferences
    {
        [BsonElement("displayName")]
        [JsonPropertyName("displayName")]
        public string? DisplayName { get; set; } = string.Empty;

        [BsonElement("avatarThemeColor")]
        [JsonPropertyName("avatarThemeColor")]
        public string? AvatarThemeColor { get; set; } = string.Empty;

        [BsonElement("showLinkedSocials")]
        [JsonPropertyName("showLinkedSocials")]
        public bool ShowLinkedSocials { get; set; } = false;

        [BsonElement("sendNotifications")]
        [JsonPropertyName("sendNotifications")]
        public bool SendNotifications { get; set; } = false;

        [BsonElement("activePfpImageUrl")]
        [JsonPropertyName("activePfpImageUrl")]
        public string? ActivePfpImageUrl { get; set; } = String.Empty;
    }

    [BsonIgnoreExtraElements]
    public class WalletProvider
    {
        [BsonElement("address")]
        [JsonPropertyName("address")]
        public string? Address { get; set; } = "";

        [BsonElement("additionalWallets")]
        [JsonPropertyName("additionalWallets")]
        public List<string>? AdditionalWallets { get; set; } = null;

        [BsonElement("wildfile")]
        [JsonPropertyName("wildfile")]
        public Wildfile? Wildfile { get; set; } = null;

        [BsonElement("pfp")]
        [JsonPropertyName("pfp")]
        public Pfp? Pfp { get; set; } = null;
    }

    [BsonIgnoreExtraElements]
    public class Wildfile
    {
        [BsonElement("initialWildfileId")]
        [JsonPropertyName("initialWildfileId")]
        public int InitialWildfileId { get; set; }
    }

    [BsonIgnoreExtraElements]
    public class User
    {
        [BsonId]
        [BsonElement("_id")]
        [JsonPropertyName("_id")]
        public ObjectId Id { get; set; }

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

        [BsonElement("twitchProvider")]
        [JsonPropertyName("twitchProvider")]
        public TwitchProvider? TwitchProvider { get; set; } = null;

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

        [BsonElement("accumulatedPersonalCredits")]
        [JsonPropertyName("accumulatedPersonalCredits")]
        public int AccumulatedPersonalCredits { get; set; }
    }

}
