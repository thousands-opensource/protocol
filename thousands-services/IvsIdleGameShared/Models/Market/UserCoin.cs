using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.Market
{
    [BsonIgnoreExtraElements]
    public class UserCoin
    {
        [BsonId]
        [BsonElement("_id")]
        public ObjectId Id { get; set; }

        [BsonElement("userId")]
        public string UserId { get; set; } = "";

        [BsonElement("coinHoldings")]
        public CoinHolding[]? CoinHoldings { get; set; }

        public void AddCoinHolding(CoinHolding coinHolding)
        {
            if (CoinHoldings == null)
            {
                CoinHoldings = new CoinHolding[1];
                CoinHoldings[0] = coinHolding;
            }
            else
            {
                var newCoinHoldings = new List<CoinHolding>(CoinHoldings);
                newCoinHoldings.Add(coinHolding);
                CoinHoldings = newCoinHoldings.ToArray();
            }
        }
    }
}
