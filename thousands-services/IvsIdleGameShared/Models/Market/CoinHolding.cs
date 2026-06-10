using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MongoDB.Bson;

namespace IvsIdleGameShared.Models.Market
{
    [BsonIgnoreExtraElements]
    public class CoinHolding
    {
        [BsonElement("coinName")]
        public string CoinName { get; set; } = "";

        [BsonElement("quantity")]
        public int Quantity { get; set; } = 0;

        [BsonElement("avgPurchasePrice")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal AvgPurchasePrice { get; set; } = 0M;
    }
}
