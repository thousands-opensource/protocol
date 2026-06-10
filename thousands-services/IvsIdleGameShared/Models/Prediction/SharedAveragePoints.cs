using System;

namespace IvsIdleGameShared.Models.Prediction;

public class SharedAveragePoints
{
    public decimal RedTeamAveragePoints { get; set; } = 0.00M;
    public decimal BlueTeamAveragePoints { get; set; } = 0.00M;
    public int TotalUniqueUserCount { get; set; } = 0;
}
