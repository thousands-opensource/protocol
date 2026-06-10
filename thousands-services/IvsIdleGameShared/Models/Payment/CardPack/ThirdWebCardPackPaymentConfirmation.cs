using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.Payment.CardPack
{
    public class PurchaseData
    {
        [JsonPropertyName("userId")]
        public string UserId { get; set; } = "";

        [JsonPropertyName("cardPackHouseId")]
        public int CardPackHouseId { get; set; } = 0;
    }

    public class Data
    {
        [JsonPropertyName("transactionId")]
        public string TransactionId { get; set; } = "";

        [JsonPropertyName("paymentId")]
        public string PaymentId { get; set; } = "";

        [JsonPropertyName("action")]
        public string Action { get; set; } = "";

        [JsonPropertyName("status")]
        public string Status { get; set; } = "";

        [JsonPropertyName("originAmount")]
        public string OriginAmount { get; set; } = "";

        [JsonPropertyName("destinationAmount")]
        public string DestinationAmount { get; set; } = "";

        [JsonPropertyName("sender")]
        public string Sender { get; set; } = "";

        [JsonPropertyName("receiver")]
        public string Receiver { get; set; } = "";

        [JsonPropertyName("purchaseData")]
        public PurchaseData PurchaseData { get; set; } = new();
    }

    public class ThirdWebCardPackPaymentConfirmation
    {
        [JsonPropertyName("data")]
        public Data Data { get; set; } = new();
    }
}
