using System;

namespace IvsIdleGameShared.Models.Prediction;

// If wasOrderPlaced is true, then includes valid Prediction object. If wasOrderPlaced is false, then contains PredictionPriceQuote
public class ConfirmPredictionResult
{
    public bool WasOrderPlaced { get; set; } = false;
    public string ErrorMessage { get; set; } = string.Empty;
    public int UpdatedCreditBalance { get; set; } = -1;
    public PredictionPriceQuote? PriceQuote { get; set; } = null;
    public Prediction? Prediction { get; set; } = null;
}
