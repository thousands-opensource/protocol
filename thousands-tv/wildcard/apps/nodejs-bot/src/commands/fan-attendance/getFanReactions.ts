import {
    ChatInputCommandInteraction,
    Guild,
    GuildScheduledEventStatus,
} from "discord.js";
import { logError, logInfo } from "@src/logger";
import { REACTION } from "@src/constants";
import { findOneDiscordEventByQuery } from "@repo/schemas";
import { notifyGameServerOfUserChannelReaction } from "@src/redis/utils";
import { client } from "@src/index";
import {
    getDiscordUserReference,
    sendMessageToChannel,
} from "@src/util/discordUtil";
import { getCurrentUnixTimestampSeconds } from "@src/util/util";
import { isPlaytestEvent, isUserInStands } from "@src/util/fanAttendanceUtil";
import { EventType, QueueMessageFanReaction } from "@src/fanAttendance/types";

/**
 * Retrieves the scheduled event ID (as active) associated within a specific channel in a guild.
 *
 * @param {ChatInputCommandInteraction} interaction - The interaction object from the command.
 * @param {string} channelId - The ID of the channel to find the scheduled event for.
 * @returns {Promise<string|void>} The scheduled event ID, or undefined if no event is found.
 */
export async function getActiveStatusEventByScheduledEventId(
    interaction: ChatInputCommandInteraction,
    channelId: string
) {
    let guild: Guild;
    // retrieve the guild from the cache
    guild = client.guilds.cache.get(interaction.guildId);

    if (!guild) {
        // Guild not in cache, fetch it
        guild = await client.guilds.fetch(interaction.guildId);
    }

    // Try to find the event in the cache first
    let currentEvent = guild.scheduledEvents.cache.find(
        (event) =>
            event.channelId === channelId &&
            event.status === GuildScheduledEventStatus.Active
    );

    // Find the event associated within stage channel which is currently active
    //     Scheduled = 1,
    //     Active = 2,
    //     Completed = 3,
    //     Canceled = 4,

    if (!currentEvent) {
        // Event not in cache, fetch scheduled events
        logInfo(`Event not in cache, fetching scheduled events`);
        const scheduledEvents = await guild.scheduledEvents.fetch();
        currentEvent = scheduledEvents.find(
            (event) =>
                event.channelId === channelId &&
                event.status === GuildScheduledEventStatus.Active
        );
        logInfo(`Completed fetching scheduled events.`);
    }

    if (!currentEvent) {
        const errMsg = `No active event found for channel ${channelId}. Cannot record user activity`;
        logInfo(errMsg);
        await interaction.editReply(errMsg);
        return;
    }
    return currentEvent.id;
}

/**
 * Gets the active discord event session code for a given scheduled event ID.
 * @param interaction - The interaction object from the command.
 * @param scheduledEventId - The ID of the scheduled event to find the discord event for.
 * @returns
 */
export async function getActiveDiscordEventSessionCodeByScheduledEventId(
    interaction: ChatInputCommandInteraction,
    scheduledEventId: string
) {
    const channelId = interaction.channelId;
    const query = {
        status: "active",
        scheduledEventId: scheduledEventId,
    };
    const iDiscordEvent = await findOneDiscordEventByQuery(query);

    if (!iDiscordEvent) {
        const infoMsg = `No active event found for channel ${channelId}. Cannot record your reaction`;
        logInfo(infoMsg);
        await interaction.editReply(infoMsg);
        return;
    }

    if (!isPlaytestEvent(iDiscordEvent.discordEventType)) {
        const infoMsg = `No active Playtest event found for channel ${channelId}. Cannot record your reaction`;
        logInfo(infoMsg);
        await interaction.editReply(infoMsg);
        return;
    }

    const sessionCode = iDiscordEvent.sessionCode;

    if (!sessionCode) {
        const infoMsg = `No session code found for channel ${channelId}. Cannot record user activity`;
        logInfo(infoMsg);
        await interaction.editReply(infoMsg);
        return;
    }

    return sessionCode;
}

/**
 * Command handler for /fan react
 * @param interaction
 * @dev - use logInfo for logging user interaction (given a user can call this command from a non-playtest channel)
 */
export async function handleFanReact(interaction: ChatInputCommandInteraction) {
    try {
        // Defer the reply to check if user is on cooldown
        await interaction.deferReply({ ephemeral: true });

        const discordTag = interaction.user.tag;
        const discordId = interaction.user.id;
        const fanReaction = interaction.options.getString(REACTION);
        const channelId = interaction.channelId;

        // check if user is on cooldown - prevents spamming of reactions
        if (verifyAndUpdateUserCooldownStatus(discordId)) {
            const infoMsg = `${discordTag} is on cooldown`;
            logInfo(infoMsg);
            await interaction.editReply({
                content:
                    "You've recently reacted! Please wait a moment before reacting again",
            });
            return;
        }

        await interaction.editReply({
            content: "Acknowledging your reaction...",
        });

        logInfo(`${discordTag} has reacted with '${fanReaction}'`);

        const scheduledEventId = await getActiveStatusEventByScheduledEventId(
            interaction,
            channelId
        );

        // If no event is found, return undefined - as reaction could be triggered by user in a non Playtest event channel
        if (!scheduledEventId) {
            const infoMsg = `No scheduled event found for channel ${channelId}. Cannot record user activity`;
            logInfo(infoMsg);
            await interaction.editReply(infoMsg);
            return;
        }

        const sessionCode =
            await getActiveDiscordEventSessionCodeByScheduledEventId(
                interaction,
                scheduledEventId
            );

        // validate if user is visible in the stands
        const isUserVisibleInStands = await isUserInStands(
            sessionCode,
            discordId
        );

        if (!isUserVisibleInStands) {
            const infoMsg = `User ${discordTag} is not visible in the stands for session ${sessionCode}`;
            logInfo(infoMsg);
            await interaction.editReply(
                `Looks like you're not visible in the stands!`
            );
            return;
        }

        await interaction.deleteReply();

        // optimistically send message to channel for UX (fails would be sent as a ephemeral message)
        const replyMsg = `${getDiscordUserReference(
            discordId
        )} reacted with emote ${fanReaction}`;

        // send to reaction to channel of the event/interaction
        await sendMessageToChannel(channelId, replyMsg);
        logInfo(replyMsg);

        const timestampUnix = getCurrentUnixTimestampSeconds();

        if (!sessionCode) {
            const errMsg = `No active session code found for channel ${channelId}. Cannot record user activity`;
            logInfo(errMsg);
            await interaction.editReply(errMsg);
            return;
        }

        // send user reaction to redis
        const reactionChannel = `eventChannelReactions-${sessionCode}`;
        const userActivity: QueueMessageFanReaction = {
            eventType: EventType.FAN_REACTION,
            discordId: interaction.user.id,
            timestamp: timestampUnix,
            reaction: fanReaction,
        };

        await notifyGameServerOfUserChannelReaction(
            reactionChannel,
            userActivity
        );

        return;
    } catch (e) {
        const errMsg = `Failed to process user reaction for fan attendance ${e}`;
        logError(errMsg);
        await interaction.editReply(errMsg);
        return;
    }
}

/**
 * Interface mapping user IDs to cooldown times.
 */
interface fanReactionCooldownMap {
    [discordId: string]: number;
}

const userCooldowns = {} as fanReactionCooldownMap;
const COOLDOWN_TIME = 10000; // 10 seconds

/**
 * Checks and updates if a user is on cooldown map. Prevents spamming of reactions during a playtest.
 * @param {string} discordId - The ID of the user to check.
 * @returns {boolean} - `true` if the user is on cooldown, `false` otherwise.
 */
function verifyAndUpdateUserCooldownStatus(discordId: string) {
    const now = Date.now();
    if (userCooldowns[discordId] && userCooldowns[discordId] > now) {
        return true;
    }
    userCooldowns[discordId] = now + COOLDOWN_TIME;
    return false;
}
