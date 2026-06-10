using System;
using System.Text.Json.Serialization;

namespace IvsIdleGameShared.Models.TokenDistribution;

public class ScoreBreakdown
{
    [JsonPropertyName("boostScore")]
    public decimal BoostScore { get; set; } = 0.00M;
    [JsonPropertyName("nftHoldingsScore")]
    public decimal NftHoldingsScore { get; set; } = 0.00M;
    [JsonPropertyName("reactionScore")]
    public decimal ReactionScore { get; set; } = 0.00M;
    [JsonPropertyName("messageScore")]
    public decimal MessageScore { get; set; } = 0.00M;
    [JsonPropertyName("compositeScore")]
    public decimal CompositeScore { get; set; } = 0.00M;
}