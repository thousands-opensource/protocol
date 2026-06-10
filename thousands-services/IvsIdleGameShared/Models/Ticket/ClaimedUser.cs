using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MongoDB.Bson;

namespace IvsIdleGameShared.Models.Ticket
{
    [BsonIgnoreExtraElements]
    public class ClaimedUser
    {
        [BsonElement("claimedCodeEventId")]
        public ObjectId? ClaimedCodeEventId { get; set; }

        [BsonElement("claimedBy")]
        public ObjectId ClaimedBy { get; set; }
    }
}
