import { updateOneDiscordEventDB } from "@repo/schemas";
import { logError, logInfo } from "@src/logger";
import { Events, VoiceState } from "discord.js";
import { client } from "@src/index";
import {
    addDiscordEventChannelListener,
    handleVoiceStateUpdate,
} from "@src/util/wildevents/discordEventUtil";
import { getChannel, sendMessageToChannel } from "@src/util/discordUtil";
import { getPrivateAdminChannelId } from "@src/util/environmentUtil";
import { isPlaytestEvent } from "@src/util/fanAttendanceUtil";
import { handleCreateAirdropFanAttendance } from "../airdrop-admin/createAirdropFanAttendance";
import { DiscordUserActivity, IDiscordEvent } from "@repo/interfaces";

/**
 * Handler for when a Discord event is starting
 */
export async function handleDiscordEventStarting(iDiscordEvent: IDiscordEvent) {
    logInfo(`Discord event '${iDiscordEvent.name}' is starting`);

    // record actual start time of the event
    const actualStartTime = Date.now();

    const channelId = iDiscordEvent.channelId;
    const discordEventChannel = await getChannel(channelId);
    if (!discordEventChannel) {
        logError(
            `Discord event [${iDiscordEvent.scheduledEventId}] channel not found for channel id: ${channelId}. Attendance listener was not created.`
        );
        return;
    }

    // setup listener for channel entrances/exits
    const listener = (oldState: VoiceState, newState: VoiceState) => {
        if (
            newState.channelId === channelId ||
            oldState.channelId === channelId
        ) {
            handleVoiceStateUpdate(
                oldState,
                newState,
                channelId,
                iDiscordEvent.scheduledEventId
            );
        }
    };

    client.on(Events.VoiceStateUpdate, listener);

    // Store the listener in the listeners Map with the discord event id as the key
    addDiscordEventChannelListener(iDiscordEvent.scheduledEventId, listener);

    // Add an entrance event for members already in the channel
    const currMembersInChannel = Array.from(
        discordEventChannel.members.values()
    ).map((member) => {
        return {
            discordId: member.user.id,
            timestamp: Date.now(),
        } as DiscordUserActivity;
    });

    const query = { scheduledEventId: iDiscordEvent.scheduledEventId };
    const updateStartingMembers = {
        $set: {
            actualStartTime,
        },
        $push: { channelEntrances: { $each: currMembersInChannel } },
    };
    await updateOneDiscordEventDB(query, updateStartingMembers);

    const msg = `Successfully started discord event ***${iDiscordEvent.name}***, recording attendance for users in channel ***${discordEventChannel.name}***`;
    await sendMessageToChannel(getPrivateAdminChannelId(), msg);

    // if the event is a playtest type, create an fan attendance airdrop
    if (isPlaytestEvent(iDiscordEvent.discordEventType)) {
        await handleCreateAirdropFanAttendance(iDiscordEvent);
    }

    logInfo(msg);
}
