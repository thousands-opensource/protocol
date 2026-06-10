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
    public class MarketTransaction
    {
        [BsonId]
        [BsonElement("_id")]
        public ObjectId Id { get; set; }

        [BsonElement("userId")]
        public string UserId { get; set; } = "";

        [BsonElement("timestamp")]
        [BsonRepresentation(BsonType.Int64)]
        public long Timestamp { get; set; }

        [BsonElement("coinName")] 
        public string CoinName { get; set; } = "";

        [BsonElement("orderType")]
        public string OrderType { get; set; } = "";

        [BsonElement("quantity")]
        public int Quantity { get; set; }

        [BsonElement("totalValue")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal TotalValue { get; set; }

        [BsonElement("tax")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal Tax { get; set; }
    }
}
