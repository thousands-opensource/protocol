using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace IvsIdleGameShared.Models;

public class Channel
{
    [BsonId]
    [BsonElement("_id")]
    public ObjectId Id { get; set; }
    [BsonElement("name")]
    public string Name { get; set; } = "";
    [BsonElement("src")]
    public string Src { get; set; } = "";
}
