using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using IvsIdleGameShared.Models.Leaderboard;
using IvsIdleGameShared.Models.Market;

namespace IvsIdleGameShared.Models.IdleGame
{
    public class IdleGamePlayerActionResponse
    {
        public bool Success { get; set; } = false;
        public string Err { get; set; } = "";
        public long Timestamp { get; set; } = 0;
        public decimal RolledUpPersonalCredits { get; set; } = 0;
        public IdleEvent? IdleEvent { get; set; } = null;
        public IdleEvent[]? IdleEvents { get; set; } = null;
        public PlaceOrderResult? PlaceOrderResult { get; set; } = null;
        public int Button1Supply { get; set; } = 0;
        public int Button2Supply { get; set; } = 0;
        public int Button3Supply { get; set; } = 0;
        public long StreamScore { get; set; } = 0;

        public decimal RedBlueRatio { get; set; } = 0;
        public decimal RedSharedBoostComboMultiplier { get; set; } = 0M;
        public decimal BlueSharedBoostComboMultiplier { get; set; } = 0M;
        public int RedBoostProgress { get; set; } = 0;
        public long RedPersonalProgressStartTime { get; set; } = 0;
        public int BlueBoostProgress { get; set; } = 0;
        public long BluePersonalProgressStartTime { get; set; } = 0;
        public int RoundNumber { get; set; } = 0;
        public long EventMatchStartTime { get; set; } = 0;
        public bool IsEventMatchActive { get; set; } = false;
        public int TotalRedBoost { get; set; } = 0;
        public int TotalBlueBoost { get; set; } = 0;
        public decimal? PredictionRedPrice { get; set; } = 0.00M;
        public decimal? PredictionBluePrice { get; set; } = 0.00M;
        public int? PredictionPersonalCreditsSpentRed { get; set; } = 0;
        public int? PredictionPersonalCreditsSpentBlue { get; set; } = 0;
        public decimal? PredictionAveragePriceRed { get; set; } = 0.00M;
        public decimal? PredictionAveragePriceBlue { get; set; } = 0.00M;
        public decimal? PredictionAveragePointsRed { get; set; } = 0.00M;
        public decimal? PredictionAveragePointsBlue { get; set; } = 0.00M;
        public int? PredictionTotalUniqueUserCount { get; set; } = 0;

        public List<Leader>? Leaders { get; set; } = null;
        public List<Skybox.Skybox> Skyboxes { get; set; } = new List<Skybox.Skybox>();

        public string? PubNubToken { get; set; } = null;
    }
}
