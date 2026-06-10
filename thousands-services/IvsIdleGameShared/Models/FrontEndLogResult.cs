using System;
using System.Text.Json.Serialization;

namespace IvsIdleGameShared.Models;

public class FrontEndLogResult
{
    [JsonPropertyName("errorMessage")]
    public string? ErrorMessage { get; set; } = string.Empty;
}

public class PurchaseSkyboxResult : FrontEndLogResult
{
    [JsonPropertyName("skybox")]
    public Skybox.Skybox? Skybox { get; set; }
    [JsonPropertyName("pubnubToken")]
    public string? PubnubToken { get; set; }
}

public class AcceptInviteResult : FrontEndLogResult
{
    [JsonPropertyName("skybox")]
    public Skybox.Skybox? Skybox { get; set; }
    [JsonPropertyName("pubnubToken")]
    public string? PubnubToken { get; set; }
}

public class RemoveUserResult : FrontEndLogResult
{
    // public Skybox.Skybox? Skybox { get; set; }
    // public string? PubnubToken { get; set; }
}

public class UpdatedSkyboxResult : FrontEndLogResult
{
    [JsonPropertyName("skybox")]
    public Skybox.Skybox? Skybox { get; set; }

}

public class PurchaseSponsorshipResult : FrontEndLogResult
{
}
