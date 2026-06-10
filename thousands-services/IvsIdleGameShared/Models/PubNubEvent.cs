using System.Text.Json.Serialization;

/*
 * {
 * "schema":"pubnub.com/schemas/events/presence.channel.state.active?v=1.0.0",
 * "data":[
 * { * "id":"1d558c0f-78d8-576a47bb0658",
 * "timestamp":
 * "1992-01-01T10:00:20.021Z",
 * "subKey":"SUBKEY-HERE",
 * "channel":"CHANNEL-NAME"}
 * ]
 * }
 */

namespace IvsIdleGameShared.Models
{
    public class Action
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = "";

        [JsonPropertyName("instanceId")]
        public string InstanceId { get; set; } = "";

        [JsonPropertyName("invocation")]
        public Invocation? Invocation { get; set; }
    }

    public class Data2
    {
        [JsonPropertyName("action")]
        public string Action { get; set; } = "";

        [JsonPropertyName("occupancy")]
        public string Occupancy { get; set; } = "";

        [JsonPropertyName("timestamp")]
        public string Timestamp { get; set; } = "";

        [JsonPropertyName("uuid")]
        public string Uuid { get; set; } = "";

        [JsonPropertyName("precise_timestamp")]
        public string PreciseTimestamp { get; set; } = "";

    }

    public class Data
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = "";

        [JsonPropertyName("channel")]
        public string Channel { get; set; } = "";

        [JsonPropertyName("userId")]
        public string UserId { get; set; } = "";

        [JsonPropertyName("data")]
        public Data2? Data2 { get; set; }

        [JsonPropertyName("subKey")]
        public string SubKey { get; set; } = "";
    }

    public class Definitional
    {
        [JsonPropertyName("pubsub.channel")]
        public string PubSubChannel { get; set; } = "";
    }

    public class EventData
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = "";

        [JsonPropertyName("payload")]
        public Payload? Payload { get; set; }
    }

    public class Invocation
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = "";

        [JsonPropertyName("attempt")]
        public int Attempt { get; set; }
    }

    public class Metadata
    {
        [JsonPropertyName("definitional")]
        public List<Definitional>? Definitional { get; set; }

        [JsonPropertyName("provenance")]
        public Provenance? Provenance { get; set; }
    }

    public class Payload
    {
        [JsonPropertyName("dataSchema")]
        public string DataSchema { get; set; } = "";

        [JsonPropertyName("data")]
        public List<Data>? Data { get; set; }
    }

    public class Provenance
    {
        [JsonPropertyName("listenerId")] 
        public string ListenerId { get; set; } = "";

        [JsonPropertyName("action")]
        public Action? Action { get; set; }
    }

    public class PubNubEvent
    {
        [JsonPropertyName("event")]
        public EventData? Event { get; set; }

        [JsonPropertyName("metadata")]
        public Metadata? Metadata { get; set; }

        [JsonPropertyName("schema")]
        public string Schema { get; set; } = "";
    }

    /*
    public class PubNubEvent
    {
        public string Id { get; set; } = "";
        public string Timestamp { get; set; } = "";
        public string SubKey { get; set; } = "";
        public string Channel { get; set; } = "";
    }

    public class PubNubEvents
    {

        public PubNubEvent[] Data { get; set; } = new PubNubEvent[1];
    }
    */
}
