using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace IvsIdleGameShared.Models
{
    [BsonIgnoreExtraElements]
    public class EventStream
    {
        [BsonId]
        [BsonElement("_id")]
        public ObjectId Id { get; set; }

        [BsonElement("stageId")]
        public ObjectId? StageId { get; set; }

        [BsonElement("vendorEventId")]
        public string? VendorEventId { get; set; }

        [BsonElement("name")]
        public string? Name { get; set; }

        [BsonElement("description")]
        public string? Description { get; set; }

        [BsonElement("status")]
        public string? Status { get; set; }

        [BsonElement("createdAt")]
        public DateTime? CreatedAt { get; set; }

        [BsonElement("updatedAt")]
        public DateTime? UpdatedAt { get; set; }

        //[BsonIgnore]
        //[BsonElement("__v")]
        //public int __v { get; set; }

        [BsonElement("cameraOperatorParticipantToken")]
        public string? CameraOperatorParticipantToken { get; set; }

        [BsonElement("channelArn")]
        public string? ChannelArn { get; set; }

        [BsonElement("channelPlaybackUrl")]
        public string? ChannelPlaybackUrl { get; set; }

        [BsonElement("chatRoomArn")]
        public string? ChatRoomArn { get; set; }

        [BsonElement("stageArn")]
        public string? StageArn { get; set; }

    }
}
