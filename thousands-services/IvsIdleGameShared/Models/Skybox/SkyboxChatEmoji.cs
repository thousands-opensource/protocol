using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.Skybox
{
    public class SkyboxChatEmoji
    {
        [JsonPropertyName("skyboxId")]
        public string SkyboxId { get; set; } = String.Empty;

        [JsonPropertyName("emoji")]
        public string Emoji { get; set; } = String.Empty;

        [JsonPropertyName("emojiCount")]
        public int EmojiCount { get; set; } = 1;
    }
}
