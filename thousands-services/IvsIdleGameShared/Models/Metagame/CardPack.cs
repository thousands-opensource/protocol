using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.Metagame
{
    [BsonIgnoreExtraElements]
    public class CardPack
    {
        [BsonId]
        [BsonElement("_id")]
        public ObjectId Id { get; set; }

        [BsonElement("userId")]
        public ObjectId UserId { get; set; }

        [BsonElement("houseId")]
        public int HouseId { get; set; } = 0;

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.MinValue;

        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.MinValue;

        [BsonElement("__v")]
        public int Version { get; set; } = 0;
    }
}
