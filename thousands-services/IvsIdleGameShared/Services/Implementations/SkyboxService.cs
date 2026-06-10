using System;
using System.Runtime.InteropServices.Marshalling;
using System.Text.Json;
using Amazon.IVSRealTime.Model;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Models.Boost;
using IvsIdleGameShared.Models.Market;
using IvsIdleGameShared.Models.Skybox;
using IvsIdleGameShared.Repositories.Interfaces;
using IvsIdleGameShared.Services.Interfaces;
using MongoDB.Bson;
using PubnubApi;

namespace IvsIdleGameShared.Services.Implementations;

public class SkyboxService : ISkyboxService
{

    private readonly ICreditBalanceRepository _creditBalanceRepository;
    private readonly IStreamRepository _streamRepository;
    private readonly IWebSocketService _webSocketService;
    private readonly ISkyboxRepository _skyboxRepository;
    private readonly IFanVisibilityService _fanVisibilityService;
    private readonly ISkyboxCache _skyboxCache;

    // TEMP - Create a dictionary to map tier names to credit costs
    private readonly Dictionary<int, int> tierCreditMap = new Dictionary<int, int>()
    {
        { 1, 60000 },
        { 2, 120000 },
        { 3, 200000 }
    };

    // TEMP - Create a dictionary to map color names to hex values
    // * most likely we will store color names not hex values
    // * thus frontend can pull color name from db and retrieve correct mapping value
    private readonly Dictionary<string, string> colorMap = new Dictionary<string, string>()
    {
        { "gold", "#F9C74F" },
        { "orange", "#F3722C" },
        { "red", "#F94144" },
        { "pink", "#D95AA3" },
        { "purple", "#8B5CF6" },
        { "blue", "#4361EE" },
        { "teal", "#43AA8B" },
        { "green", "#4CAF50" },
        { "white", "#FFFFFF" },
        { "black", "#222222" }
    };

    private readonly string DEFAULT_SKYBOX_COLOR = "gold";
    private readonly int MAXIMUM_SKYBOX_SLOTS = 5;

    // TEMP - Create a dictionary to map tier to maximum channel members
    private readonly Dictionary<int, int> tierMaxMembersMap = new Dictionary<int, int>()
    {
        { 1, 4 },
        { 2, 10 },
        { 3, 20 }
    };

    public SkyboxService(IFanVisibilityService fanVisibilityService, ICreditBalanceRepository creditBalanceRepository,
         IStreamRepository streamRepository, IWebSocketService webSocketService, ISkyboxRepository skyboxRepository, ISkyboxCache skyboxCache
        )
    {
        _creditBalanceRepository = creditBalanceRepository;
        _streamRepository = streamRepository;
        _webSocketService = webSocketService;
        _skyboxRepository = skyboxRepository;
        _skyboxCache = skyboxCache;
        _fanVisibilityService = fanVisibilityService;
    }

    public async Task<PurchaseSkyboxResult> PurchaseSkybox(string userId, string stageId, int skyboxTier, bool isModerator)
    {
        Console.WriteLine($"user {userId} purchasing skybox in stage {stageId} with tier {skyboxTier}");
        // @note - optional: possible batch check for all conditions (performance boost)

        // Get the price for the selected skybox tier
        int skyboxPrice = tierCreditMap[skyboxTier];

        // Check whether stage exists
        IvsIdleGameShared.Models.Stage? stage = await _streamRepository.GetStage(stageId);
        if (stage == null)
        {
            Console.WriteLine($"ThousandsWarning: Stage not found for stageId: {stageId}");
            return new PurchaseSkyboxResult { ErrorMessage = "The selected event could not be found.  Please contact support!" };
        }

        // Check whether the stage is active
        if (stage.Status.ToLower() != "live")
        {
            Console.WriteLine($"ThousandsWarning: Stage is not live for stageId: {stageId}");
            return new PurchaseSkyboxResult { ErrorMessage = "The selected event is not active.  Please contact support!" };
        }

        int? segment = stage?.CurrentSegment;
        if (segment == null)
        {
            Console.WriteLine($"ThousandsWarning: Segment not found for stageId: {stageId}");
            return new PurchaseSkyboxResult { ErrorMessage = "The selected event is missing a segment.  Please contact support!" };
        }

        // Check if vendor event id exist
        if (String.IsNullOrEmpty(stage?.BeamableEventId))
        {
            Console.WriteLine($"ThousandsWarning: Vendor event ID not found for stageId: {stageId}");
            return new PurchaseSkyboxResult { ErrorMessage = "The selected event is missing a vendor event identifier.  Please contact support!" };
        }

        // Check user credit balance
        int creditBalance = await _creditBalanceRepository.GetCreditBalance(userId);
        if (creditBalance < skyboxPrice)
        {
            Console.WriteLine($"ThousandsWarning: Insufficient credits for userId: {userId}");
            return new PurchaseSkyboxResult { ErrorMessage = "Unable to purchase the skybox.  You don't have enough credits." };
        }

        // Check whether skybox slot limit has been reached
        List<Skybox> skyboxes = await _skyboxRepository.GetAllSkyboxesByStageId(stageId);
        if (skyboxes.Count >= MAXIMUM_SKYBOX_SLOTS)
        {
            Console.WriteLine($"ThousandsWarning: Skybox slot limit reached for stageId: {stageId}");
            return new PurchaseSkyboxResult { ErrorMessage = "Unable to purchase the skybox.  The maximum number of skyboxes has been reached." };
        }

        bool isSkyboxOwnerOrMember = IsSkyboxOwnerOrMember(userId, skyboxes);
        if (isSkyboxOwnerOrMember)
        {
            Console.WriteLine($"ThousandsWarning: User is already an owner or member of a skybox: {userId}");
            return new PurchaseSkyboxResult { ErrorMessage = "Can't purchase a skybox, because you are already an owner or member of a skybox!" };
        }

        string vendorEventId = stage.BeamableEventId;
        FanInTheStands? fanInTheStands = await _fanVisibilityService.GetFanInTheStands(vendorEventId, userId);
        if (fanInTheStands == null)
        {
            Console.WriteLine($"ThousandsWarning: Fan in the stands not found for userId: {userId}");
            return new PurchaseSkyboxResult { ErrorMessage = "Unable to find your user in this event.  Please try refreshing the page.  If this continues, please contact support!" };
        }

        string userDisplayName = fanInTheStands.FanName;

        //Start creating skybox data, so we need a latch
        var startSkyboxPurchaseLatchSuccess = await _skyboxCache.StartSkyboxPurchaseLatch(stageId, userId);

        if (!startSkyboxPurchaseLatchSuccess)
        {
            Console.WriteLine($"ThousandsWarning: StartSkyboxPurchaseLatch failed for stageId: {stageId}");
            return new PurchaseSkyboxResult { ErrorMessage = "Temporary issue purchasing the skybox.  You were not charged.  Please try again." };
        }

        ObjectId newSkyboxId = ObjectId.GenerateNewId();
        string newSkyboxIdString = newSkyboxId.ToString() ?? "";
        Skybox newSkybox = new Skybox();
        string pubnubToken = "";
        try
        {
            //Get position in skybox purchase latch
            long? skyboxPurchaseLatchRank = await _skyboxCache.GetSkyboxPurchaseLatchRank(stageId, userId);

            if (skyboxPurchaseLatchRank == null)
            {
                Console.WriteLine($"ThousandsWarning: GetSkyboxPurchaseLatchRank failed for stageId: {stageId} and userId: ");
                await _skyboxCache.FailedToPurchaseSkyboxLatch(stageId, userId);
                return new PurchaseSkyboxResult { ErrorMessage = "Temporary issue purchasing the skybox.  You were not charged.  Please try again." };
            }

            //You didn't get a skybox slot - skyboxPurchaseLatchRank is zero based
            if (skyboxPurchaseLatchRank >= MAXIMUM_SKYBOX_SLOTS)
            {
                Console.WriteLine($"ThousandsWarning: Skybox purchase latch slot limit reached for stageId: {stageId}");
                await _skyboxCache.FailedToPurchaseSkyboxLatch(stageId, userId);
                return new PurchaseSkyboxResult { ErrorMessage = "Unable to purchase the skybox.  The maximum number of skyboxes has been reached." };
            }
        
            // @todo - get default logo url in case fans in stand pfp not available
            string fanPfpUrl = string.IsNullOrEmpty(fanInTheStands.FanPfpUrl) ? "https://test.wildfile.wildcardgame.com/images/thousands-w-icon.svg" : fanInTheStands.FanPfpUrl;
            // Create a new skybox with initial value and will insert to db at the end
            newSkybox = new Skybox
            {
                Id = newSkyboxId,
                StageId = stageId,
                OwnerUserId = userId,
                SkyboxTier = skyboxTier,
                SkyboxPrimaryColor = DEFAULT_SKYBOX_COLOR,
                SkyboxLogoUrl = fanPfpUrl,
                SkyboxChannelMembers = new List<string> { userId },
                SkyboxName = $"{userDisplayName}'s Skybox",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                V = 0,
            };
            Console.WriteLine($"ThousandsInfo: Creating new skybox {JsonSerializer.Serialize(newSkybox)}");

            // Gather all the channels from the stage and skyboxes
            List<ChannelEntity> channels = GetAllRelevantChannels(userId, stage, newSkybox);
            Console.WriteLine($"ThousandsInfo: Gathering channels for stageId: {stageId}");

            // @note - optional - batch set channel metadata (performance boost)
            // Create a direct message channel for the user level
            bool userChannelMetadataSuccess = await _webSocketService.SetChannelMetadata(userId, $"u.{userId}", "Direct Message");
            if (!userChannelMetadataSuccess)
            {
                // @note - pubnub would throw an error and not enter this branch flow
                Console.WriteLine($"ThousandsWarning: Failed to set channel metadata for Direct Message Channel under userId: {userId}");
                await _skyboxCache.FailedToPurchaseSkyboxLatch(stageId, userId);
                return new PurchaseSkyboxResult { ErrorMessage = "Unable to set up direct message channel for user.  Please contact support!" };
            }

            // Create a skybox channel in pubnub
            string skyboxChannelId = $"g.{stage.Id}.{newSkybox.Id}";
            bool skyboxChannelMetadataSuccess = await _webSocketService.SetChannelMetadata(userId, skyboxChannelId, newSkybox.SkyboxName);
            if (!skyboxChannelMetadataSuccess)
            {
                // @note - pubnub would throw an error and not enter this branch flow
                Console.WriteLine($"ThousandsWarning: Failed to set channel metadata for {newSkybox.SkyboxName} Channel under userId: {userId}, channelId: g.{stage.Id}.{newSkybox.Id}");
                await _skyboxCache.FailedToPurchaseSkyboxLatch(stageId, userId);
                return new PurchaseSkyboxResult { ErrorMessage = "Unable to setup skybox chat channel for user.  Please contact support!" };
            }

            Console.WriteLine($"ThousandsInfo: Channel metadata set for {newSkybox.SkyboxName} Channel under userId: {userId}, channelId: g.{stage.Id}.{newSkybox.Id}");

            // Get all the channels permissions for this stage
            List<string> channelIds = channels.Select(c => c.Id).ToList();
            var channelPermissions = _webSocketService.GetChannelPermissions(stageId, channelIds);

            // Grant a new pubnub token
            pubnubToken = await _webSocketService.GrantToken(userId, channelPermissions, isModerator);
            if (string.IsNullOrEmpty(pubnubToken))
            {
                // @note - pubnub would throw an error and not enter this branch flow
                Console.WriteLine($"ThousandsWarning: Failed to grant pubnub token for userId: {userId}");
                await _skyboxCache.FailedToPurchaseSkyboxLatch(stageId, userId);
                return new PurchaseSkyboxResult { ErrorMessage = "Unable to grant new chat token.  Please contact support!" };
            }

            Console.WriteLine($"ThousandsInfo: Granting pubnub token for userId: {userId}");

            // * (under observation) for now there is no need to do a retry mechanism on setMemberships (frontend takes care of it initially)
            Console.WriteLine($"ThousandsInfo: Setting channel memberships for userId: {userId}");
            List<PNMembership> memberships = channels.Select(c => new PNMembership
            {
                Channel = c.Id,

            }).ToList();
            bool setMemberships = await _webSocketService.SetMemberships(userId, memberships);
            if (!setMemberships)
            {
                // @note - pubnub would throw an error and not enter this branch flow
                Console.WriteLine($"ThousandsWarning: Failed to set memberships for userId: {userId}");
                await _skyboxCache.FailedToPurchaseSkyboxLatch(stageId, userId);
                return new PurchaseSkyboxResult { ErrorMessage = "Unable to set all channel membership to user.  Please contact support!" };
            }

            // Add the new skybox to the db once processing all pubnub logic
            bool skyboxAdded = await _skyboxRepository.AddSkybox(newSkybox);
            if (!skyboxAdded)
            {
                Console.WriteLine($"ThousandsWarning: Failed to add new skybox for userId: {userId}");
                await _skyboxCache.FailedToPurchaseSkyboxLatch(stageId, userId);
                return new PurchaseSkyboxResult { ErrorMessage = "Unable to add skybox.  Please contact support!" };
            }
        }
        catch (Exception e)
        {
            Console.WriteLine($"ThousandsWarning: Unknown error creating skybox for userId: {userId} - error: {e.Message}");
            Console.WriteLine($"ThousandsWarning: Failed to add new skybox for userId: {userId}");
            await _skyboxCache.FailedToPurchaseSkyboxLatch(stageId, userId);
            return new PurchaseSkyboxResult { ErrorMessage = "Unable to purchase skybox.  Please contact support!" };
        }

        Console.WriteLine($"ThousandsInfo: Added new skybox {JsonSerializer.Serialize(newSkybox)} to db and OwnerUserId: {userId}, skyboxId: {newSkybox.Id}");

        //Beyond this point the skybox has already been created.  Need to handle fail condition with this in mind.

        //Add cache entry to connect the user to the skybox
        await _skyboxCache.AddUserIdToSkyboxId(stageId, userId, newSkyboxIdString, skyboxTier);

        // Refetch all the skyboxes for this stage (source of truth) again
        skyboxes = await _skyboxRepository.GetAllSkyboxesByStageId(stageId);

        SkyboxSignalMessage<PurchaseSkybox> skyboxSignalMessage = new SkyboxSignalMessage<PurchaseSkybox>
        {
            Type = MessageType.PurchaseSkybox.ToString(),
            Data = new PurchaseSkybox
            {
                PubnubToken = pubnubToken
            }
        };

        // Send DM to the user via pubnub with updated pubnubToken
        string directMessage = JsonSerializer.Serialize(skyboxSignalMessage);
        bool messageSent = await _webSocketService.SendMessageSignalToPlatformClient($"u.{userId}", "Wildcard", directMessage);
        if (!messageSent)
        {
            Console.WriteLine($"ThousandsWarning: Failed to send message to userId: {userId}");
            return new PurchaseSkyboxResult { ErrorMessage = "Unable to send new chat token.  Please contact support!" };
        }

        Console.WriteLine($"ThousandsInfo: Message sent to userId {userId}, message: {directMessage}");


        // Notify everyone with updated skyboxes state
        BoostSignalMessage boostSignalMessage = new BoostSignalMessage
        {
            BoostEventType = "SetSkybox",
            EventId = stageId,
            Skyboxes = skyboxes,
        };
        string everyoneMessage = JsonSerializer.Serialize(boostSignalMessage);
        bool everyoneMessageSent = await _webSocketService.SendMessageSignalToPlatformClient($"s.{stageId}", "Wildcard", everyoneMessage);
        if (!everyoneMessageSent)
        {
            Console.WriteLine($"ThousandsWarning: Failed to send message to everyone in stageId: {stageId}");
            return new PurchaseSkyboxResult { ErrorMessage = "Failed to update skybox state.  Please contact support!" };
        }

        Console.WriteLine($"ThousandsInfo: Message sent to everyone, message: {everyoneMessage}");

        // Lastly, deduct credits from purchasing skybox
        bool updateCreditBalance = await _creditBalanceRepository.UpdateCreditBalance(userId, 0 - skyboxPrice);
        if (!updateCreditBalance)
        {
            Console.WriteLine($"ThousandsWarning: Failed to update credit balance for userId: {userId}");
            return new PurchaseSkyboxResult { ErrorMessage = "Unable to purchase skybox due to a credit balance issue.  Please contact support!" };
        }

        Console.WriteLine($"ThousandsInfo: Deducted {skyboxPrice} credits from userId: {userId}");


        // And add credit transaction to record the skybox purchase
        Guid transactionId = Guid.NewGuid();
        string transactionIdStr = transactionId.ToString();
        await _creditBalanceRepository.AddCreditTransaction(userId, transactionIdStr, -skyboxPrice, "", "", "",
            null, 0, "COMPLETED", CreditTransactionType.SKYBOX_PURCHASE, stageId, segment, skyboxTier);
        Console.WriteLine($"ThousandsInfo: Add credit transaction to record skybox purchase for userId: {userId}");

        return new PurchaseSkyboxResult
        {
            PubnubToken = pubnubToken,
            Skybox = newSkybox
        };
    }

    public async Task<FrontEndLogResult> InviteMemberToSkybox(string ownerUserId, string userId, string stageId, string skyboxId)
    {
        Console.WriteLine($"ThousandsInfo: Inviting user {userId} to skybox {skyboxId} in stage {stageId}");

        // Check whether stage exists
        IvsIdleGameShared.Models.Stage? stage = await _streamRepository.GetStage(stageId);
        if (stage == null)
        {
            Console.WriteLine($"ThousandsWarning: Stage not found for stageId: {stageId}");
            return new FrontEndLogResult { ErrorMessage = "The selected event could not be found.  Please contact support!" };
        }

        // Check whether the stage is active
        if (stage.Status.ToLower() != "live")
        {
            Console.WriteLine($"ThousandsWarning: Stage is not live for stageId: {stageId}");
            return new FrontEndLogResult { ErrorMessage = "The selected event is not active.  Please contact support!" };
        }

        // Get all the skyboxes for this stage (cannot invite to a skybox that does not exist)
        List<Skybox> skyboxes = await _skyboxRepository.GetAllSkyboxesByStageId(stageId);
        if (skyboxes.Count < 1)
        {
            Console.WriteLine($"ThousandsWarning: No skyboxes found for stageId: {stageId}");
            return new FrontEndLogResult { ErrorMessage = "No skyboxes are available to invite to.  Please contact support!" };
        }

        // Check if channel exists
        Skybox? skybox = skyboxes.FirstOrDefault(s => s.Id.ToString() == skyboxId);
        if (skybox == null)
        {
            Console.WriteLine($"ThousandsWarning: Skybox not found for skyboxId: {skyboxId}");
            return new FrontEndLogResult { ErrorMessage = "Skybox does not exist.  Please contact support!" };
        }

        // Check tier max membership has been reached
        int maxMembers = tierMaxMembersMap[skybox.SkyboxTier];
        if (skybox.SkyboxChannelMembers.Count >= maxMembers)
        {
            Console.WriteLine($"ThousandsWarning: Skybox max membership reached for skyboxId: {skyboxId}");
            return new FrontEndLogResult { ErrorMessage = "Skybox member limit has been reached." };
        }

        Console.WriteLine($"ThousandsInfo: Skybox {skybox.SkyboxName} [Tier {skybox.SkyboxTier}] has {skybox.SkyboxChannelMembers.Count} members out of {maxMembers} max members");

        // Check if owner is the owner of the skybox
        if (skybox.OwnerUserId != ownerUserId)
        {
            Console.WriteLine($"ThousandsWarning: User is not owner of the skybox ownerUserId: {ownerUserId}");
            return new FrontEndLogResult { ErrorMessage = "Only the owner of the skybox can remove a user." };
        }

        // Check if user is already a member of any skyboxes or the owner of any skyboxes
        bool isSkyboxOwnerOrMember = IsSkyboxOwnerOrMember(userId, skyboxes);
        if (isSkyboxOwnerOrMember)
        {
            Console.WriteLine($"ThousandsWarning: User is already an owner or member of a skybox: {userId}");
            return new FrontEndLogResult { ErrorMessage = "User is already a member of a skybox!" };
        }

        //Get vendorEventId from the stage we pulled above
        if (string.IsNullOrEmpty(stage.BeamableEventId))
        {
            Console.WriteLine($"Stage is missing beamableEventId");
            return new FrontEndLogResult { ErrorMessage = "Stage is missing beamableEventId" };
        }

        //BeamableEventId on the stage is vendorEventId
        string vendorEventId = stage.BeamableEventId;

        //Lookup name of user being invited
        FanInTheStands? fanInTheStands = await _fanVisibilityService.GetFanInTheStands(vendorEventId, userId);
        if (fanInTheStands == null)
        {
            Console.WriteLine($"ThousandsWarning: Fan in the stands not found for userId: {userId}");
            return new FrontEndLogResult { ErrorMessage = "Could not find user to invite" };
        }

        //FanName is userDisplayName
        string userDisplayName = fanInTheStands.FanName;

        // Generate a new skybox invite
        SkyboxInvite skyboxInvite = new SkyboxInvite
        {
            SkyboxId = skyboxId,
            UserId = userId,
            UserName = userDisplayName
        };
        Console.WriteLine($"ThousandsInfo: Creating new skybox invite {JsonSerializer.Serialize(skyboxInvite)}");

        // Store the skybox invite in the database
        bool success = await _skyboxCache.StoreSkyboxInvite(skyboxInvite);
        if (!success)
        {
            Console.WriteLine($"ThousandsWarning: Failed to store skybox invite to db for userId: {userId}");
            return new FrontEndLogResult { ErrorMessage = "Unable to invite the user." };
        }

        Console.WriteLine($"ThousandsInfo: Stored skybox invite to db for userId: {userId}");

        // Send DM to invited user via pubnub with skyboxInvite Guid
        SkyboxSignalMessage<InviteUser> skyboxSignalMessage = new SkyboxSignalMessage<InviteUser>
        {
            Type = MessageType.InviteUser.ToString(),
            Data = new InviteUser
            {
                SkyboxInviteId = skyboxInvite.Id.ToString(),
                SkyboxName = skybox.SkyboxName,
                SkyboxOwnerId = skybox.OwnerUserId
            }
        };
        string directMessage = JsonSerializer.Serialize(skyboxSignalMessage);
        bool messageSent = await _webSocketService.SendMessageSignalToPlatformClient($"u.{userId}", "Wildcard", directMessage);
        if (!messageSent)
        {
            Console.WriteLine($"ThousandsWarning: Failed to send message to userId: {userId}");
            return new FrontEndLogResult { ErrorMessage = "System unable to send direct message via pubnub" };
        }

        //Send a system message to the skybox letting everyone know the user has been invited
        await _webSocketService.SendChatToPlatformClient($"g.{stageId}.{skyboxId}", "system", $"{userDisplayName} has been invited to join...");

        Console.WriteLine($"ThousandsInfo: Message sent to userId {userId}, message: {directMessage}");
        return new FrontEndLogResult { ErrorMessage = "" };
    }

    public async Task<RemoveUserResult> RemoveMemberFromSkybox(string ownerUserId, string userId, string stageId, string skyboxId)
    {
        Console.WriteLine($"ThousandsInfo: Removing user {userId} from skybox {skyboxId} in stage {stageId}");

        // Check whether stage exists
        IvsIdleGameShared.Models.Stage? stage = await _streamRepository.GetStage(stageId);
        if (stage == null)
        {
            Console.WriteLine($"ThousandsWarning: Stage not found for stageId: {stageId}");
            return new RemoveUserResult { ErrorMessage = "The selected stage could not be found." };
        }

        // Check whether the stage is active
        if (stage.Status.ToLower() != "live")
        {
            Console.WriteLine($"ThousandsWarning: Stage is not live for stageId: {stageId}");
            return new RemoveUserResult { ErrorMessage = "The selected stage does not have an active event." };
        }

        // Get all the skyboxes for this stage
        List<Skybox> skyboxes = await _skyboxRepository.GetAllSkyboxesByStageId(stageId);
        if (skyboxes == null || skyboxes.Count == 0)
        {
            Console.WriteLine($"ThousandsWarning: No skyboxes found for stageId: {stageId}");
            return new RemoveUserResult { ErrorMessage = "No skyboxes available for this stage." };
        }

        // Check if channel exists
        Skybox? skybox = skyboxes.FirstOrDefault(s => s.Id.ToString() == skyboxId);
        if (skybox == null)
        {
            Console.WriteLine($"ThousandsWarning: Skybox not found for skyboxId: {skyboxId}");
            return new RemoveUserResult { ErrorMessage = "Skybox does not exist." };
        }

        // Check if owner is the owner of the skybox
        if (skybox.OwnerUserId != ownerUserId)
        {
            Console.WriteLine($"ThousandsWarning: User is not owner of the skybox ownerUserId: {ownerUserId}");
            return new RemoveUserResult { ErrorMessage = "Only owner of the skybox can remove user." };
        }

        // Check if user is not a owner of the skybox
        if (skybox.OwnerUserId == userId)
        {
            Console.WriteLine($"ThousandsWarning: User is the owner of the skybox cannot be removed: {userId}");
            return new RemoveUserResult { ErrorMessage = "Cannot remove owner of the skybox." };
        }

        // Check if user is a member of the skybox
        bool isMember = skybox.SkyboxChannelMembers.Contains(userId);
        if (!isMember)
        {
            Console.WriteLine($"ThousandsWarning: User is not a member of the skybox: {userId}");
            return new RemoveUserResult { ErrorMessage = "User is not part of skybox." };
        }

        // Gather all the channels from the stage and skyboxes
        List<ChannelEntity> channels = GetAllRelevantChannels(userId, stage, skybox);
        Console.WriteLine($"ThousandsInfo: Gathering channels for stageId: {stageId}");

        // Get all the channels permissions for this stage
        List<string> channelIds = channels.Select(c => c.Id).ToList();
        Dictionary<string, PNTokenAuthValues> channelPermissions = _webSocketService.GetChannelPermissions(stageId, channelIds);

        // Update the channel permissions for the user for this skybox
        channelPermissions[$"g.{stageId}.{skyboxId}"] = new PNTokenAuthValues()
        {
            Read = true,
            Write = false,
            Update = false,
            Join = true,
            Get = false,
            Delete = false
        };

        // Grant a new pubnub token
        string pubnubToken = await _webSocketService.GrantToken(userId, channelPermissions, false);
        if (string.IsNullOrEmpty(pubnubToken))
        {
            // @note - pubnub would throw an error and not enter this branch flow
            Console.WriteLine($"ThousandsWarning: Failed to grant pubnub token for userId: {userId}");
            return new RemoveUserResult { ErrorMessage = "Unable to grant new token." };
        }

        Console.WriteLine($"ThousandsInfo: Granting pubnub token for userId: {userId}");

        // * (under observation) for now there is no need to do a retry mechanism on setMemberships (frontend takes care of it initially)
        Console.WriteLine($"ThousandsInfo: Setting channel memberships for userId: {userId}");
        List<PNMembership> memberships = channels.Select(c => new PNMembership
        {
            Channel = c.Id,

        }).ToList();
        bool setMemberships = await _webSocketService.SetMemberships(userId, memberships);
        if (!setMemberships)
        {
            // @note - pubnub would throw an error and not enter this branch flow
            Console.WriteLine($"ThousandsWarning: Failed to set memberships for userId: {userId}");
            return new RemoveUserResult { ErrorMessage = "Unable to set all channel membership to user" };
        }

        // Remove the user from the skybox
        bool removeMemberFromSkybox = await _skyboxRepository.RemoveMemberFromSkybox(skyboxId, userId);
        if (!removeMemberFromSkybox)
        {
            Console.WriteLine($"ThousandsWarning: Failed to remove user from skybox for userId: {userId}");
            return new RemoveUserResult { ErrorMessage = "Unable to remove a member from the skybox." };
        }
        Console.WriteLine($"ThousandsInfo: Removed user from skybox for userId: {userId}");

        // Fetch all the skyboxes for this stage
        skyboxes = await _skyboxRepository.GetAllSkyboxesByStageId(stageId);

        Skybox? updatedSkybox = skyboxes.FirstOrDefault(s => s.Id.ToString() == skyboxId);
        // Send DM to removed user via pubnub with updated pubnubToken
        SkyboxSignalMessage<RemoveUser> skyboxSignalMessage = new SkyboxSignalMessage<RemoveUser>
        {
            Type = MessageType.RemoveUser.ToString(),
            Data = new RemoveUser
            {
                PubnubToken = pubnubToken,
            }
        };
        string directMessage = JsonSerializer.Serialize(skyboxSignalMessage);
        bool messageSent = await _webSocketService.SendMessageSignalToPlatformClient($"u.{userId}", "Wildcard", directMessage);
        if (!messageSent)
        {
            Console.WriteLine($"ThousandsWarning: Failed to send message to userId: {userId}");
            return new RemoveUserResult { ErrorMessage = "System unable to send direct message via pubnub" };
        }

        Console.WriteLine($"ThousandsInfo: Message sent to userId {userId}, message: {directMessage}");

        // Notify everyone with updated skyboxes state
        BoostSignalMessage boostSignalMessage = new BoostSignalMessage
        {
            BoostEventType = "SetSkybox",
            EventId = stageId,
            Skyboxes = skyboxes,
        };
        string everyoneMessage = JsonSerializer.Serialize(boostSignalMessage);
        bool everyoneMessageSent = await _webSocketService.SendMessageSignalToPlatformClient($"s.{stageId}", "Wildcard", everyoneMessage);
        if (!everyoneMessageSent)
        {
            Console.WriteLine($"ThousandsWarning: Failed to send message to everyone in stageId: {stageId}");
            return new RemoveUserResult { ErrorMessage = "System unable to send everyone a message via pubnub" };
        }

        Console.WriteLine($"ThousandsInfo: Message sent to everyone, message: {everyoneMessage}");

        return new RemoveUserResult { ErrorMessage = "" };
    }

    public async Task<AcceptInviteResult> AcceptSkyboxInvite(Guid skyboxInviteGuid)
    {
        Console.WriteLine($"ThousandsInfo: Accepting skybox invite {skyboxInviteGuid}");

        // Look up the skybox invite in the database
        SkyboxInvite? skyboxInvite = await _skyboxCache.GetSkyboxInvite(skyboxInviteGuid);
        if (skyboxInvite == null)
        {
            Console.WriteLine($"ThousandsWarning: Skybox invite not found for skyboxInviteGuid: {skyboxInviteGuid}");
            return new AcceptInviteResult { ErrorMessage = "Skybox invite cannot be found." };
        }

        string userId = skyboxInvite.UserId;
        string skyboxId = skyboxInvite.SkyboxId;

        // Fetch the skybox
        Skybox? skybox = await _skyboxRepository.GetSkyboxById(skyboxId);
        if (skybox == null)
        {
            Console.WriteLine($"ThousandsWarning: Skybox not found for skyboxId: {skyboxId}");
            return new AcceptInviteResult { ErrorMessage = "Skybox does not exist." };
        }

        int skyboxTier = skybox.SkyboxTier;

        // Check tier max membership has been reached
        int maxMembers = tierMaxMembersMap[skybox.SkyboxTier];
        if (skybox.SkyboxChannelMembers.Count >= maxMembers)
        {
            Console.WriteLine($"ThousandsWarning: Skybox max membership reached for skyboxId: {skyboxId}");
            return new AcceptInviteResult { ErrorMessage = "Skybox slot limit has been reached." };
        }

        string stageId = skybox.StageId;
        // Check whether stage exists
        IvsIdleGameShared.Models.Stage? stage = await _streamRepository.GetStage(stageId);
        if (stage == null)
        {
            Console.WriteLine($"ThousandsWarning: Stage not found for stageId: {stageId}");
            return new AcceptInviteResult { ErrorMessage = "Unable to find the event.  Please contact support!" };
        }

        // Check whether the stage is active
        if (stage.Status.ToLower() != "live")
        {
            Console.WriteLine($"ThousandsWarning: Stage is not live for stageId: {stageId}");
            return new AcceptInviteResult { ErrorMessage = "The selected event is not active.  Please contact support!" };
        }

        List<Skybox> skyboxes = await _skyboxRepository.GetAllSkyboxesByStageId(stageId);

        // Check if user is already a member of any skyboxes or the owner of any skyboxes
        bool isSkyboxOwnerOrMember = IsSkyboxOwnerOrMember(userId, skyboxes);
        if (isSkyboxOwnerOrMember)
        {
            Console.WriteLine($"ThousandsWarning: User is already an owner or member of a skybox: {userId}");
            return new AcceptInviteResult { ErrorMessage = "You can't accept this invite, because you are already a member of a skybox!" };
        }

        Console.WriteLine($"ThousandsInfo: Added new channel member to skybox {skybox.Id} for userId: {userId}");

        // Gather all the channels from the stage and skyboxes
        List<ChannelEntity> channels = GetAllRelevantChannels(userId, stage, skybox);
        Console.WriteLine($"ThousandsInfo: Gathering channels for stageId: {stageId}");

        // @note - optional - batch set channel metadata (performance boost)
        // Create a direct message channel for the user level
        bool userChannelMetadataSuccess = await _webSocketService.SetChannelMetadata(userId, $"u.{userId}", "Direct Message");
        if (!userChannelMetadataSuccess)
        {
            // @note - pubnub would throw an error and not enter this branch flow
            Console.WriteLine($"ThousandsWarning: Failed to set channel metadata for Direct Message Channel under userId: {userId}");
            return new AcceptInviteResult { ErrorMessage = "Unable to set up direct message channel for user.  Please contact support!" };
        }

        Console.WriteLine($"ThousandsInfo: Channel metadata set for Direct Message Channel under userId: {userId}, channelId: u.{userId}");

        // Create a skybox channel in pubnub
        bool skyboxChannelMetadataSuccess = await _webSocketService.SetChannelMetadata(userId, $"g.{stage.Id}.{skybox.Id}", skybox.SkyboxName);
        if (!skyboxChannelMetadataSuccess)
        {
            // @note - pubnub would throw an error and not enter this branch flow
            Console.WriteLine($"ThousandsWarning: Failed to set channel metadata for {skybox.SkyboxName} Channel under userId: {userId}, channelId: g.{stage.Id}.{skybox.Id}");
            return new AcceptInviteResult { ErrorMessage = "Unable to set up skybox channel for user.  Please contact support!" };
        }

        Console.WriteLine($"ThousandsInfo: Channel metadata set for {skybox.SkyboxName} Channel under userId: {userId}, channelId: g.{stage.Id}.{skybox.Id}");

        // Get all the channels permissions for this stage
        List<string> channelIds = channels.Select(c => c.Id).ToList();
        var channelPermissions = _webSocketService.GetChannelPermissions(stageId, channelIds);

        // Grant a new pubnub token
        string pubnubToken = await _webSocketService.GrantToken(userId, channelPermissions, false);
        if (string.IsNullOrEmpty(pubnubToken))
        {
            // @note - pubnub would throw an error and not enter this branch flow
            Console.WriteLine($"ThousandsWarning: Failed to grant pubnub token for userId: {userId}");
            return new AcceptInviteResult { ErrorMessage = "Unable to grant a new chat token.  Please contact support!" };
        }

        Console.WriteLine($"ThousandsInfo: Granting pubnub token for userId: {userId}");

        // * (under observation) for now there is no need to do a retry mechanism on setMemberships (frontend takes care of it initially)
        Console.WriteLine($"ThousandsInfo: Setting channel memberships for userId: {userId}");
        List<PNMembership> memberships = channels.Select(c => new PNMembership
        {
            Channel = c.Id,

        }).ToList();
        bool setMemberships = await _webSocketService.SetMemberships(userId, memberships);
        if (!setMemberships)
        {
            // @note - pubnub would throw an error and not enter this branch flow
            Console.WriteLine($"ThousandsWarning: Failed to set memberships for userId: {userId}");
            return new AcceptInviteResult { ErrorMessage = "Unable to set all channel memberships.  Please contact support!" };
        }

        // Add the user to the skybox after processing pubnub logic and retrieving skybox invite from db
        bool addMemberToSkybox = await _skyboxRepository.AddMemberToSkybox(skyboxId, userId);
        if (!addMemberToSkybox)
        {
            Console.WriteLine($"ThousandsWarning: Failed to add new channel member to skybox {skybox.Id} for userId: {userId}");
            return new AcceptInviteResult { ErrorMessage = "Unable to add you to the skybox.  Please contact support!" };
        }

        // Refetch all the skyboxes for this stage (source of truth) again
        skyboxes = await _skyboxRepository.GetAllSkyboxesByStageId(stageId);

        Skybox? updatedSkybox = skyboxes.FirstOrDefault(s => s.Id.ToString() == skyboxId);
        // Send DM to the user via pubnub with updated pubnubToken and updatedSkybox
        SkyboxSignalMessage<AcceptInvite> skyboxSignalMessage = new SkyboxSignalMessage<AcceptInvite>
        {
            Type = MessageType.AcceptInvite.ToString(),
            Data = new AcceptInvite
            {
                PubnubToken = pubnubToken,
                Skybox = updatedSkybox
            }
        };
        string directMessage = JsonSerializer.Serialize(skyboxSignalMessage);
        bool messageSent = await _webSocketService.SendMessageSignalToPlatformClient($"u.{userId}", "Wildcard", directMessage);
        if (!messageSent)
        {
            Console.WriteLine($"ThousandsWarning: Failed to send message to userId: {userId}");
            return new AcceptInviteResult { ErrorMessage = "System unable to send chat token to user.  Please contact support!" };
        }

        Console.WriteLine($"ThousandsInfo: Message sent to userId {userId}, message: {directMessage}");

        // Notify everyone with updated skyboxes state
        BoostSignalMessage boostSignalMessage = new BoostSignalMessage
        {
            BoostEventType = "SetSkybox",
            EventId = stageId,
            Skyboxes = skyboxes,
        };
        string everyoneMessage = JsonSerializer.Serialize(boostSignalMessage);
        bool everyoneMessageSent = await _webSocketService.SendMessageSignalToPlatformClient($"s.{stageId}", "Wildcard", everyoneMessage);
        if (!everyoneMessageSent)
        {
            Console.WriteLine($"ThousandsWarning: Failed to send message to everyone in stageId: {stageId}");
            return new AcceptInviteResult { ErrorMessage = "Unable to update skybox state.  Please contact support!" };
        }

        Console.WriteLine($"ThousandsInfo: Message sent to everyone, message: {everyoneMessage}");

        //Add cache entry to connect the user to the skybox
        await _skyboxCache.AddUserIdToSkyboxId(stageId, userId, skyboxId, skyboxTier);

        // Lastly, remove the skybox invite from the database
        bool removeSkyboxInvite = await _skyboxCache.RemoveSkyboxInvite(skyboxInviteGuid);
        if (!removeSkyboxInvite)
        {
            Console.WriteLine($"ThousandsWarning: Failed to remove skybox invite from db for skyboxInviteGuid: {skyboxInviteGuid}");
            //Silent fail
        }
        else
        {
            Console.WriteLine($"ThousandsInfo: Removed skybox invite from db for skyboxInviteGuid: {skyboxInviteGuid}");
        }

        //Send a system message to the skybox letting everyone know the user has joined
        await _webSocketService.SendChatToPlatformClient($"g.{stageId}.{skyboxId}", "system", $"{skyboxInvite.UserName} has joined.");

        return new AcceptInviteResult
        {
            PubnubToken = pubnubToken,
            Skybox = updatedSkybox
        };
    }

    public async Task<bool> RejectSkyboxInvite(Guid skyboxInviteGuid)
    {
        Console.WriteLine($"ThousandsInfo: Rejecting skybox invite {skyboxInviteGuid}");

        // Look up the skybox invite in the database
        SkyboxInvite? skyboxInvite = await _skyboxCache.GetSkyboxInvite(skyboxInviteGuid);
        if (skyboxInvite == null)
        {
            Console.WriteLine($"ThousandsWarning: Skybox invite not found for skyboxInviteGuid: {skyboxInviteGuid}");
            return false;
        }

        string skyboxId = skyboxInvite.SkyboxId;

        // Fetch the skybox
        Skybox? skybox = await _skyboxRepository.GetSkyboxById(skyboxId);
        if (skybox == null)
        {
            Console.WriteLine($"ThousandsWarning: Skybox not found for skyboxId: {skyboxId}");
            return false;
        }

        string stageId = skybox.StageId;

        //Send a system message to the skybox letting everyone know the user rejected the invite
        await _webSocketService.SendChatToPlatformClient($"g.{stageId}.{skyboxId}", "system", $"{skyboxInvite.UserName} has rejected an invitation to join.");

        // Lastly, remove the skybox invite from the database
        bool removeSkyboxInvite = await _skyboxCache.RemoveSkyboxInvite(skyboxInviteGuid);
        if (!removeSkyboxInvite)
        {
            Console.WriteLine($"ThousandsWarning: Failed to remove skybox invite from db for skyboxInviteGuid after reject invite: {skyboxInviteGuid}");
            return false;
        }
        Console.WriteLine($"ThousandsInfo: Removed skybox invite from db for skyboxInviteGuid after reject invite: {skyboxInviteGuid}");

        return true;
    }

    public async Task<UpdatedSkyboxResult> UpdateSkybox(string userId, string skyboxId, string skyboxName, string skyboxPrimaryColor, string skyboxLogoUrl)
    {
        Console.WriteLine($"ThousandsInfo: Updating skybox {skyboxId}");

        // Check if the skybox exists
        Skybox? skybox = await _skyboxRepository.GetSkyboxById(skyboxId);
        if (skybox == null)
        {
            Console.WriteLine($"ThousandsWarning: Skybox not found for skyboxId: {skyboxId}");
            return new UpdatedSkyboxResult { ErrorMessage = "Skybox does not exist.  Please contact support!" };
        }

        string stageId = skybox.StageId;
        // Check if the stage exists
        IvsIdleGameShared.Models.Stage? stage = await _streamRepository.GetStage(stageId);
        if (stage == null)
        {
            Console.WriteLine($"ThousandsWarning: Stage not found for stageId: {stageId}");
            return new UpdatedSkyboxResult { ErrorMessage = "The selected event could not be found.  Please contact support!" };
        }

        // Check whether the stage is active
        if (stage.Status.ToLower() != "live")
        {
            Console.WriteLine($"ThousandsWarning: Stage is not live for stageId: {stageId}");
            return new UpdatedSkyboxResult { ErrorMessage = "The selected event is not active.  Please contact support!" };
        }

        if (skybox.OwnerUserId != userId)
        {
            Console.WriteLine($"ThousandsWarning: User is not the owner of the skybox: {userId}");
            return new UpdatedSkyboxResult { ErrorMessage = "Unable to update the skybox because you are not the owner.  Please contact support!" };
        }

        // @follow-up - Update the skybox properties (specific validation for these properties)
        skybox.SkyboxName = skyboxName;
        skybox.SkyboxPrimaryColor = skyboxPrimaryColor.ToLower();
        skybox.SkyboxLogoUrl = skyboxLogoUrl;

        Console.WriteLine($"ThousandsInfo: Updating skybox properties {JsonSerializer.Serialize(skybox)}");

        // Update the skybox in the database
        bool skyboxUpdated = await _skyboxRepository.UpdateSkybox(skybox);
        if (!skyboxUpdated)
        {
            Console.WriteLine($"ThousandsWarning: Failed to update skybox for skyboxId: {skyboxId}");
            return new UpdatedSkyboxResult { ErrorMessage = "Unable to update the skybox.  Please contact support!" };
        }
        Console.WriteLine($"ThousandsInfo: Updated skybox for skyboxId: {skyboxId}");

        // Get all skyboxes for this stage (source of truth) 
        List<Skybox> skyboxes = await _skyboxRepository.GetAllSkyboxesByStageId(stageId);


        // Notify everyone with updated skyboxes state
        BoostSignalMessage boostSignalMessage = new BoostSignalMessage
        {
            BoostEventType = "SetSkybox",
            EventId = stageId,
            Skyboxes = skyboxes,
        };
        string everyoneMessage = JsonSerializer.Serialize(boostSignalMessage);
        bool everyoneMessageSent = await _webSocketService.SendMessageSignalToPlatformClient($"s.{stageId}", "Wildcard", everyoneMessage);
        if (!everyoneMessageSent)
        {
            Console.WriteLine($"ThousandsWarning: Failed to send message to everyone in stageId: {stageId}");
            return new UpdatedSkyboxResult { ErrorMessage = "Unable to update skybox state.  Please contact support!" };
        }

        Console.WriteLine($"ThousandsInfo: Message sent to everyone, message: {everyoneMessage}");

        Skybox? updatedSkybox = skyboxes.FirstOrDefault(s => s.Id.ToString() == skyboxId);
        return new UpdatedSkyboxResult { Skybox = updatedSkybox, ErrorMessage = "" };
    }

    public async Task<List<SkyboxFan>> SearchFans(string ownerUserId, string fanName, string stageId, string skyboxId)
    {
        List<SkyboxFan> matchedFans = new List<SkyboxFan>();
        // Check if fan name is less than three characters
        if (fanName.Length < 3)
        {
            return matchedFans;
        }

        // Check whether stage exists
        IvsIdleGameShared.Models.Stage? stage = await _streamRepository.GetStage(stageId);
        if (stage == null)
        {
            Console.WriteLine($"ThousandsWarning: Stage not found for stageId: {stageId}");
            return matchedFans;
        }

        // Check whether the stage is active
        if (stage.Status.ToLower() != "live")
        {
            Console.WriteLine($"ThousandsWarning: Stage is not live for stageId: {stageId}");
            return matchedFans;
        }

        // Get all the skyboxes for this stage (cannot invite to a skybox that does not exist)
        List<Skybox> skyboxes = await _skyboxRepository.GetAllSkyboxesByStageId(stageId);
        if (skyboxes == null || skyboxes.Count == 0)
        {
            Console.WriteLine($"ThousandsWarning: No skyboxes found for stageId: {stageId}");
            return matchedFans;
        }

        // Check if channel exists
        Skybox? skybox = skyboxes.FirstOrDefault(s => s.Id.ToString() == skyboxId);
        if (skybox == null)
        {
            Console.WriteLine($"ThousandsWarning: Skybox not found for skyboxId: {skyboxId}");
            return matchedFans;
        }

        // Check if owner is the owner of the skybox
        if (skybox.OwnerUserId != ownerUserId)
        {
            Console.WriteLine($"ThousandsWarning: User is not owner of the skybox ownerUserId: {ownerUserId}");
            return matchedFans;
        }

        // Check if vendor event id exist
        if (String.IsNullOrEmpty(stage?.BeamableEventId))
        {
            Console.WriteLine($"ThousandsWarning: Vendor event ID not found for stageId: {stageId}");
            return matchedFans;
        }

        string vendorEventId = stage.BeamableEventId;
        // Get all the fans in the stands
        List<FanInTheStands> fanInTheStands = await _fanVisibilityService.GetFansInTheStands(vendorEventId);

        // Query for all the matching fan name in fans in the stands and conform to simplified object
        matchedFans = fanInTheStands
        .Where(fan => !string.IsNullOrWhiteSpace(fan.FanName) &&
                      fan.FanName.StartsWith(fanName, StringComparison.OrdinalIgnoreCase))
        .Select(fan =>
        {
            Skybox? foundSkybox = skyboxes.FirstOrDefault(skybox => skybox.SkyboxChannelMembers.Any(member => member == fan.FanId));
            string? foundSkyboxId = foundSkybox != null ? foundSkybox.Id.ToString() : null;
            return new SkyboxFan
            {
                FanId = fan.FanId,
                FanName = fan.FanName,
                FanPfpUrl = fan.FanPfpUrl,
                SkyboxId = foundSkyboxId
            };
        }).ToList();

        return matchedFans;
    }

    public async Task<Skybox?> GetSkyboxUserIsIn(string stageId, string userId)
    {
        var allSkyboxes = await _skyboxRepository.GetAllSkyboxesByStageId(stageId);

        if (allSkyboxes.Count < 1)
        {
            return null;
        }

        Skybox? foundSkybox = null;
        foreach (var skybox in allSkyboxes)
        {
            foreach (var member in skybox.SkyboxChannelMembers)
            {
                //We found the user in this sky box
                if (member == userId)
                {
                    foundSkybox = skybox;
                }
            }
        }

        return foundSkybox;
    }

    public async Task<string?> GrantChannelPermissionsForUser(string stageId, string userId, Skybox? skyboxUserIsIn)
    {
        //For now we assume that everyone in a skybox is NOT a moderator of chat.
        bool isModerator = false;

        // Check whether stage exists
        IvsIdleGameShared.Models.Stage? stage = await _streamRepository.GetStage(stageId);
        if (stage == null)
        {
            Console.WriteLine($"ThousandsWarning: GrantChannelPermissionsForUser - Stage not found for stageId: {stageId}");
            return null;
        }

        // Gather all the channels from the stage and skyboxes
        List<ChannelEntity> channels = GetAllRelevantChannels(userId, stage, skyboxUserIsIn);
        Console.WriteLine($"ThousandsInfo: GrantChannelPermissionsForUser - Gathering channels for stageId: {stageId}");

        Console.WriteLine($"ThousandsInfo: GrantChannelPermissionsForUser - Relevant channels: {JsonSerializer.Serialize(channels)}");

        // Get all the channels permissions for this stage
        List<string> channelIds = channels.Select(c => c.Id).ToList();
        var channelPermissions = _webSocketService.GetChannelPermissions(stageId, channelIds);

        // Grant a new pubnub token
        string pubnubToken = await _webSocketService.GrantToken(userId, channelPermissions, isModerator);
        if (string.IsNullOrEmpty(pubnubToken))
        {
            // @note - pubnub would throw an error and not enter this branch flow
            Console.WriteLine($"ThousandsWarning: GrantChannelPermissionsForUser - Failed to grant pubnub token for userId: {userId}");
            return null;
        }

        Console.WriteLine($"ThousandsInfo: GrantChannelPermissionsForUser - Granting pubnub token for userId: {userId}");

        SkyboxSignalMessage<AcceptInvite> skyboxSignalMessage = new SkyboxSignalMessage<AcceptInvite>
        {
            Type = MessageType.AcceptInvite.ToString(),
            Data = new AcceptInvite
            {
                PubnubToken = pubnubToken,
            }
        };
        string directMessage = JsonSerializer.Serialize(skyboxSignalMessage);
        bool messageSent = await _webSocketService.SendMessageSignalToPlatformClient($"u.{userId}", "Wildcard", directMessage);
        if (!messageSent)
        {
            Console.WriteLine($"ThousandsWarning: Failed to send message to userId: {userId}");
            return pubnubToken;
        }

        return pubnubToken;
    }

    private async Task<bool> SetPubnubMembershipsWithRetry(string userId, List<PNMembership> channelIds)
    {

        try
        {
            await _webSocketService.SetMemberships(userId, channelIds);
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"SetMemberships Error: Failed to set membership for user {userId}. Attempting retry... {ex.Message}");

            // Retry logic

            return false;
        }

    }

    private List<ChannelEntity> GetAllRelevantChannels(string userId, IvsIdleGameShared.Models.Stage stage, Skybox? skybox)
    {
        List<ChannelEntity> channels = stage.Channels.Select(channel => new ChannelEntity
        {
            Id = $"g.{stage.Id}.{channel.Id}",
            Name = channel.Name,
            Custom = new ObjectCustom
            {
                ProfileUrl = $"/images/{channel.Src}.svg"
            }
        }).ToList();

        ChannelEntity signalMessageChannel = new ChannelEntity
        {
            Id = $"s.{stage.Id}",
            Name = "Signal Message",
        };
        ChannelEntity signalDirectMessageChannel = new ChannelEntity
        {
            Id = $"u.{userId}",
            Name = "Direct Message",
        };

        channels.AddRange(new List<ChannelEntity>
        {
            signalMessageChannel,
            signalDirectMessageChannel
        });

        //If this user is in a sky box, get the channel and add it
        if (skybox != null)
        {
            ChannelEntity skyboxChannel = new ChannelEntity
            {
                Id = $"g.{stage.Id}.{skybox.Id}",
                Name = skybox.SkyboxName,
                Custom = new ObjectCustom
                {
                    ProfileUrl = $"/images/{skybox.SkyboxLogoUrl}.svg"
                }
            };

            channels.Add(skyboxChannel);
        }

        return channels;
    }

    private bool IsSkyboxOwnerOrMember(string userId, List<Skybox> skyboxes)
    {
        foreach (Skybox skybox in skyboxes)
        {
            // Check whether user is an owner of skybox or already a member of any skybox
            if (skybox.OwnerUserId == userId || skybox.SkyboxChannelMembers.Contains(userId))
            {
                return true;
            }
        }

        return false;
    }
}
