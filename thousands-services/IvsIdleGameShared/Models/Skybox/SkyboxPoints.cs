using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.Skybox
{
    public class SkyboxPoints
    {
        public SkyboxIdAndTier SkyboxIdAndTier = new SkyboxIdAndTier();
        public int CreditsSpent { get; set; } = 0;
        public int PredictionBonus { get; set; } = 0;
    }
}
