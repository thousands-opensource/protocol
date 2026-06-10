using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.Request
{
    public class GetCallsForForecastsRequest
    {
        [JsonPropertyName("includeFreeCalls")] 
        public string IncludeFreeCalls { get; set; } = "false";

        [JsonPropertyName("onlyIncludeResolvedForecasts")]
        public string OnlyIncludeResolvedForecasts { get; set; } = "false";

        [JsonPropertyName("forecastId")]
        public string? ForecastId { get; set; } = null;
    }
}
