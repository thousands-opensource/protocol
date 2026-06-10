using System;
using System.Text.Json.Serialization;
using IvsIdleGameShared.Models;
namespace IvsIdleGameShared.Models.TokenDistribution;

public class DistributionResult
{
    [JsonPropertyName("topUsers")]
    public List<TopUsers> TopUsers { get; set; } = new List<TopUsers>();
    [JsonPropertyName("totalTokensDistributed")]
    public int TotalTokensDistributed { get; set; } = 0;
}
