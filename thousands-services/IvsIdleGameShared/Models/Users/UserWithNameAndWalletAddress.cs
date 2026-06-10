using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.Users
{
    public class UserWithNameAndWalletAddress
    {
        [JsonPropertyName("userId")]
        public string Id { get; set; } = String.Empty;

        [JsonPropertyName("userName")]
        public string UserName { get; set; } = String.Empty;

        [JsonPropertyName("walletAddress")]
        public string WalletAddress { get; set; } = String.Empty;
    }
}
