import { logError, logInfo } from "@src/logger";
import {
    createDiscordIdMinutesWatchedMap,
    getDiscordEventChannelListener,
    removeDiscordEventChannelListener,
} from "@src/util/wildevents/discordEventUtil";
import {
    EmbedBuilder,
    Events,
    ThreadAutoArchiveDuration,
    ThreadChannel,
} from "discord.js";
import { client } from "@src/index";
import { UserIdMinutesAttended } from "@repo/interfaces";
import { IDiscordEvent } from "@repo/interfaces";
import { findUsersByQuery, updateOneDiscordEventDB } from "@repo/schemas";
import { Types } from "mongoose";
import {
    getChannel,
    getThreadChannel,
    sendMessage,
} from "@src/util/discordUtil";
import { getWildeventsChannelId } from "@src/util/environmentUtil";
import { partitionEmbedFieldData } from "@src/util/embedUtil";

interface UserDiscordData {
    _id?: Types.ObjectId;
    discordId?: string;
    walletAddress?: string;
}

/**
 * Handle the conclusion of a Discord event by removing the channel listener, updating the event in the DB, and preparing and saving the transaction bundle
 * @param iDiscordEvent The Discord event DB object
 */
export async function handleDiscordEventConcluding(
    iDiscordEvent: IDiscordEvent
) {
    try {
        logInfo(`Discord event '${iDiscordEvent.name}' is concluding`);
        await removeChannelListener(iDiscordEvent);
        const discordEventEndTime = Date.now();

        // Update the Discord event with the actual end time
        const foundDiscordStageDoc = await updateOneDiscordEventDB(
            { scheduledEventId: iDiscordEvent.scheduledEventId },
            {
                endTime: new Date(discordEventEndTime),
            }
        );

        if (!foundDiscordStageDoc) {
            logError(
                `Failed to find a matching Discord event in the DB '${iDiscordEvent.name} - ${iDiscordEvent.scheduledEventId}' with actual end time`
            );
            return;
        }

        // Get the minutes watched for each user and determine which users need to be minted a Wildfile
        const discordIdToMinsWatchedMap = createDiscordIdMinutesWatchedMap(
            iDiscordEvent,
            discordEventEndTime
        );

        // Conclude parts of discord event
        await handleDiscordEvent(iDiscordEvent, discordIdToMinsWatchedMap);
    } catch (e) {
        logError(
            `Failed to handle Discord event conclusion '${iDiscordEvent.name} - ${iDiscordEvent.scheduledEventId}:'`,
            e
        );
    }
}
/**
 * Remove the channel listener associated with the Discord event
 * @param iDiscordEvent The Discord event DB object
 */
async function removeChannelListener(iDiscordEvent: IDiscordEvent) {
    const listener = getDiscordEventChannelListener(
        iDiscordEvent.scheduledEventId
    );
    // Attempt to remove the channel listener
    if (listener) {
        // remove the channel listener
        client.off(Events.VoiceStateUpdate, listener);
        removeDiscordEventChannelListener(iDiscordEvent.scheduledEventId);
    } else {
        // If the Discord event concluded while the bot was offline, there won't be a listener
        logError(
            `Failed to find a listener for Discord event '${iDiscordEvent.name} - ${iDiscordEvent.scheduledEventId}'`
        );
    }
}

/**
 * Prepare the transactions associated with the conclusion of a Discord event into a transaction bundle
 * @param iDiscordEvent The Discord event DB object
 * @param durationMinutes The duration of the Discord event in minutes
 * @param discordIdToMinsWatchedMap A map of Discord IDs to the minutes watched by each user
 * @returns A promise resolving to the transaction bundle
 */
async function handleDiscordEvent(
    iDiscordEvent: IDiscordEvent,
    discordIdToMinsWatchedMap: {
        [discordId: string]: number;
    }
): Promise<IDiscordEvent> {
    let updatedDiscordEvent: IDiscordEvent = iDiscordEvent;
    // Format user projections for attendees and filter out users not associated with Wildcard
    // Ensure the projections have BOTH wallet address & discord Id
    const userDiscordData = await configureUserDiscordData(
        discordIdToMinsWatchedMap
    );

    try {
        // Handle the transaction for the Discord Event
        updatedDiscordEvent = await handleDiscordEventTransactions(
            updatedDiscordEvent
        );
    } catch (e) {
        // If the Discord Event tranasaction or Wildfile transaction fails, log the error
        logError(
            `Failed to prepare transaction bundle for Discord event '${iDiscordEvent.name} - ${iDiscordEvent.scheduledEventId}'`,
            e
        );
        throw new Error(e.message);
    }

    // Handle the transaction for the DISCORD EVENT ATTENDANCE
    updatedDiscordEvent = await handleAttendanceTransactions(
        updatedDiscordEvent,
        userDiscordData,
        discordIdToMinsWatchedMap
    );

    return updatedDiscordEvent;
}

/**
 * Configure the an object of the user's data related to discord: DB ID, Discord ID, and Wallet Address
 * @param discordIdToMinsWatchedMap A map of Discord IDs to the minutes watched by each user
 * @returns A promise resolving to an array of users' discord data
 */
async function configureUserDiscordData(discordIdToMinsWatchedMap: {
    [discordId: string]: number;
}): Promise<UserDiscordData[]> {
    let discordIds = Object.keys(discordIdToMinsWatchedMap);
    const userDiscordData: UserDiscordData[] = [];
    const MINT_WILDFILE_BATCH_SIZE = 100; // Adjust the batch size as needed

    for (let i = 0; i < discordIds.length; i += MINT_WILDFILE_BATCH_SIZE) {
        const batchIds = discordIds.slice(i, i + MINT_WILDFILE_BATCH_SIZE);
        const batchUserProjs = await findUsersByQuery(
            {
                "discordProvider.id": { $in: batchIds },
                "walletProvider.address": { $exists: true, $ne: null },
            },
            { "walletProvider.address": 1, "discordProvider.id": 1 }
        );

        // Map the fetched data to the desired projection format
        const discordDataFromProjections: UserDiscordData[] =
            batchUserProjs.map(
                (userProj) =>
                    ({
                        _id: userProj._id,
                        discordId: userProj.discordProvider?.id,
                        walletAddress: userProj.walletProvider?.address,
                    } as UserDiscordData)
            );

        userDiscordData.push(...discordDataFromProjections);
    }
    return userDiscordData;
}

/**
 * Add the Discord event Id and duration to the Discord Event Wildevent transaction in the bundle
 * @param iDiscordEvent The Discord event DB object
 * @param transactionBundle The transaction bundle to add the transaction to
 * @param durationMinutes The duration of the Discord event in minutes
 */
async function handleDiscordEventTransactions(
    iDiscordEvent: IDiscordEvent
): Promise<IDiscordEvent> {
    try {
        logInfo(
            `Processing the Discord event [${iDiscordEvent.scheduledEventId}]`
        );

        // TODO: a different channel ID will need to be defined
        const wildeventsChannel = await getChannel(getWildeventsChannelId());
        if (!wildeventsChannel) {
            logError(
                `Failed to find the Wildevents channel for Discord event: ${iDiscordEvent.name} - ${iDiscordEvent.scheduledEventId}`
            );
            return;
        }

        // Send confirmation message in the designated channel
        const discordEventBroadcastMsg = await wildeventsChannel.send({
            content: `The Discord event ***${iDiscordEvent.name}*** has concluded!`,
        });

        // Create the thread where all related info will be posted
        let wildeventsThread: ThreadChannel<boolean>;
        try {
            wildeventsThread = await discordEventBroadcastMsg.startThread({
                name: `${iDiscordEvent.name} Attendance`,
                autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
            });
            await sendMessage(
                wildeventsThread,
                "Attendance will be posted in this thread"
            );
        } catch (e) {
            const errMsg = `Error while creating attendance thread for Discord event '${iDiscordEvent.name}: ${e}'`;
            logError(errMsg);
            throw new Error(errMsg);
        }

        // Update the Discord event in the database as completed with the broadcast message and thread details
        const update = {
            $set: {
                broadcastMessageId: discordEventBroadcastMsg.id,
                discordEventThreadId: wildeventsThread.id,
            },
        };

        const updatedDiscordEvent: IDiscordEvent =
            await updateOneDiscordEventDB(
                {
                    scheduledEventId: iDiscordEvent.scheduledEventId,
                },
                update
            );

        return updatedDiscordEvent;
    } catch (e) {
        const errMsg = `Failed to handle the Discord event conclusion: ${e}`;
        logError(errMsg);
        throw new Error(errMsg);
    }
}

/**
 * Add the Discord event Id, user projections, Wildfile IDs, and minutes attended to the Discord Event Attendance Wildevent transaction in the bundle; initiate a new transaction if a set batch size is exceeded
 * @param iDiscordEvent The Discord event DB object
 * @param transactionBundle The transaction bundle to add the transaction to
 * @param wildfileIds The Wildfile IDs of all the attendees
 * @param userDiscordData The user projections with addresses and Discord IDs
 * @param discordIdToMinsWatchedMap A map of Discord IDs to the minutes watched by each user
 * @returns A promise resolving to the transaction bundle
 */
async function handleAttendanceTransactions(
    iDiscordEvent: IDiscordEvent,
    userDiscordData: UserDiscordData[],
    discordIdToMinsWatchedMap: {
        [discordId: string]: number;
    }
): Promise<IDiscordEvent> {
    let updatedDiscordEvent: IDiscordEvent = iDiscordEvent;
    try {
        const userIds = userDiscordData.map((user) => user._id);
        // Map the mintues attended to the index of their corresponding user's Discord ID
        const minutesAttended = userDiscordData.map(
            (userDiscordData) =>
                discordIdToMinsWatchedMap[userDiscordData.discordId]
        );

        const userIdMinutesAttended: UserIdMinutesAttended[] = userIds.map(
            (userId, index) => ({
                userId,
                minutesAttended: minutesAttended[index],
            })
        );

        updatedDiscordEvent = await updateOneDiscordEventDB(
            { scheduledEventId: updatedDiscordEvent.scheduledEventId },
            {
                $push: {
                    userIdMinutesAttended,
                },
            }
        );

        try {
            // Notify Discord channel about successful transaction
            const wildeventsThread = await getThreadChannel(
                updatedDiscordEvent.discordEventThreadId
            );
            if (!wildeventsThread) {
                throw new Error(
                    "Failed to find the Wildevents thread channel for the Discord event"
                );
            }

            // Prepare embed field data for partitioning
            const embedFieldsToPartition = [
                userIds.map((id) => id.toString()),
                minutesAttended.map((minutes) => minutes.toString()),
            ];
            const partitionedEmbedData = partitionEmbedFieldData(
                embedFieldsToPartition
            );
            const embeds: EmbedBuilder[] = [];

            // Check the total number of partitions
            const totalPartitions = partitionedEmbedData.length;

            // Create an embed for each partition of data
            partitionedEmbedData.forEach((embedDataChunk, index) => {
                // Determine the title based on whether there are multiple partitions
                const title =
                    totalPartitions > 1
                        ? `Discord Event Attendance Recorded (${
                              index + 1
                          } of ${totalPartitions})`
                        : "Discord Event Attendance Recorded";

                const embed = new EmbedBuilder().setTitle(title).addFields(
                    {
                        name: "User IDs",
                        value: embedDataChunk[0].join("\n"), // User IDs from the first list
                        inline: true,
                    },
                    {
                        name: "Minutes Attended",
                        value: embedDataChunk[1].join("\n"), // Minutes Attended from the second list
                        inline: true,
                    }
                );

                embeds.push(embed);
            });

            await sendMessage(wildeventsThread, {
                content: `Successfully recorded user attendance!`,
                embeds,
            });
        } catch (e) {
            logError(
                `Error writing Discord Event Attendance Wildevent metrics to the Wildevents channel: ${e}`
            );
        }
    } catch (e) {
        logError(
            `Failed to prepare the Discord Event Attendance Wildevent transaction bundle for Discord event ${iDiscordEvent.name} - ${iDiscordEvent.scheduledEventId}:`,
            e
        );
    }

    return updatedDiscordEvent;
}
