using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.Skybox
{
    public class SkyboxIdAndTier
    {
        [JsonPropertyName("skyboxId")]
        public string SkyboxId { get; set; } = "";

        [JsonPropertyName("skyboxTier")]
        public int SkyboxTier { get; set; } = 1;
    }
}
