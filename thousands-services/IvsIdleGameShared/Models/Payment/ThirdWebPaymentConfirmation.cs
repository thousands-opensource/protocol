using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.Payment
{

    public class BuyWithCryptoStatus
    {
        [JsonPropertyName("swapType")]
        public string SwapType { get; set; } = "";

        [JsonPropertyName("source")]
        public Source Source { get; set; } = new();

        [JsonPropertyName("status")]
        public string Status { get; set; } = "";

        [JsonPropertyName("subStatus")]
        public string SubStatus { get; set; } = "";

        [JsonPropertyName("fromAddress")]
        public string FromAddress { get; set; } = "";

        [JsonPropertyName("toAddress")]
        public string ToAddress { get; set; } = "";

        [JsonPropertyName("quote")]
        public Quote Quote { get; set; } = new();

        [JsonPropertyName("purchaseData")]
        public PurchaseData PurchaseData { get; set; } = new();

        [JsonPropertyName("destination")]
        public Destination Destination { get; set; } = new();
    }

    public class Data
    {
        [JsonPropertyName("buyWithCryptoStatus")]
        public BuyWithCryptoStatus BuyWithCryptoStatus { get; set; } = new();
    }

    public class Destination
    {
        [JsonPropertyName("transactionHash")]
        public string TransactionHash { get; set; } = "";

        [JsonPropertyName("token")]
        public Token Token { get; set; } = new();

        [JsonPropertyName("amountWei")]
        public string AmountWei { get; set; } = "";

        [JsonPropertyName("amount")]
        public string Amount { get; set; } = "";

        [JsonPropertyName("amountUSDCents")]
        public int? AmountUSDCents { get; set; }

        [JsonPropertyName("completedAt")]
        public DateTime? CompletedAt { get; set; }
    }

    public class Estimated
    {
        [JsonPropertyName("fromAmountUSDCents")]
        public int? FromAmountUSDCents { get; set; }

        [JsonPropertyName("toAmountMinUSDCents")]
        public int? ToAmountMinUSDCents { get; set; }

        [JsonPropertyName("toAmountUSDCents")]
        public int? ToAmountUSDCents { get; set; }

        [JsonPropertyName("slippageBPS")]
        public int? SlippageBPS { get; set; }

        [JsonPropertyName("feesUSDCents")]
        public int? FeesUSDCents { get; set; }

        [JsonPropertyName("gasCostUSDCents")]
        public int? GasCostUSDCents { get; set; }

        [JsonPropertyName("durationSeconds")]
        public int? DurationSeconds { get; set; }
    }

    public class FromToken
    {
        [JsonPropertyName("chainId")]
        public int? ChainId { get; set; }

        [JsonPropertyName("tokenAddress")]
        public string TokenAddress { get; set; } = "";

        [JsonPropertyName("decimals")]
        public int? Decimals { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } = "";

        [JsonPropertyName("symbol")]
        public string Symbol { get; set; } = "";

        [JsonPropertyName("priceUSDCents")]
        public int? PriceUSDCents { get; set; }
    }

    public class PurchaseData
    {
        [JsonPropertyName("userId")]
        public string UserId { get; set; } = "";

        [JsonPropertyName("credits")]
        public int Credits { get; set; } = 0;

        [JsonPropertyName("transactionId")]
        public string TransactionId { get; set; } = "";

        [JsonPropertyName("identityId")]
        public string IdentityId { get; set; } = "";

        [JsonPropertyName("sponsoredEventId")]
        public string SponsoredEventId { get; set; } = "";

        [JsonPropertyName("sponsorshipSlotId")]
        public string SponsorshipSlotId { get; set; } = "";
    }

    public class Quote
    {
        [JsonPropertyName("fromToken")]
        public FromToken FromToken { get; set; } = new();

        [JsonPropertyName("toToken")]
        public ToToken ToToken { get; set; } = new();

        [JsonPropertyName("fromAmountWei")]
        public string FromAmountWei { get; set; } = "";

        [JsonPropertyName("fromAmount")]
        public string FromAmount { get; set; } = "";

        [JsonPropertyName("toAmountWei")]
        public string ToAmountWei { get; set; } = "";

        [JsonPropertyName("toAmount")]
        public string ToAmount { get; set; } = "";

        [JsonPropertyName("toAmountMinWei")]
        public string ToAmountMinWei { get; set; } = "";

        [JsonPropertyName("toAmountMin")]
        public string ToAmountMin { get; set; } = "";

        [JsonPropertyName("estimated")]
        public Estimated Estimated { get; set; } = new();

        [JsonPropertyName("createdAt")]
        public DateTime? CreatedAt { get; set; }
    }

    public class Source
    {
        [JsonPropertyName("transactionHash")]
        public string TransactionHash { get; set; } = "";

        [JsonPropertyName("token")]
        public Token Token { get; set; } = new();

        [JsonPropertyName("amountWei")]
        public string AmountWei { get; set; } = "";

        [JsonPropertyName("amount")]
        public string Amount { get; set; } = "";

        [JsonPropertyName("amountUSDCents")]
        public int? AmountUSDCents { get; set; }

        [JsonPropertyName("completedAt")]
        public DateTime? CompletedAt { get; set; }
    }

    public class Token
    {
        [JsonPropertyName("chainId")]
        public int? ChainId { get; set; }

        [JsonPropertyName("tokenAddress")]
        public string TokenAddress { get; set; } = "";

        [JsonPropertyName("decimals")]
        public int? Decimals { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } = "";

        [JsonPropertyName("symbol")]
        public string Symbol { get; set; } = "";

        [JsonPropertyName("priceUSDCents")]
        public int? PriceUSDCents { get; set; }
    }

    public class ToToken
    {
        [JsonPropertyName("chainId")]
        public int? ChainId { get; set; }

        [JsonPropertyName("tokenAddress")]
        public string TokenAddress { get; set; } = "";

        [JsonPropertyName("decimals")]
        public int? Decimals { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } = "";

        [JsonPropertyName("symbol")]
        public string Symbol { get; set; } = "";

        [JsonPropertyName("priceUSDCents")]
        public int? PriceUSDCents { get; set; }
    }

    public class ThirdWebPaymentConfirmation
    {
        [JsonPropertyName("data")]
        public Data Data { get; set; } = new();
    }
}
