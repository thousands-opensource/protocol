import { IDiscordEvent } from "@repo/interfaces";
import { handleDiscordEventConcluding } from "@src/commands/discord-events/concludeDiscordEvent";
import {
    handleGuildScheduledEventCreated,
    handleGuildScheduledEventUpdated,
} from "@src/commands/discord-events/discordEventEventListener";
import { handleDiscordEventStarting } from "@src/commands/discord-events/startDiscordEvent";
import {
    deleteOneDiscordEventDB,
    findDiscordEventsByQuery,
    findOneDiscordEventByQuery,
    updateOneDiscordEventDB,
} from "@repo/schemas";
import { client } from "@src/index";
import { logError, logInfo } from "@src/logger";
import { getGuild, sendMessageToChannel } from "@src/util/discordUtil";
import { getPrivateAdminChannelId } from "@src/util/environmentUtil";
import {
    addDiscordEventChannelListener,
    handleVoiceStateUpdate,
    removeDiscordEventChannelListener,
} from "@src/util/wildevents/discordEventUtil";

import { Events, StageChannel, VoiceChannel, VoiceState } from "discord.js";

/**
 * Called on startup to handle any user who may have entered/exited an active event while the bot was offline
 */
export async function reconcileDiscordEventsOnStartup() {
    logInfo("Reconciling discord events on startup...");

    // Find discord events that have either "scheduled" or "active" status
    let dbDiscordEvents = [];
    dbDiscordEvents = await findDiscordEventsByQuery({
        status: { $in: ["scheduled", "active"] },
    });

    // Get all discord events from discord
    const guild = await getGuild();
    const events = guild.scheduledEvents.cache.entries();
    const eventsArray = Array.from(events, ([key, value]) => value);

    // Update existing scheduled events and create new ones if they're not found in the database
    for (const event of eventsArray) {
        if (!event) {
            logInfo(
                "Reconcile Discord Events on Startup: Event is undefined while fetching cache events from discord. Skipping..."
            );
            continue;
        }
        // Find the corresponding event in scheduledDiscordEvents
        const dbEventIndex = dbDiscordEvents.findIndex(
            (e) => e.scheduledEventId === event.id
        );
        const dbEventStatus = dbDiscordEvents[dbEventIndex]?.status;

        /**
         * Valid Guild Scheduled Event Status Transitions
         * SCHEDULED --> ACTIVE
         * ACTIVE --------> COMPLETED
         * SCHEDULED --> CANCELED
         * */

        const nonexistentToScheduledOrActive =
            dbEventIndex === -1 && (event.isActive() || event.isScheduled());
        // non-existent to canceled or completed is not able to be reconciled
        const scheduledToScheduled =
            dbEventStatus === "scheduled" && event.isScheduled();
        const scheduledToActive =
            dbEventStatus === "scheduled" && event.isActive();
        const activeToActive = dbEventStatus === "active" && event.isActive();

        if (nonexistentToScheduledOrActive) {
            logInfo(
                `A new event ${event.name} [${event.id}] was created while offline. Handling event creation in bot.`
            );
            // create the event in the DB
            await handleGuildScheduledEventCreated(event);
            if (event.isActive()) {
                // if the event is active, start the event
                const discordEvent = await findOneDiscordEventByQuery({
                    scheduledEventId: event.id,
                });
                if (!discordEvent) {
                    logInfo(
                        `Did not find Discord event ${event.name} [${event.id}] in database. It will not be handled.`
                    );
                    return;
                }
                await handleDiscordEventStarting(discordEvent);
            }
            continue;
        }

        if (scheduledToScheduled) {
            logInfo(
                `Event ${event.name} [${event.id}] details could have changed while offline. Handling event update in bot.`
            );

            // update any details that may have changed
            await handleGuildScheduledEventUpdated(event, event, false);
            // removing the event from the array so we don't handle it again
            dbDiscordEvents.splice(dbEventIndex, 1);
            continue;
        }

        if (scheduledToActive) {
            logInfo(
                `An event ${event.name} [${event.id}] was started while offline. Handling event start in bot.`
            );
            const iDiscordEvent = dbDiscordEvents[dbEventIndex];
            if (!iDiscordEvent) {
                logInfo(
                    `Did not find Discord event with index ${dbEventIndex}. It will not be handled.`
                );
                return;
            }
            // start the event
            await handleDiscordEventStarting(iDiscordEvent);
            // removing the event from the array so we don't handle it again
            dbDiscordEvents.splice(dbEventIndex, 1);
            continue;
        }

        if (activeToActive) {
            logInfo(
                `An event ${event.name} [${event.id}] remained active while offline. Handling attendance reconciliation in bot.`
            );
            //  update any attendance that may have changed
            await reconcileActiveGuildScheduledEvent(
                dbDiscordEvents[dbEventIndex]
            );
            // removing the event from the array so we don't handle it again
            dbDiscordEvents.splice(dbEventIndex, 1);
            continue;
        }

        logError(
            `Case not handled for event ${event.name} [${event.id}]: Event Status - Database (${dbEventStatus}) & Event Status Code - Discord Cache (${event.status})`
        );
    }

    // Completed and Cancelled events are not in the discord cache, so we need to handle them separately
    // Loop through remaining events in dbDiscordEvents and handle them
    for (const dbDiscordEvent of dbDiscordEvents) {
        // active to completed
        if (dbDiscordEvent.status === "active") {
            logInfo(
                `Event ${dbDiscordEvent.name} [${dbDiscordEvent.scheduledEventId}] was concluded while offline. Handling event conclusion in bot.`
            );
            // update the event in the DB
            await handleDiscordEventConcluding(dbDiscordEvent);
            continue;
        }

        // scheduled to canceled
        if (dbDiscordEvent.status === "scheduled") {
            logInfo(
                `Event ${dbDiscordEvent.name} [${dbDiscordEvent.scheduledEventId}] was cancelled while offline. Handling event cancellation in bot.`
            );
            // delete the event from the DB
            await deleteOneDiscordEventDB({
                scheduledEventId: dbDiscordEvent.scheduledEventId,
            });

            // send a message to the admins saying the event was successfully deleted
            await sendMessageToChannel(
                getPrivateAdminChannelId(),
                `Successfully deleted Discord event ***${dbDiscordEvent.name}*** with event type ***${dbDiscordEvent.discordEventType}***. Attendance will ***NOT*** be written onchain`
            );
            continue;
        }
    }

    logInfo("Finished reconciling discord events on startup");
}

export async function reconcileActiveGuildScheduledEvent(
    discordEvent: IDiscordEvent
) {
    const eventId = discordEvent.scheduledEventId;
    const eventChannelId: string = discordEvent.channelId;
    logInfo(
        `Reconciling attendance for active discord event ${discordEvent.name} [${eventId}] in channel ${eventChannelId}`
    );

    const userCountMap = new Map<string, number>();
    // Count the number of entrances for each user
    for (const entrance of discordEvent.channelEntrances) {
        if (!userCountMap.has(entrance.discordId)) {
            userCountMap.set(entrance.discordId, 0);
        }
        userCountMap.set(
            entrance.discordId,
            userCountMap.get(entrance.discordId)! + 1
        );
    }
    // Count the number of exits for each user
    for (const exit of discordEvent.channelExits) {
        if (!userCountMap.has(exit.discordId)) {
            continue;
        }
        userCountMap.set(exit.discordId, userCountMap.get(exit.discordId)! - 1);
    }
    // Determine the last seen users by summing the entrances and exits
    // if someone has more entrances than exits, they are still in the channel
    const lastSeenUsers = [...userCountMap.entries()]
        .filter(([, count]) => count > 0)
        .map(([discordId]) => discordId);

    // Add listeners for active events

    logInfo(
        `The last seen users in the channel ${eventChannelId}: ${lastSeenUsers}`
    );

    const listener = (oldState: VoiceState, newState: VoiceState) => {
        if (
            newState.channelId === eventChannelId ||
            oldState.channelId === eventChannelId
        ) {
            handleVoiceStateUpdate(oldState, newState, eventChannelId, eventId);
        }
    };
    client.on(Events.VoiceStateUpdate, listener);
    addDiscordEventChannelListener(eventId, listener);

    // Get all users who are currently in the channel
    const channel = client.channels.cache.get(eventChannelId) as
        | VoiceChannel
        | StageChannel;

    if (!channel) {
        logError(
            `Channel of ID '${eventChannelId}' is not a VoiceChannel or StageChannel. Skipping.`
        );
        removeDiscordEventChannelListener(eventId);
        return;
    }
    logInfo(
        `Reattaching attendance listener for active discord event ${discordEvent.name} [${eventId}] in channel ${eventChannelId}`
    );

    // Get the current active users in the channel
    const currentUsersDiscordIds = Array.from(channel.members.values()).map(
        (member) => member.user.id
    );

    logInfo(
        `The current users in the channel ${eventChannelId}: ${currentUsersDiscordIds}`
    );

    // When the event was last active, if a current user wasn't there create an ENTRANCE for them
    // if a last seen member is no longer current, create an EXIT for them
    const newEntrances = currentUsersDiscordIds.filter(
        (discordId) => !lastSeenUsers.includes(discordId)
    );
    const newExits = lastSeenUsers.filter(
        (discordId) => !currentUsersDiscordIds.includes(discordId)
    );

    // Create DiscordUserActivity for entrances and exits
    const newEntranceActivities = newEntrances.map((discordId) => {
        const activity = { discordId, timestamp: Date.now() };
        logInfo(
            `User ${discordId} entered discord event ${discordEvent.name} [${eventId}] in channel ${eventChannelId}!`
        );
        return activity;
    });
    const newExitActivities = newExits.map((discordId) => {
        const activity = { discordId, timestamp: Date.now() };
        logInfo(
            `User ${discordId} exited discord event${discordEvent.name} [${eventId}] in channel ${eventChannelId}!`
        );
        return activity;
    });

    // Add them to the event
    const query = { scheduledEventId: eventId };
    await updateOneDiscordEventDB(query, {
        $push: {
            channelEntrances: { $each: newEntranceActivities },
            channelExits: { $each: newExitActivities },
        },
    });
}
