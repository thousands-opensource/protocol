using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.Request
{
    public class GetUsersRequest
    {
        [JsonPropertyName("userId")]
        public string? UserId { get; set; } = null;

        [JsonPropertyName("displayName")]
        public string? DisplayName { get; set; } = null;

        [JsonPropertyName("walletAddress")]
        public string? WalletAddress { get; set; } = null;

        [JsonPropertyName("page")]
        public string? PageString { get; set; } = null;

        [JsonPropertyName("pageSize")]
        public string? PageSizeString { get; set; } = null;
    }
}
