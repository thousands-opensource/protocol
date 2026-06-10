using System;
using System.Text.Json.Serialization;

namespace IvsIdleGameShared.Models.Skybox;

public class SkyboxInvite
{
    [JsonPropertyName("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [JsonPropertyName("userId")]
    public string UserId { get; set; } = string.Empty;

    [JsonPropertyName("userName")]
    public string UserName { get; set; } = string.Empty;

    [JsonPropertyName("skyboxId")]
    public string SkyboxId { get; set; } = string.Empty;
}
