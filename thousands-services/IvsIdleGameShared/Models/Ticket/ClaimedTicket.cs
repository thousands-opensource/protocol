using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices.JavaScript;
using System.Text;
using System.Threading.Tasks;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace IvsIdleGameShared.Models.Ticket
{
    [BsonIgnoreExtraElements]
    public class ClaimedTicket
    {
        [BsonId]
        [BsonElement("_id")]
        public ObjectId Id { get; set; }

        [BsonElement("userId")]
        public ObjectId UserId { get; set; }

        [BsonElement("eventId")] 
        public string EventId { get; set; } = "";

        [BsonElement("tier")] 
        public string Tier { get; set; } = "";

        [BsonElement("organizationId")]
        public ObjectId? OrganizationId { get; set; } // organization associated with the ticket

        [BsonElement("creditMultiplier")]
        public int CreditMultiplier { get; set; } = 1; // credit multiplier associated with the ticket

        [BsonElement("accessCodeId")]
        public ObjectId? AccessCodeId { get; set; }

        [BsonElement("createdAt")]
        public DateTime? CreatedAt { get; set; }

        [BsonElement("updatedAt")]
        public DateTime? UpdatedAt { get; set; }

        [BsonElement("__v")]
        public int? Version { get; set; }
    }
}
