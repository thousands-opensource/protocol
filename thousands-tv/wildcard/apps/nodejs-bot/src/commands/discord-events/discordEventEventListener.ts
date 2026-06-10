import { handleDiscordEventConcluding } from "@src/commands/discord-events/concludeDiscordEvent";
import { handleDiscordEventStarting } from "@src/commands/discord-events/startDiscordEvent";
import {
    createDiscordEventDB,
    deleteOneDiscordEventDB,
    findOneDiscordEventByQuery,
    updateOneDiscordEventDB,
} from "@repo/schemas";
import { client } from "@src/index";
import { logError, logInfo } from "@src/logger";
import { sendMessageToChannel } from "@src/util/discordUtil";
import { getPrivateAdminChannelId } from "@src/util/environmentUtil";
import {
    Events,
    GuildScheduledEvent,
    GuildScheduledEventStatus,
} from "discord.js";

import {
    handleDiscordEventSessionCodeCreation,
    handleDiscordEventWithSessionCodeUpdate,
    isPlaytestEvent,
} from "@src/util/fanAttendanceUtil";
import { DiscordEventStatus, IDiscordEvent } from "@repo/interfaces";

/**
 * Initializes the Showdown listeners for when a GuildScheduledEvent is created/updated/deleted
 */
export function initDiscordEventEventListeners() {
    // guild event create handler
    client.on(
        Events.GuildScheduledEventCreate,
        async (gse: GuildScheduledEvent) => {
            try {
                await handleGuildScheduledEventCreated(gse);
            } catch (e) {
                logError("Failed to handle Guild Scheduled Event Create", e);
            }
        }
    );

    // guild event update handler
    client.on(
        Events.GuildScheduledEventUpdate,
        async (oldGse: GuildScheduledEvent, newGse: GuildScheduledEvent) => {
            try {
                await handleGuildScheduledEventUpdated(oldGse, newGse, true);
            } catch (e) {
                logError("Failed to handle Guild Scheduled Event Update", e);
            }
        }
    );

    // guild event delete handler
    client.on(
        Events.GuildScheduledEventDelete,
        async (gse: GuildScheduledEvent) => {
            try {
                await handleGuildScheduledEventDeleted(gse);
            } catch (e) {
                logError("Failed to handle Guild Scheduled Event Delete", e);
            }
        }
    );
}

/**
 * Handles a GuildScheduledEvent being created. Creates the corresponding Discord event in the database
 */
export async function handleGuildScheduledEventCreated(
    gse: GuildScheduledEvent
) {
    try {
        logInfo(`Handling guild scheduled event created: '${gse.name}'`);
        const iDiscordEvent = parseDiscordEvent(gse);
        const adminChannelId = getPrivateAdminChannelId();

        // there must be a channel associated with the event
        if (!iDiscordEvent.channelId) {
            const msg = `Not registering Discord event ***${iDiscordEvent.name}***, there is no channel associated with it`;
            logInfo(msg);
            await sendMessageToChannel(adminChannelId, msg);
            return;
        }

        // if the event is an in-game fan attendance playtest type
        if (isPlaytestEvent(iDiscordEvent.discordEventType)) {
            // handles creation of discord event in DB with session code and admin channel notification
            await handleDiscordEventSessionCodeCreation(iDiscordEvent, gse);
        } else {
            const discordEventCreated = await createDiscordEventDB(
                iDiscordEvent
            );
            if (!discordEventCreated) {
                logError("Failed to insert discord event into database");
                return;
            }
        }
        // send message to private admin channel saying event was created
        await sendMessageToChannel(
            adminChannelId,
            `Successfully registered Discord event ***${iDiscordEvent.name}*** with event type ***${iDiscordEvent.discordEventType}***. Attendance in channel ${gse.channel} will be written onchain. You can make changes to the event type, name, description, time, etc. until the event ends`
        );

        logInfo(
            `Successfully created new Discord Event:
- Name: ${iDiscordEvent.name}
- Description: ${iDiscordEvent.description}
- Event type: ${iDiscordEvent.discordEventType}
- Scheduled start time: ${iDiscordEvent.scheduledStartTime}
- Status: ${iDiscordEvent.status}
- Channel id: ${iDiscordEvent.channelId}`
        );
    } catch (e) {
        logError(
            "handleGuildScheduledEventCreated: Failed to handle Guild Scheduled Event Create",
            e
        );
    }
}

/**
 * Handles a GuildScheduledEvent being updated. Updates the corresponding Showdown event in the database if necessary
 */
export async function handleGuildScheduledEventUpdated(
    oldGse: GuildScheduledEvent,
    newGse: GuildScheduledEvent,
    sendBroadcastMessage: boolean // whether to broadcast the message to discord admins (disabled for reconciliation on startup)
) {
    try {
        logInfo(
            `Handling guild scheduled event updated:\n - Old name '${oldGse?.name}'\n - New name '${newGse?.name}'`
        );

        if (!newGse || !oldGse) {
            return;
        }

        // check if we can find an existing record in the DB
        const existingStageDoc = await findOneDiscordEventByQuery({
            scheduledEventId: oldGse.id,
        });
        if (!existingStageDoc) {
            logInfo(
                `Did not find a registered discord event with name ${oldGse.name} (id: ${oldGse.id})`
            );
            return;
        }

        let iDiscordEvent = parseDiscordEvent(newGse);
        const adminChannelId = getPrivateAdminChannelId();
        // make sure the channelId was not removed
        if (!iDiscordEvent.channelId) {
            const errMsg = `Not updating registered event ***${iDiscordEvent.name}***, it must have a channel associated with it. It is still registered to take place in channel ${existingStageDoc.channelId}`;
            logError(errMsg);
            await sendMessageToChannel(adminChannelId, errMsg);
            return;
        }

        // update the existing discord event with the new scheduled event metadata (only the fields that were parsed)
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
            },
        };

        // add the sessionCode to the the updated event if updated to playtest event and none already exists
        const isSessionCodeIsEmpty = !existingStageDoc.sessionCode;

        if (
            isPlaytestEvent(iDiscordEvent.discordEventType) &&
            isSessionCodeIsEmpty
        ) {
            await handleDiscordEventWithSessionCodeUpdate(
                newGse,
                iDiscordEvent
            );
        } else {
            const query = { scheduledEventId: newGse.id };
            iDiscordEvent = await updateOneDiscordEventDB(query, update);
        }

        logInfo(
            `Successfully updated existing Discord event:
- Name: ${iDiscordEvent.name}
- Description: ${iDiscordEvent.description}
- Event type: ${iDiscordEvent.discordEventType}
- Scheduled start time: ${iDiscordEvent.scheduledStartTime}
- Status: ${iDiscordEvent.status}
- Channel id: ${iDiscordEvent.channelId}`
        );

        // handle the event starting or concluding
        const isDiscordEventStarting =
            oldGse.isScheduled() && newGse.isActive();
        const isDiscordEventConcluding =
            oldGse.isActive() && newGse.isCompleted();
        if (isDiscordEventStarting) {
            await handleDiscordEventStarting(iDiscordEvent);
        } else if (isDiscordEventConcluding) {
            await handleDiscordEventConcluding(iDiscordEvent);
        } else {
            // send a message to the admins saying the event metadata was successfully updated
            if (sendBroadcastMessage) {
                await sendMessageToChannel(
                    adminChannelId,
                    `Successfully updated Discord event ***${iDiscordEvent.name}*** with event type ***${iDiscordEvent.discordEventType}***. Attendance in channel ${newGse.channel} will be written onchain. You can make changes to the event type, name, description, time, etc. until the event ends`
                );
            }
        }
    } catch (e) {
        logError(
            "handleGuildScheduledEventUpdated: Failed to handle Guild Scheduled Event Update",
            e
        );
    }
}

/**
 * Handles a GuildScheduledEvent being deleted. Deletes the corresponding Discord event from the database if necessary
 */
export async function handleGuildScheduledEventDeleted(
    gse: GuildScheduledEvent
) {
    logInfo(`Handling guild scheduled event deleted: '${gse.name}'`);
    const query = {
        scheduledEventId: gse.id,
    };

    const iDiscordEvent = await findOneDiscordEventByQuery(query);
    if (!iDiscordEvent) {
        logInfo("Guild scheduled event is not associated with a discord event");
        return;
    }

    // delete the event
    await deleteOneDiscordEventDB(query);
    logInfo(`Successfully deleted Discord event: ${gse.name}`);

    // send a message to the admins saying the event was successfully deleted
    await sendMessageToChannel(
        getPrivateAdminChannelId(),
        `Successfully deleted Discord event ***${iDiscordEvent.name}*** with event type ***${iDiscordEvent.discordEventType}***. Attendance will ***NOT*** be written onchain`
    );
}

/**
 * Parses a Discord event out of a discord GuildScheduledEvent object
 * @param gse - discordjs GuildScheduledEvent object
 * @returns - corresponding IDiscordEvent
 */
export function parseDiscordEvent(gse: GuildScheduledEvent): IDiscordEvent {
    // parse the event status
    let status: DiscordEventStatus;
    switch (gse.status) {
        case GuildScheduledEventStatus.Scheduled:
            status = "scheduled";
            break;
        case GuildScheduledEventStatus.Active:
            status = "active";
            break;
        case GuildScheduledEventStatus.Completed:
            status = "completed";
            break;
    }

    const discordEventType = gse.name.split(":")[0];

    const image = gse.coverImageURL({
        size: 1024,
        extension: "png",
    });
    const iDiscordEvent: IDiscordEvent = {
        scheduledEventId: gse.id,
        channelId: gse.channelId,
        name: gse.name,
        description: gse.description,
        discordEventType,
        image: image || "",
        url: gse.url,
        status,
        scheduledStartTime: new Date(gse.scheduledStartTimestamp),
    };

    return iDiscordEvent;
}
