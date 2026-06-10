using System;
using IvsIdleGameShared.Models.Skybox;

namespace IvsIdleGameShared.Repositories.Interfaces;

public interface ISkyboxRepository
{
    Task<bool> AddSkybox(Skybox skybox);
    Task<bool> UpdateSkybox(Skybox skybox);
    Task<bool> AddMemberToSkybox(string skyboxId, string memberId);
    Task<bool> RemoveMemberFromSkybox(string skyboxId, string memberId);
    Task<Skybox?> GetSkyboxById(string skyboxId);
    Task<Skybox?> GetSkyboxByOwnerUserId(string userId);
    Task<bool> MemberExistsInSkybox(string skyboxId, string userId);
    Task<List<Skybox>> GetAllSkyboxesByStageId(string stageId);
}
