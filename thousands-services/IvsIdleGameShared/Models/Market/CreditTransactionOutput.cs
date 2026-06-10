using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.Market
{
    [BsonIgnoreExtraElements]
    public class CreditTransactionOutput
    {
        [BsonId]
        [JsonPropertyName("_id")]
        [BsonElement("_id")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = "";

        [JsonPropertyName("userId")]
        [BsonElement("userId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string UserId { get; set; } = "";

        [JsonPropertyName("transactionId")]
        [BsonElement("transactionId")]
        public string TransactionId { get; set; } = "";

        [JsonPropertyName("amount")]
        [BsonElement("amount")]
        public int Amount { get; set; } = 0;

        [JsonPropertyName("currency")]
        [BsonElement("currency")]
        public string Currency { get; set; } = "";

        [JsonPropertyName("paymentMethod")]
        [BsonElement("paymentMethod")]
        public string PaymentMethod { get; set; } = "";

        [JsonPropertyName("paymentGateway")]
        [BsonElement("paymentGateway")]
        public string PaymentGateway { get; set; } = "";

        [JsonPropertyName("paymentGatewayTransactionId")]
        [BsonElement("paymentGatewayTransactionId")]
        public string? PaymentGatewayTransactionId { get; set; } = "";

        [JsonPropertyName("refundedAmount")]
        [BsonElement("refundedAmount")]
        public int RefundedAmount { get; set; } = 0;

        [JsonPropertyName("status")]
        [BsonElement("status")]
        public string Status { get; set; } = "";

        [JsonPropertyName("createdAt")]
        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.MinValue;

        [JsonPropertyName("updatedAt")]
        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.MinValue;

        [JsonPropertyName("v")]
        [BsonElement("__v")]
        public int Version { get; set; } = 0;
    }
}
