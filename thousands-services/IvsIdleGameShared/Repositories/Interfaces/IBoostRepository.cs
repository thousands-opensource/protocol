using System;
using IvsIdleGameShared.Models.Boost;

namespace IvsIdleGameShared.Repositories.Interfaces;

public interface IBoostRepository
{
    Task AddBoost(string stageId, int segment, Boost boost);
    Task AddBoosts(string stageId, int segment, Boost[] boosts);
    Task<List<BoostsSegement>> GetBoostsSegments(string stageId);
    Task<BoostsSegement> GetBoosts(string stageId, int segment);
    Task<List<BoostOutput>> GetBoosts(string stageId, int segment, string? userId);
}
