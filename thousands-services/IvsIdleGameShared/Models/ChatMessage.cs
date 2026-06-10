using System.Text.Json.Serialization;

namespace IvsIdleGameShared.Models
{
    public class ChatMessageUser
    {
        [JsonPropertyName("id")]
        public string id { get; set; } = string.Empty;
    }

    public class ChatMessage
    {
        [JsonPropertyName("timestamp")]
        public long timestamp { get; set; } = 0;

        [JsonPropertyName("durationMs")]
        public long durationMs { get; set; } = 0;

        [JsonPropertyName("text")]
        public string text { get; set; } = string.Empty;
        
        [JsonPropertyName("type")]
        public string type { get; set; } = string.Empty;
        
        [JsonPropertyName("user")]
        public ChatMessageUser? user { get; set; } = null;
        
        [JsonPropertyName("icon")]
        public string icon { get; set; } = string.Empty;
        
        [JsonPropertyName("actionLabel")]
        public string actionLabel { get; set; } = string.Empty;

        [JsonPropertyName("chatActionGuid")]
        public string chatActionGuid { get; set; } = string.Empty;

        [JsonPropertyName("eventId")]
        public string eventId { get; set; } = string.Empty;

        [JsonPropertyName("optionAImageUrl")]
        public string optionAImageUrl { get; set; } = string.Empty;

        [JsonPropertyName("optionBImageUrl")]
        public string optionBImageUrl { get; set; } = string.Empty;

        [JsonPropertyName("textOptions")]
        public string[]? textOptions { get; set; } = null;
    }
}
