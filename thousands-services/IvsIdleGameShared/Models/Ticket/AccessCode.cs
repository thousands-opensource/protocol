using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices.JavaScript;
using System.Text;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.Ticket
{
    [BsonIgnoreExtraElements]
    public class AccessCode
    {
        [BsonId]
        [BsonElement("_id")]
        public ObjectId Id { get; set; }

        [BsonElement("organizationId")]
        public ObjectId? OrganizationId { get; set; } = null;

        [BsonElement("accessCode")] 
        public string AccessCodeValue { get; set; } = "";

        [BsonElement("isClaimed")]
        public bool IsClaimed { get; set; } = false;

        [BsonElement("claimedUsers")]
        public ClaimedUser[] ClaimedUsers { get; set; } = Array.Empty<ClaimedUser>();

        [BsonElement("seriesId")]
        public ObjectId? SeriesId { get; set; } = null;

        [BsonElement("codeType")]
        public string CodeType { get; set; } = ""; // SINGLE_USE, MULTI_USE, VOUCHER

        [BsonElement("maxQuantity")] 
        public int MaxQuantity { get; set; } = 0; // max number of times the code can be used / redeemed

        [BsonElement("intent")]
        public string Intent { get; set; } = "";

        [BsonElement("tier")] 
        public string? Tier { get; set; } = null;

        [BsonElement("accessRoles")]
        public string[]? AccessRoles { get; set; } = null;

        [BsonElement("partnerId")]
        public ObjectId? PartnerId { get; set; } = null;

        [BsonElement("createdAt")]
        public DateTime? CreatedAt { get; set; } = null;

        [BsonElement("updatedAt")]
        public DateTime? UpdatedAt { get; set; } = null;

        [BsonElement("__v")]
        public int? Version { get; set; } = null;
    }
}
