import { REDIS_RPUSH_EXPIRY_SECONDS } from "@src/constants";
import { findOneDiscordEventByQuery } from "@repo/schemas";
import { logInfo } from "@src/logger";
import {
    createChannelEntranceQueueMessage,
    isPlaytestEvent,
} from "@src/util/fanAttendanceUtil";
import { redisClient } from ".";
import {
    QueueMessageChannelEntrance,
    QueueMessageChannelExit,
    QueueMessageJoinType,
    QueueMessageEventCreation,
    QueueMessageFanReaction,
    ReceiveMessageDiscordAirdropRecipient,
    EventType,
} from "@src/fanAttendance/types";
import { User } from "discord.js";
import { getCurrentUnixTimestampSeconds } from "@src/util/util";

/**
 * Notifies the game server of a channel entrance or exit event.
 * @param scheduledEventId - id of the event
 * @param user - discord user object
 * @param joinType - type of join (entrance or exit)
 */
export async function notifyGameServerOfChannelEntranceExitEvent(
    scheduledEventId: string,
    user: User,
    joinType: QueueMessageJoinType
) {
    console.log(`Handling event listener to redis on '${scheduledEventId}'`);

    let userActivityVar: QueueMessageChannelExit | QueueMessageChannelEntrance;
    const query = {
        scheduledEventId: scheduledEventId,
    };
    const iDiscordEvent = await findOneDiscordEventByQuery(query);

    if (!isPlaytestEvent(iDiscordEvent.discordEventType)) {
        return;
    }

    const sessionCode = iDiscordEvent.sessionCode;

    // only enrich channel entrance
    if (joinType == QueueMessageJoinType.ENTRANCE) {
        userActivityVar = await createChannelEntranceQueueMessage(user);
    } else {
        // Notify game server of channel exit
        const userActivityExit: QueueMessageChannelExit = {
            eventType: EventType.CHANNEL_EXIT,
            discordId: user.id,
            timestamp: getCurrentUnixTimestampSeconds(),
        };

        userActivityVar = userActivityExit;
    }

    if (!sessionCode) {
        const errMsg =
            "handleAddMessageToQueueEventBacklog: unable to add message to queue, sessionCode is null";
        logInfo(errMsg);
    }

    const queueKey = `eventBacklog-${sessionCode}`;
    const userActivityString = JSON.stringify(userActivityVar); // serialize
    addMessageToQueue(queueKey, userActivityString, REDIS_RPUSH_EXPIRY_SECONDS);
}

/**
 * Notifies the game server of a event creation.
 * @param queueKey - The key for the Redis queue.
 * @param discordEventCreated - The message to be added to the queue.
 */
export async function notifyGameServerOfEventCreation(
    sessionCode: string,
    discordEventCreated: QueueMessageEventCreation
) {
    const queueKey = `eventBacklog-${sessionCode}`;
    const discordEventCreatedString = JSON.stringify(discordEventCreated); // Serialize discordEventTyped
    addMessageToQueue(
        queueKey,
        discordEventCreatedString,
        REDIS_RPUSH_EXPIRY_SECONDS
    );
}

/**
 * Notifies the game server of a user's channel reaction.
 * Handles adding a message to a Redis queue for channel reactions.
 * @param queueKey - The key for the Redis queue.
 * @param channelReactionObj - The message to be added to the queue.
 */
export async function notifyGameServerOfUserChannelReaction(
    queueKey: string,
    channelReactionObj: QueueMessageFanReaction
) {
    const channelReactionString = JSON.stringify(channelReactionObj); // serialize
    addMessageToQueue(
        queueKey,
        channelReactionString,
        REDIS_RPUSH_EXPIRY_SECONDS
    );
}

/**
 * Handles adding a message to a Redis queue for airdrop recipients.
 * @param queueKey - The key for the Redis queue.
 * @param discordAirdropRecipientObj - The message to be added to the queue.
 */
export async function handleAddMessageToQueueAirdropRecipient(
    queueKey: string,
    discordAirdropRecipientObj: ReceiveMessageDiscordAirdropRecipient
) {
    const discordAirdropRecipientString = JSON.stringify(
        discordAirdropRecipientObj
    );
    addMessageToQueue(queueKey, discordAirdropRecipientString);
}

/**
 * Adds a message to a Redis queue and sets an expiry if the queue is newly created.
 * @param queueKey - The key for the Redis queue.
 * @param message - The message to be added to the queue.
 * @param expiry - The expiry time in seconds for the queue. (Optional)
 */
export async function addMessageToQueue(
    queueKey: string,
    message: string,
    expiry = 0
): Promise<void> {
    try {
        // Use a Redis transaction to ensure atomicity
        const transaction = redisClient.multi();
        // Add the message to the queue
        transaction.rpush(queueKey, message);

        // If an expiry is specified and the list is new, set the expiry time
        if (expiry > 0 && (await redisClient.exists(queueKey)) === 0) {
            transaction.expire(queueKey, expiry);
        }

        // Execute the transaction
        await transaction.exec();
        console.log(`Message added to queue ${queueKey}:`, message);
    } catch (error) {
        // Enhance the error with additional context or use a custom error
        throw new Error(`addMessageToQueue failed: ${error.message}`);
    }
}

/**
 * Publish a message to a redis channel
 * @param channelName
 * @param message
 * @returns - number of subscribers
 */
export async function publishToRedisChannel(
    channelName: string,
    message: string
): Promise<number> {
    try {
        const subscribers = await redisClient.publish(channelName, message);
        console.log(`Published to channel ${channelName}:`, message);
        return subscribers;
    } catch (error) {
        console.error("Error publishing to channel:", error);
        return error;
    }
}
