using System;
using System.Text.Json.Serialization;

namespace IvsIdleGameShared.Models.TokenDistribution;

public class Insights
{
    [JsonPropertyName("metric")]
    public string Metric { get; set; } = "";
    [JsonPropertyName("userId")]
    public string UserId { get; set; } = "";
    [JsonPropertyName("summary")]
    public string Summary { get; set; } = "";
    [JsonPropertyName("title")]
    public string Title { get; set; } = "";
    [JsonPropertyName("category")]
    public string Category { get; set; } = "";
    [JsonPropertyName("fanName")]
    public string FanName { get; set; } = "";
    [JsonPropertyName("fanPfpUrl")]
    public string FanPfpUrl { get; set; } = "";
    [JsonPropertyName("allocatedTokens")]
    public int AllocatedTokens { get; set; } = 0;
    [JsonPropertyName("data")]
    public string data { get; set; } = "";
}
