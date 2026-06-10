using System;
using System.Text.Json.Serialization;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace IvsIdleGameShared.Models.Skybox;

[BsonIgnoreExtraElements]
public class Skybox
{
    [BsonId]
    [BsonElement("_id")]
    [JsonIgnore]
    public ObjectId Id { get; set; }

    [JsonPropertyName("_id")]
    public string IdString => Id.ToString();

    [BsonElement("stageId")]
    [JsonPropertyName("stageId")]
    public string StageId { get; set; } = string.Empty;

    // [BsonElement("skyboxSlotNumber")]
    // [JsonPropertyName("skyboxSlotNumber")]
    // public int SkyboxSlotNumber { get; set; } = 0;

    [BsonElement("ownerUserId")]
    [JsonPropertyName("ownerUserId")]
    public string OwnerUserId { get; set; } = string.Empty;

    [BsonElement("skyboxName")]
    [JsonPropertyName("skyboxName")]
    public string SkyboxName { get; set; } = string.Empty;

    [BsonElement("skyboxPrimaryColor")]
    [JsonPropertyName("skyboxPrimaryColor")]
    public string SkyboxPrimaryColor { get; set; } = string.Empty;

    [BsonElement("skyboxTier")]
    [JsonPropertyName("skyboxTier")]
    public int SkyboxTier { get; set; } = 0;

    [BsonElement("skyboxLogoUrl")]
    [JsonPropertyName("skyboxLogoUrl")]
    public string SkyboxLogoUrl { get; set; } = string.Empty;

    [BsonElement("skyboxChannelMembers")]
    [JsonPropertyName("skyboxChannelMembers")]
    public List<string> SkyboxChannelMembers { get; set; } = new List<string>();

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
