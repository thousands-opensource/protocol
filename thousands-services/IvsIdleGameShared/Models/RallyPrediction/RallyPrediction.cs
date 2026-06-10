using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.RallyPrediction
{
    [BsonIgnoreExtraElements]
    public class RallyPrediction
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public ObjectId Id { get; set; }

        [BsonElement("title")]
        public string Title { get; set; } = string.Empty;

        [BsonElement("subTitle")]
        public string SubTitle { get; set; } = string.Empty;

        [BsonElement("optionAText")]
        public string OptionAText { get; set; } = string.Empty;

        [BsonElement("optionBText")]
        public string OptionBText { get; set; } = string.Empty;

        [BsonElement("optionAButtonColor")]
        public string OptionAButtonColor { get; set; } = string.Empty;

        [BsonElement("optionBButtonColor")]
        public string OptionBButtonColor { get; set; } = string.Empty;

        [BsonElement("startDate")]
        public DateTime StartDate { get; set; }

        [BsonElement("endDate")]
        public DateTime EndDate { get; set; }

        [BsonElement("maxCreditSpend")]
        public int MaxCreditSpend { get; set; } = 0;

        [BsonElement("wcAmount")] 
        public int WcAmount { get; set; } = 0;

        [BsonElement("imageUrl")]
        [BsonIgnoreIfNull]
        public string? ImageUrl { get; set; }

        [BsonElement("resolvedChoice")]
        [BsonIgnoreIfNull]
        public bool? ResolvedChoice { get; set; }

        [BsonElement("cmsId")]
        public string CmsId { get; set; } = string.Empty;

        [BsonElement("__v")]
        [BsonIgnoreIfNull]
        public int? Version { get; set; }

        [BsonElement("createdAt")]
        [BsonIgnoreIfNull]
        public DateTime? CreatedAt { get; set; }

        [BsonElement("updatedAt")]
        [BsonIgnoreIfNull]
        public DateTime? UpdatedAt { get; set; }
    }
}