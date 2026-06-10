import { v4 as uuidv4 } from "uuid";
import { notifyGameServerOfEventCreation } from "@src/redis/utils";
import {
    GuildScheduledEvent,
    VoiceChannel,
    StageChannel,
    User,
} from "discord.js";
import { buildFanVisEmbedEventCreation } from "./embedUtil";
import { logError, logInfo } from "@src/logger";
import { getCurrentUnixTimestampSeconds } from "./util";
import {
    EventType,
    QueueMessageChannelEntrance,
    QueueMessageEventCreation,
    ReceiveMessageDiscordAirdropRecipient,
} from "@src/fanAttendance/types";
import { redisClient } from "@src/redis";
import {
    alertAirdropAdmins,
    getUserAvatarUrl,
    removeNewUsernameDiscriminator,
} from "./discordUtil";
import { AirdropRequest, IDiscordEvent, LuckyWinner } from "@repo/interfaces";
import {
    findOneUserByQuery,
    createDiscordEventDB,
    updateOneDiscordEventDB,
} from "@repo/schemas";

/**
 * Checks if the given event name includes any variation of "Playtest: <event name>"
 * "Playtest" keyword/label is specified by the Discord Events Moderator to enable fan visibility during stage events.
 * @param eventType The name of the event to check.
 * @returns {boolean} True if the event name includes a variation of "Playtest", otherwise false.
 */
export function isPlaytestEvent(eventType: string): boolean {
    // additional validation checks: define variations of "Playtest" to look for
    const variations = ["play test", "play test:", "playtest", "playtest:"];

    // Check if eventType includes any of the variations (case-insensitive)
    return variations.some((variation) =>
        eventType.toLowerCase().includes(variation)
    );
}

/**
 * Handles creation of a discord event with a session code
 * If discord event is playtest type, notifies admin and game server about session code
 * @param iDiscordEvent - the discord event to handle
 */
export async function handleDiscordEventSessionCodeCreation(
    iDiscordEvent: IDiscordEvent,
    gse: GuildScheduledEvent
) {
    try {
        if (!isPlaytestEvent(iDiscordEvent.discordEventType)) {
            return;
        }
        // session code for game server to sync with a discord event
        const generatedSessionCode = generateGameSessionCode();

        const discordEventWithSessionCode = {
            ...iDiscordEvent,
            sessionCode: generatedSessionCode,
        };

        const discordEventCreated = await createDiscordEventDB(
            discordEventWithSessionCode
        );

        if (!discordEventCreated) {
            logError("Failed to insert discord event into database");
            return;
        }

        const notifyAdminAndGameServer =
            await notifyAdminsAndGameServerAboutSessionCode(
                discordEventWithSessionCode,
                gse
            );
    } catch (e) {
        logError(
            `Failed to handle discord event session code creation ${iDiscordEvent._id}`,
            e
        );
    }
}

/**
 * Handles updating a session code for the event if a session code doesn't exist
 * @dev - reconcile logic used for updating an event with a session code if the event was created without a session code (and changed to a playtest event)
 * If discord event is playtest type, creates a queue channel for the event
 * @param iDiscordEvent - the discord event to handle
 */
export async function handleDiscordEventWithSessionCodeUpdate(
    newGse: GuildScheduledEvent,
    iDiscordEvent: IDiscordEvent
) {
    try {
        // session code for game server to sync with a discord event
        const generatedSessionCode = generateGameSessionCode();

        const update = {
            $set: {
                name: iDiscordEvent.name,
                description: iDiscordEvent.description,
                image: iDiscordEvent.image || "",
                url: iDiscordEvent.url,
                status: iDiscordEvent.status,
                scheduledStartTime: iDiscordEvent.scheduledStartTime,
                discordEventType: iDiscordEvent.discordEventType,
                channelId: iDiscordEvent.channelId,
                sessionCode: generatedSessionCode,
            },
        };

        const query = { scheduledEventId: newGse.id };
        const iDiscordEventUpdated = await updateOneDiscordEventDB(
            query,
            update
        );

        if (!iDiscordEventUpdated) {
            logError("Failed to insert discord event into database");
            return;
        }

        await notifyAdminsAndGameServerAboutSessionCode(
            iDiscordEventUpdated,
            newGse
        );

        return iDiscordEventUpdated;
    } catch (e) {
        logError(
            `Failed to handle updated discord event with session code ${iDiscordEvent._id}`,
            e
        );
    }
}

/**
 * Handles notifying about session code and playtest event creation.
 * @param iDiscordEvent - the discord event to handle
 * @param gse - the guild scheduled event
 */
async function notifyAdminsAndGameServerAboutSessionCode(
    iDiscordEvent: IDiscordEvent,
    gse: GuildScheduledEvent
) {
    if (!isPlaytestEvent(iDiscordEvent.discordEventType)) {
        return;
    }

    const discordEventSessionCode = iDiscordEvent.sessionCode;
    if (!discordEventSessionCode) {
        logError(
            `No session code found for event ${iDiscordEvent.name}. Skipping notifying admins and game server.`
        );
        return;
    }
    const discordEventTyped: QueueMessageEventCreation = {
        eventType: EventType.PLAYTEST_CREATED,
        sessionCode: discordEventSessionCode,
        scheduledEventId: iDiscordEvent.scheduledEventId,
        channelId: iDiscordEvent.channelId,
        name: iDiscordEvent.name,
        description: iDiscordEvent.description || "",
        discordEventType: iDiscordEvent.discordEventType,
        image: iDiscordEvent.image || "",
        url: iDiscordEvent.url,
        status: iDiscordEvent.status,
        scheduledStartTime: iDiscordEvent.scheduledStartTime,
    };
    const scheduledEventId = gse.channel;
    await notifyGameServerOfEventCreation(
        discordEventSessionCode,
        discordEventTyped
    );
    await sendSessionCodePrivateAdminChannel(iDiscordEvent, scheduledEventId);
}

/**
 * Sends the session code to the private admin channel upon discord event creation (in embed format)
 * @param discordEventCreatedWithSessionCode - the discord event to handle
 * @param scheduledEventId - the id of the scheduled event
 */
export async function sendSessionCodePrivateAdminChannel(
    discordEventCreatedWithSessionCode: IDiscordEvent,
    scheduledEventId: VoiceChannel | StageChannel
) {
    const fanVisEmbedEventCreation = await buildFanVisEmbedEventCreation(
        discordEventCreatedWithSessionCode
    );

    // Send message to private admin channel
    await alertAirdropAdmins({
        content: `Hi Admins!, a Playtest event is scheduled to go live in ${scheduledEventId}.\nYour code is: **${discordEventCreatedWithSessionCode.sessionCode}** for event **${discordEventCreatedWithSessionCode.name}**`,
        embeds: [fanVisEmbedEventCreation],
    });

    const infoMsg = `Sent game session code to private admin channel for event ${discordEventCreatedWithSessionCode.name}`;
    logInfo(infoMsg);
}

/**
 * Creates a queue message for a user entering a voice channel
 * @param user - discord user object
 * @returns - enriched user activity object
 */
export async function createChannelEntranceQueueMessage(
    user: User
): Promise<QueueMessageChannelEntrance> {
    const discordId = user.id;
    logInfo(`Handling event listener to redis: on ${discordId}`);

    // get guild specific avatar url (or global avatar url) for user
    const discordUserAvatarUrl = await getUserAvatarUrl(user);

    try {
        const discordUser = await findOneUserByQuery({
            "discordProvider.id": discordId,
        });
        if (!discordUser) {
            logInfo(`No Discord User found for discordId ${discordId}`);
            const nonLinkedWalletAddressDiscordMember = {
                eventType: EventType.CHANNEL_ENTRANCE,
                discordId: user.id,
                discordTag: user.username,
                discordAvatarUrl: discordUserAvatarUrl,
                timestamp: getCurrentUnixTimestampSeconds(),
            };
            return nonLinkedWalletAddressDiscordMember;
        }
        return {
            eventType: EventType.CHANNEL_ENTRANCE,
            discordId: discordUser.discordProvider.id,
            discordTag: removeNewUsernameDiscriminator(
                discordUser.discordProvider?.discordTag
            ),
            discordAvatarUrl: discordUserAvatarUrl,
            walletAddress: discordUser.walletProvider?.address,
            pfp: discordUser.walletProvider?.pfp,
            timestamp: getCurrentUnixTimestampSeconds(),
        };
    } catch (e) {
        logError("Error while creating channel entrance queue message", e);
        return null;
    }
}

/**
 * Generate a 6 digit random code of to be used to sync a live event with a game session
 * @returns - random code
 */
export function generateGameSessionCode(): string {
    const uuid = uuidv4().replace(/-/g, "");
    return uuid.substring(0, 6);
}

/**
 * Checks hashmap if a user is marked as visible (value "1") in a specific SpectatorEvent.
 *
 * @param sessionCode The code for the SpectatorEvent.
 * @param discordId The Discord ID of the user.
 * @returns A promise that resolves to a boolean indicating if the user is visible.
 */
export async function isUserInStands(
    sessionCode: string,
    discordId: string
): Promise<boolean> {
    const key = `fansVisible-${sessionCode}`;
    const fanVisibility = await redisClient.hget(key, discordId);

    logInfo(`isUserInStands: ${discordId}, ${key} - ${fanVisibility}`);

    // Check if the value is "1", indicating visibility
    return fanVisibility === "1";
}

/***
 * Parses a message from the redis queue into a ReceiveMessageDiscordAirdropRecipient object
 */
export function parseAirdropRecipientMessageToObj(
    message: string
): AirdropRequest | null {
    try {
        const parsedAirdropRequest = JSON.parse(message);

        // Validate that parsed object matches the expected structure
        if (typeof parsedAirdropRequest.EventId !== "string") {
            logError(`Invalid EventId: ${parsedAirdropRequest.EventId}`);
            return null;
        }
        if (typeof parsedAirdropRequest.MatchId !== "string") {
            logError(`Invalid MatchId: ${parsedAirdropRequest.MatchId}`);
            return null;
        }
        if (typeof parsedAirdropRequest.GiftId !== "string") {
            logError(`Invalid GiftId: ${parsedAirdropRequest.GiftId}`);
            return null;
        }
        if (!Array.isArray(parsedAirdropRequest.Winners)) {
            logError(`Invalid Winners array: ${parsedAirdropRequest.Winners}`);
            return null;
        }
        // Validate each winner
        const invalidWinner = parsedAirdropRequest.Winners.find(
            (winner: any) =>
                typeof winner.FanId !== "string" ||
                typeof winner.Timestamp !== "number"
        );
        if (invalidWinner) {
            logError(
                `Invalid winner entry: FanId=${invalidWinner?.FanId}, Timestamp=${invalidWinner?.Timestamp}`
            );
            return null;
        }

        // Map parsed values to internal structure
        const airdropRequest: AirdropRequest = {
            eventId: parsedAirdropRequest.EventId,
            matchId: parsedAirdropRequest.MatchId,
            giftId: parsedAirdropRequest.GiftId,
            winners: parsedAirdropRequest.Winners.map((winner: any) => ({
                userId: winner.FanId, // Mapping FanId to userId internally
                timestamp: winner.Timestamp,
            })),
        };

        return airdropRequest;
    } catch (e) {
        logError(
            `Error parsing message from redis queue to airdrop request object: ${e.message}`
        );
        return null;
    }
}
