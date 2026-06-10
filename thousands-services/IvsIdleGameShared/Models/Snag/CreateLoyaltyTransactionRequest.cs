using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.Snag
{
    public class CreateLoyaltyTransactionRequest
    {
        [JsonPropertyName("walletAddress")] public string WalletAddress { get; set; } = "";
        [JsonPropertyName("transactionId")] public string TransactionId { get; set; } = "";
        [JsonPropertyName("amount")] public int Amount { get; set; } = 0;
    }
}
