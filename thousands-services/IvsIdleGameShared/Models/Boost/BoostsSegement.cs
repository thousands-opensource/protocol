using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace IvsIdleGameShared.Models.Boost;

[BsonIgnoreExtraElements]
public class BoostsSegement
{
    [BsonId]
    [BsonElement("_id")]
    public ObjectId Id { get; set; }
    [BsonElement("stageId")]
    public string StageId { get; set; } = "";

    [BsonElement("segment")]
    public int Segment { get; set; } = 0;
    [BsonElement("boosts")]
    public List<Boost> Boosts { get; set; } = new List<Boost>();

}
