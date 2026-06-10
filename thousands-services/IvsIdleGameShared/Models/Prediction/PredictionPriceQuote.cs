using System;

namespace IvsIdleGameShared.Models.Prediction;

public class PredictionPriceQuote
{
    public Guid PriceQuoteGuid { get; set; } = Guid.NewGuid();
    public string StageId { get; set; } = string.Empty;
    public int Segment { get; set; } = 0;
    public Prediction Prediction { get; set; } = new Prediction();
    public string? TimeSegment { get; set; } = null;

}
