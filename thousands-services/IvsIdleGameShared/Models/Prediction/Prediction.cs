using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.Prediction
{
    public class Prediction
    {
        public string UserId { get; set; } = string.Empty;
        public string TeamName { get; set; } = "red";
        public int Credits { get; set; } = 0;
        public decimal Price { get; set; } = 0.0M;
        public long Timestamp { get; set; } = 0;
        public string? SkyboxId { get; set; } = null;
        public int? SkyboxTier { get; set; } = null;
    }
}
