using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.RallyPrediction
{
    [BsonIgnoreExtraElements]
    public class UserRallyPrediction
    {
        [BsonId]
        [BsonElement("_id")]
        public ObjectId Id { get; set; }

        [BsonElement("userId")]
        public ObjectId UserId { get; set; }

        [BsonElement("rallyPredictionId")]
        public ObjectId RallyPredictionId { get; set; }

        [BsonElement("amount")]
        public int Amount { get; set; } = 0;

        [BsonElement("price")]
        public double Price { get; set; } = 0;
        
        [BsonElement("forOrAgainst")]
        public bool ForOrAgainst { get; set; } = false;

        [BsonElement("questionText")]
        public string QuestionText { get; set; } = "";

        [BsonElement("selectedOptionText")]
        public string SelectedOptionText { get; set; } = "";

        [BsonElement("selectedOptionColor")]
        public string SelectedOptionColor { get; set; } = "";

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.MinValue;

        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.MinValue;

        [BsonElement("__v")]
        public int Version { get; set; } = 0;
    }
}
