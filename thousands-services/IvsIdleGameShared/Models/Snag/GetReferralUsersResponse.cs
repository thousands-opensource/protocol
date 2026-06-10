using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.Snag
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;

    public class GetReferralUsersResponse
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; }

        [JsonPropertyName("data")]
        public GetReferralUsersResponseData? Data { get; set; }
    }

    public class GetReferralUsersResponseData
    {
        [JsonPropertyName("data")]
        public List<UserDataWrapper> Data { get; set; }

        [JsonPropertyName("hasNextPage")]
        public bool HasNextPage { get; set; }
    }

    public class UserDataWrapper
    {
        [JsonPropertyName("id")]
        public string Id { get; set; }

        [JsonPropertyName("temporaryLoyaltyUser")]
        public bool TemporaryLoyaltyUser { get; set; }

        [JsonPropertyName("isSnagSuperAdmin")]
        public bool IsSnagSuperAdmin { get; set; }

        [JsonPropertyName("walletAddress")]
        public string? WalletAddress { get; set; }

        [JsonPropertyName("walletType")]
        public string? WalletType { get; set; }

        [JsonPropertyName("privyUserId")]
        public string? PrivyUserId { get; set; }

        [JsonPropertyName("notifications")] 
        public object? Notifications { get; set; } = null;

        [JsonPropertyName("referrers")] 
        public List<Referrer>? Referrers { get; set; } = null;

        [JsonPropertyName("userMetadata")] 
        public List<UserMetadata>? UserMetadata { get; set; } = null;

        [JsonPropertyName("websiteUserAttributes")]
        public List<object>? WebsiteUserAttributes { get; set; } = null;
    }

    public class ReferralCode
    {
        [JsonPropertyName("user")]
        public ReferrerUser? User { get; set; }
    }

    public class Referrer
    {
        [JsonPropertyName("eligible")]
        public bool Eligible { get; set; }

        [JsonPropertyName("user")]
        public ReferrerUser? User { get; set; }

        [JsonPropertyName("referralCode")] 
        public ReferralCode? ReferralCode { get; set; } = null;
    }

    public class ReferrerUser
    {
        [JsonPropertyName("id")]
        public string? Id { get; set; }

        [JsonPropertyName("walletAddress")]
        public string? WalletAddress { get; set; }
    }

    public class UserMetadata
    {
        [JsonPropertyName("userId")]
        public string? UserId { get; set; }

        [JsonPropertyName("emailAddress")]
        public string? EmailAddress { get; set; }

        [JsonPropertyName("emailVerifiedAt")]
        public DateTime? EmailVerifiedAt { get; set; }

        [JsonPropertyName("discordUser")]
        public string? DiscordUser { get; set; }

        [JsonPropertyName("discordVerifiedAt")]
        public DateTime? DiscordVerifiedAt { get; set; }

        [JsonPropertyName("twitterUser")]
        public string? TwitterUser { get; set; }

        [JsonPropertyName("twitterVerifiedAt")]
        public DateTime? TwitterVerifiedAt { get; set; }

        [JsonPropertyName("instagramUser")]
        public string? InstagramUser { get; set; }

        [JsonPropertyName("instagramVerifiedAt")]
        public DateTime? InstagramVerifiedAt { get; set; }

        [JsonPropertyName("logoUrl")]
        public string? LogoUrl { get; set; }

        [JsonPropertyName("displayName")]
        public string? DisplayName { get; set; }

        [JsonPropertyName("location")]
        public string? Location { get; set; }

        [JsonPropertyName("bio")]
        public string? Bio { get; set; }

        [JsonPropertyName("portfolioUrl")]
        public string? PortfolioUrl { get; set; }

        [JsonPropertyName("meta")]
        public object? Meta { get; set; }

        [JsonPropertyName("walletGroupIdentifier")]
        public string? WalletGroupIdentifier { get; set; }

        [JsonPropertyName("twitterUserFollowersCount")]
        public int? TwitterUserFollowersCount { get; set; }

        [JsonPropertyName("telegramUserId")]
        public string? TelegramUserId { get; set; }

        [JsonPropertyName("telegramVerifiedAt")]
        public DateTime? TelegramVerifiedAt { get; set; }

        [JsonPropertyName("telegramUsername")]
        public string? TelegramUsername { get; set; }

        [JsonPropertyName("isBlocked")]
        public bool IsBlocked { get; set; }

        [JsonPropertyName("steamUserId")]
        public string? SteamUserId { get; set; }

        [JsonPropertyName("steamUsername")]
        public string? SteamUsername { get; set; }

        [JsonPropertyName("epicUsername")]
        public string? EpicUsername { get; set; }

        [JsonPropertyName("epicAccountIdentifier")]
        public string? EpicAccountIdentifier { get; set; }

        [JsonPropertyName("userGroupId")]
        public string? UserGroupId { get; set; }

        [JsonPropertyName("externalLoyaltyScore")]
        public int? ExternalLoyaltyScore { get; set; }

        [JsonPropertyName("userGroup")]
        public object? UserGroup { get; set; }

        [JsonPropertyName("externalIdentifier")]
        public string? ExternalIdentifier { get; set; }

        [JsonPropertyName("YTChannelId")]
        public string? YTChannelId { get; set; }

        [JsonPropertyName("googleUserId")]
        public string? GoogleUserId { get; set; }

        [JsonPropertyName("googleUser")]
        public object? GoogleUser { get; set; }

        [JsonPropertyName("internalNotes")]
        public string? InternalNotes { get; set; }

        [JsonPropertyName("blockStatusReason")]
        public string? BlockStatusReason { get; set; }

        [JsonPropertyName("isBlockExempt")]
        public bool IsBlockExempt { get; set; }

        [JsonPropertyName("tiktokUser")]
        public string? TiktokUser { get; set; }

        [JsonPropertyName("tiktokUserId")]
        public string? TiktokUserId { get; set; }

        [JsonPropertyName("tiktokVerifiedAt")]
        public DateTime? TiktokVerifiedAt { get; set; }

        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; }

        [JsonPropertyName("updatedAt")]
        public DateTime UpdatedAt { get; set; }
    }

}
