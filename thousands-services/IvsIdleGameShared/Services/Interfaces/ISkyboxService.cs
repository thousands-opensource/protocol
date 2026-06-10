using System;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Models.Skybox;

namespace IvsIdleGameShared.Services.Interfaces;

public interface ISkyboxService
{
    Task<PurchaseSkyboxResult> PurchaseSkybox(string userId, string stageId, int skyboxTier, bool isModerator);
    Task<FrontEndLogResult> InviteMemberToSkybox(string ownerUserId, string memberUserId, string stageId, string skyboxId);
    Task<RemoveUserResult> RemoveMemberFromSkybox(string ownerUserId, string memberUserId, string stageId, string skyboxId);
    Task<AcceptInviteResult> AcceptSkyboxInvite(Guid skyboxInviteGuid);
    Task<bool> RejectSkyboxInvite(Guid skyboxInviteGuid);
    Task<UpdatedSkyboxResult> UpdateSkybox(string userId, string skyboxId, string skyboxName, string skyboxPrimaryColor, string skyboxLogoUrl);
    Task<List<SkyboxFan>> SearchFans(string ownerUserId, string fanName, string stageId, string skyboxId);
    Task<Skybox?> GetSkyboxUserIsIn(string stageId, string userId);
    Task<string?> GrantChannelPermissionsForUser(string stageId, string userId, Skybox? skyboxUserIsIn);
}
