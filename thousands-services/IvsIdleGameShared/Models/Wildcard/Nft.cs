using System;
using System.Text.Json.Serialization;

namespace IvsIdleGameShared.Models.Wildcard;

public class Nft
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = "";

    [JsonPropertyName("description")]
    public string Description { get; set; } = "";

    [JsonPropertyName("imageUrl")]
    public string? ImageUrl { get; set; }

    [JsonPropertyName("balance")]
    public long Balance { get; set; } = 0;

    [JsonPropertyName("contractAddress")]
    public string ContractAddress { get; set; } = "";
}