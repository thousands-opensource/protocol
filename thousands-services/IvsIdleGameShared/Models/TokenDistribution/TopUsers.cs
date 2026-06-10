using System;
using System.Text.Json.Serialization;

namespace IvsIdleGameShared.Models.TokenDistribution;

public class TopUsers
{
    [JsonPropertyName("userId")]
    public string UserId { get; set; } = "";
    [JsonPropertyName("allocatedTokens")]
    public int AllocatedTokens { get; set; } = 0;
    [JsonPropertyName("scoreBreakdown")]
    public ScoreBreakdown ScoreBreakdown { get; set; } = new ScoreBreakdown();
    [JsonPropertyName("fanId")]
    public string FanId { get; set; } = "";
    [JsonPropertyName("fanName")]
    public string FanName { get; set; } = "";
    [JsonPropertyName("walletAddress")]
    public string WalletAddress { get; set; } = "";
}
