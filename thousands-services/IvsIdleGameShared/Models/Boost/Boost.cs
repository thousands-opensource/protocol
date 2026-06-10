using System;
using MongoDB.Bson.Serialization.Attributes;

namespace IvsIdleGameShared.Models.Boost;

public class Boost
{
    [BsonElement("userId")]
    public string UserId { get; set; } = "";
    
    [BsonElement("boostType")]
    public string BoostType { get; set; } = "";
    
    [BsonElement("boostAmount")]
    public int BoostAmount { get; set; } = 0;
    
    [BsonElement("boostPrice")]
    public int BoostPrice { get; set; } = 0;
    
    [BsonElement("identityId")]
    public string IdentityId { get; set; } = "";
    
    [BsonElement("transactionId")]
    public string TransactionId { get; set; } = "";

    [BsonElement("vendorEventId")]
    public string VendorEventId { get; set; } = "";
    
    [BsonElement("stageId")]
    public string StageId { get; set; } = "";

    [BsonElement("timestamp")]
    public long Timestamp { get; set; } = 0;

    [BsonElement("skyboxId")]
    public string? SkyboxId { get; set; } = null;

    [BsonElement("skyboxTier")]
    public int? SkyboxTier { get; set; } = null;
}
