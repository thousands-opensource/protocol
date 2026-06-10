using System;
using System.Text.Json.Serialization;

namespace IvsIdleGameShared.Models;

public class ActivityItem
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = "";

    [JsonPropertyName("time")]
    public DateTime Time { get; set; } = new DateTime();

    [JsonPropertyName("txnHash")]
    public string TxnHash { get; set; } = "";
}
