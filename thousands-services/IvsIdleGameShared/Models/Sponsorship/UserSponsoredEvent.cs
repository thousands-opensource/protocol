using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace IvsIdleGameShared.Models.Sponsorship;

[BsonIgnoreExtraElements]
public class UserSponsoredEvent
{
    [BsonId]
    [BsonElement("_id")]
    public ObjectId Id { get; set; }

    [BsonElement("userId")]
    public ObjectId UserId { get; set; }

    [BsonElement("sponsoredEventId")]
    public ObjectId SponsoredEventId { get; set; }

    [BsonElement("sponsorshipSlotId")]
    public ObjectId SponsorshipSlotId { get; set; }

    [BsonElement("usdcPrice")]
    public int UsdcPrice { get; set; } = 0;

    [BsonElement("tier")]
    public int Tier { get; set; } = 0;

    [BsonElement("house")]
    public int House { get; set; } = 0;

    [BsonElement("wcEarned")]
    public int WcEarned { get; set; } = 0;

    [BsonElement("thousandsXpEarned")]
    public int ThousandsXpEarned { get; set; } = 0;

    [BsonElement("support")]
    public int Support { get; set; } = 0;

    [BsonElement("claimedOn")]
    public DateTime? ClaimedOn { get; set; } = null;

    [BsonElement("paidOn")]
    public DateTime? PaidOn { get; set; } = null;

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.MinValue;

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.MinValue;

    [BsonElement("__v")]
    public int Version { get; set; } = 0;
}
