using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.RallyPrediction
{
    [BsonIgnoreExtraElements]
    public class PredictionChartData
    {
        [BsonId]
        [BsonElement("_id")]
        public ObjectId Id { get; set; }

        [BsonElement("rallyPredictionId")]
        public ObjectId RallyPredictionId { get; set; }

        [BsonElement("price")]
        public double Price { get; set; } = 0;

        [BsonElement("timestamp")]
        public DateTime Timestamp { get; set; } = DateTime.MinValue;

        [BsonElement("__v")]
        public int Version { get; set; } = 0;
    }
}
