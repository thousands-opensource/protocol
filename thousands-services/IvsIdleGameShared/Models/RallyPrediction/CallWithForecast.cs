using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.RallyPrediction
{
    public class CallWithForecast
    {
        [JsonPropertyName("forecastId")] 
        public string ForecastId { get; set; } = "";

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("optionAText")]
        public string OptionAText { get; set; } = string.Empty;

        [JsonPropertyName("optionBText")]
        public string OptionBText { get; set; } = string.Empty;

        [JsonPropertyName("startDate")]
        public DateTime StartDate { get; set; }

        [JsonPropertyName("endDate")]
        public DateTime EndDate { get; set; }

        [JsonPropertyName("maxCreditSpend")]
        public int MaxCreditSpend { get; set; } = 0;

        [JsonPropertyName("wcAmount")]
        public int WcAmount { get; set; } = 0;

        [JsonPropertyName("resolvedChoice")]
        public bool? ResolvedChoice { get; set; }


        [JsonPropertyName("callId")]
        public string CallId { get; set; } = "";

        [JsonPropertyName("userId")]
        public string UserId { get; set; } = "";

        [JsonPropertyName("userName")]
        public string UserName { get; set; } = "";

        [JsonPropertyName("walletAddress")]
        public string WalletAddress { get; set; } = "";

        [JsonPropertyName("callMadeAt")]
        public DateTime CallMadeAt { get; set; } = DateTime.MinValue;

        [JsonPropertyName("amount")]
        public int Amount { get; set; } = 0;

        [JsonPropertyName("price")]
        public double Price { get; set; } = 0;

        [JsonPropertyName("userSelectedAorB")]
        public bool ForOrAgainst { get; set; } = false;

        [JsonPropertyName("selectedOptionText")]
        public string SelectedOptionText { get; set; } = "";
    }
}
