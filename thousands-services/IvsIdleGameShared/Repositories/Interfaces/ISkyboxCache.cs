using System;
using IvsIdleGameShared.Models.Skybox;

namespace IvsIdleGameShared.Repositories.Interfaces;

public interface ISkyboxCache
{
    Task<SkyboxInvite?> GetSkyboxInvite(Guid skyboxInviteGuid);
    Task<bool> StoreSkyboxInvite(SkyboxInvite skyboxInvite);
    Task<bool> RemoveSkyboxInvite(Guid skyboxInviteGuid);
    Task<bool> AddUserIdToSkyboxId(string stageId, string userId, string skyboxId, int skyboxTier);
    Task<SkyboxIdAndTier?> GetSkyboxIdFromUserId(string stageId, string userId);
    Task<bool> StartSkyboxPurchaseLatch(string stageId, string userId);
    Task<long?> GetSkyboxPurchaseLatchRank(string stageId, string userId);
    Task<bool> FailedToPurchaseSkyboxLatch(string stageId, string userId);
}
