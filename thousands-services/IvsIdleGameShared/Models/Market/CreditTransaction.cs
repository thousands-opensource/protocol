using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.Market
{
    [BsonIgnoreExtraElements]
    public class CreditTransaction
    {
        [BsonId]
        [BsonElement("_id")]
        public ObjectId Id { get; set; }

        [BsonElement("userId")]
        public ObjectId UserId { get; set; }

        [BsonElement("transactionId")]
        public string TransactionId { get; set; } = "";

        [BsonElement("amount")]
        public int Amount { get; set; } = 0;

        [BsonElement("currency")]
        public string Currency { get; set; } = "";

        [BsonElement("paymentMethod")]
        public string PaymentMethod { get; set; } = "";

        [BsonElement("paymentGateway")]
        public string PaymentGateway { get; set; } = "";

        [BsonElement("paymentGatewayTransactionId")]
        public string? PaymentGatewayTransactionId { get; set; } = null;

        [BsonElement("refundedAmount")]
        public int RefundedAmount { get; set; } = 0;

        [BsonElement("status")]
        public string Status { get; set; } = "";

        [BsonElement("creditType")]
        public string? CreditType { get; set; } = null;

        [BsonElement("stageId")]
        public string? StageId { get; set; } = null;

        [BsonElement("segment")]
        public int? Segment { get; set; } = null;

        [BsonElement("skyboxTier")]
        public int? SkyboxTier { get; set; } = null;


        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.MinValue;

        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.MinValue;

        [BsonElement("__v")]
        public int Version { get; set; } = 0;
    }

    public static class CreditTransactionType
    {
        public const string CREDIT = "credit";
        public const string BOOST = "boost";
        public const string SKYBOX_PURCHASE = "skybox_purchase";
        public const string SPONSORSHIP_PURCHASE = "sponsorship_purchase";
        public const string ADMIN_ADJUSTMENT = "admin_adjustment";
    }
}
