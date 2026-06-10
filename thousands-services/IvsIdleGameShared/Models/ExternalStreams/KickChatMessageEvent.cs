using System;
using System.Text.Json.Serialization;

namespace IvsIdleGameShared.Models.ExternalStreams
{
    public class KickChatMessageEvent
    {
        [JsonPropertyName("kickChannelId")]
        public int KickChannelId { get; set; }

        [JsonPropertyName("chatMessageDateTime")]
        public DateTime ChatMessageDateTime { get; set; }

        [JsonPropertyName("userId")]
        public string UserId { get; set; } = string.Empty;

        [JsonPropertyName("messageText")]
        public string MessageText { get; set; } = string.Empty;
    }
}
