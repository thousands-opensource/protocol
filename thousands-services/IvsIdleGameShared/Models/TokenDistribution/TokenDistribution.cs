using System;
using System.Text.Json.Serialization;

namespace IvsIdleGameShared.Models.TokenDistribution;

public class TokenDistribution
{
    [JsonPropertyName("stageId")]
    public string StageId { get; set; } = "";
    [JsonPropertyName("insights")]
    public Insights[] Insights { get; set; } = [];
    [JsonPropertyName("distributionResult")]
    public DistributionResult DistributionResult { get; set; } = new DistributionResult();
    [JsonPropertyName("totalTokens")]
    public int TotalTokens { get; set; } = 0;
    [JsonPropertyName("maxTokensPerUser")]
    public int MaxTokensPerUser { get; set; } = 0;
    [JsonPropertyName("noOfUsersDistributed")]
    public int NoOfUsersDistributed { get; set; } = 0;
}

