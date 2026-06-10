using System;
using System.Text.Json.Serialization;

namespace IvsIdleGameShared.Models;

public class WildcardApiNextJSResponse<T>
{
    [JsonPropertyName("success")]
    public bool Success { get; set; } = false;

    [JsonPropertyName("data")]
    public T? Data { get; set; }

    [JsonPropertyName("err")]
    public string? Error { get; set; }
}
