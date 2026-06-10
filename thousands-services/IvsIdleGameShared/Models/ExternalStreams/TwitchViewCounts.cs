using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.ExternalStreams
{
    public class TwitchViewCounts
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; }

        [JsonPropertyName("data")]
        public ViewCountData Data { get; set; }

        [JsonPropertyName("message")]
        public string Message { get; set; }
    }

    public class ViewCountData
    {
        [JsonPropertyName("viewerCounts")]
        public List<ViewerCount> ViewerCounts { get; set; }

        [JsonPropertyName("timestamp")]
        public DateTime Timestamp { get; set; }

        [JsonPropertyName("totalRequested")]
        public int TotalRequested { get; set; }

        [JsonPropertyName("totalLive")]
        public int TotalLive { get; set; }
    }

    public class ViewerCount
    {
        [JsonPropertyName("user_id")]
        public string UserId { get; set; }

        [JsonPropertyName("user_login")]
        public string UserLogin { get; set; }

        [JsonPropertyName("viewer_count")]
        public int ViewerCountValue { get; set; }

        [JsonPropertyName("is_live")]
        public bool IsLive { get; set; }
    }

}
