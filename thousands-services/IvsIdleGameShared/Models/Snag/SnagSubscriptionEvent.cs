using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace IvsIdleGameShared.Models.Snag
{
    public class SnagSubscriptionEvent
    {
        [JsonPropertyName("subscriptionId")]
        public string? SubscriptionId { get; set; }

        [JsonPropertyName("blockNumber")]
        public string? BlockNumber { get; set; }

        [JsonPropertyName("transactionHash")]
        public string? TransactionHash { get; set; }

        [JsonPropertyName("logIndex")]
        public int LogIndex { get; set; }

        [JsonPropertyName("eventSelector")]
        public string? EventSelector { get; set; }

        [JsonPropertyName("contractAddress")]
        public string? ContractAddress { get; set; }

        [JsonPropertyName("from")]
        public string? From { get; set; }

        [JsonPropertyName("to")]
        public string? To { get; set; }

        [JsonPropertyName("chainId")]
        public string? ChainId { get; set; }

        [JsonPropertyName("metadata")]
        public Dictionary<string, object>? Metadata { get; set; }

        [JsonPropertyName("eventAbi")]
        public string? EventAbi { get; set; }

        [JsonPropertyName("decodedEvent")]
        public DecodedEvent? DecodedEvent { get; set; }

        [JsonPropertyName("callbackUrl")]
        public string? CallbackUrl { get; set; }

        [JsonPropertyName("subscriptionEventId")]
        public string? SubscriptionEventId { get; set; }
    }

    public class DecodedEvent
    {
        [JsonPropertyName("eventName")]
        public string? EventName { get; set; }

        [JsonPropertyName("args")]
        public EventArgs? Args { get; set; }
    }

    public class EventArgs
    {
        [JsonPropertyName("mintedTo")]
        public string? MintedTo { get; set; }

        [JsonPropertyName("tokenIdMinted")]
        public string? TokenIdMinted { get; set; }

        [JsonPropertyName("uri")]
        public string? Uri { get; set; }

        [JsonPropertyName("quantityMinted")]
        public string? QuantityMinted { get; set; }
    }

}
