using System.Text.Json.Serialization;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace IvsIdleGameShared.Models.Sponsorship;

[BsonIgnoreExtraElements]
public class SponsoredEvent
{
    [BsonId]
    [BsonElement("_id")]
    [JsonIgnore]
    public ObjectId Id { get; set; }

    [JsonPropertyName("_id")]
    public string IdString => Id.ToString();

    [BsonElement("sponsorshipSlots")]
    public List<SponsorshipSlot> SponsorshipSlots { get; set; } = new List<SponsorshipSlot>();
}

[BsonIgnoreExtraElements]
public class SponsorshipSlot
{
    [BsonElement("maxSlots")]
    public int MaxSlots { get; set; } = 0;

    [BsonElement("creditsPrice")]
    public int CreditsPrice { get; set; } = 0;

    [BsonElement("usdcPrice")]
    public int UsdcPrice { get; set; } = 0;

    [BsonElement("packageDescription")]
    public string PackageDescription { get; set; } = string.Empty;

    [BsonElement("baseWC")]
    public int BaseWC { get; set; } = 0;

    [BsonElement("tier")]
    public int Tier { get; set; } = 0;

    [BsonElement("house")]
    public int House { get; set; } = 0;

    [BsonElement("sponsorshipSlotId")]
    public ObjectId SponsorshipSlotId { get; set; }
}
