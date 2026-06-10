using System;
using System.Text.Json.Serialization;

namespace IvsIdleGameShared.Models.Skybox;

public enum MessageType
{
    PurchaseSkybox,
    InviteUser,
    AcceptInvite,
    RemoveUser,
    Message
}

public class SkyboxSignalMessage<T>
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;
    [JsonPropertyName("data")]
    public required T Data { get; set; }
}

public class PubnubBase
{
    [JsonPropertyName("pubnubToken")]
    public string PubnubToken { get; set; } = string.Empty;
}

public class PurchaseSkybox : PubnubBase { }

public class InviteUser
{
    [JsonPropertyName("skyboxInviteId")]
    public string SkyboxInviteId { get; set; } = string.Empty;
    [JsonPropertyName("skyboxName")]
    public string SkyboxName { get; set; } = string.Empty;
    [JsonPropertyName("skyboxOwnerId")]
    public string SkyboxOwnerId { get; set; } = string.Empty;
}

public class AcceptInvite : PubnubBase
{
    [JsonPropertyName("skybox")]
    public Skybox? Skybox { get; set; }

}

public class RemoveUser : PubnubBase { }

