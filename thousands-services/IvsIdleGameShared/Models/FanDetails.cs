using System;
using System.Text.Json.Serialization;
using IvsIdleGameShared.Models.Wildcard;

namespace IvsIdleGameShared.Models;

public class FanDetails
{

    [JsonPropertyName("wildpasses")]
    public List<Wildpass> Wildpasses { get; set; } = new List<Wildpass>();

    [JsonPropertyName("swagPins")]
    public List<SwagPin> SwagPins { get; set; } = new List<SwagPin>();

    [JsonPropertyName("wildEventsActivity")]
    public List<ActivityItem> WildEventsActivity { get; set; } = new List<ActivityItem>();

    [JsonPropertyName("fanuniqueSwagPins")]
    public int FanUniqueSwagPins { get; set; } = 0;

    [JsonPropertyName("fanuniqueWildpasses")]
    public int FanUniqueWildpasses { get; set; } = 0;

    [JsonPropertyName("maxSwapPins")]
    public int MaxSwapPins { get; set; } = 0;

    [JsonPropertyName("maxTotalSwagPins")]
    public int MaxTotalSwagPins { get; set; } = 0;

    [JsonPropertyName("maxTotalWildpasses")]
    public int MaxTotalWildpasses { get; set; } = 0;

    [JsonPropertyName("walletAddress")]
    public string WalletAddress { get; set; } = "";
}
