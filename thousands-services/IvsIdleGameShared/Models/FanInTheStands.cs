using System.Text.Json.Serialization;
using IvsIdleGameShared.Models.Wildcard;

namespace IvsIdleGameShared.Models
{
  /*
   {
     "FanID": "222857828833034252",
     "FanName": "lummyd1",
     "FanPfpUrl": "https://cdn.discordapp.com/avatars/1033649440029954048/2709a76935ddbd12b8fee37ffba39456.png?size=128",
     "bHasWildFile": true,
     "bHasWildfilePfp": false,
     "bHasWalletAddress": false,
     "WildfileAgeDays": 10,
     "Timestamp": 1698631802,
     "seatSectionNumber": 1,
     "seatScore": 4
     }
   */
  public class FanInTheStands
  {
    public string FanId { get; set; } = "";
    public string FanName { get; set; } = "";
    public string FanPfpUrl { get; set; } = "";
    public bool HasWildFile { get; set; } = false;
    public bool HasWildfilePfp { get; set; } = false;
    public bool HasWalletAddress { get; set; } = false;
    public string? WalletAddress { get; set; } = null;
    public string[]? AdditionalWalletAddresses { get; set; } = null;
    public int WildfileAgeDays { get; set; } = 0;
    public long Timestamp { get; set; } = 0;
    public int SeatSectionNumber { get; set; } = 0;
    public int SeatScore { get; set; } = 0;
    public List<Wildpass> Wildpasses { get; set; } = new List<Wildpass>();
    public List<SwagPin> SwagPins { get; set; } = new List<SwagPin>();
  }

  public class SkyboxFan
  {
    [JsonPropertyName("id")]
    public string FanId { get; set; } = string.Empty;
    [JsonPropertyName("name")]
    public string FanName { get; set; } = string.Empty;
    [JsonPropertyName("pfpUrl")]
    public string FanPfpUrl { get; set; } = string.Empty;
    [JsonPropertyName("skyboxId")]
    public string? SkyboxId { get; set; } = string.Empty;
  }
}
