import { VoiceState } from "discord.js";
import { updateOneDiscordEventDB } from "@repo/schemas";
import { logInfo } from "@src/logger";
import { notifyGameServerOfChannelEntranceExitEvent } from "@src/redis/utils";
import { QueueMessageJoinType } from "@src/fanAttendance/types";
import { DiscordUserActivity, IDiscordEvent } from "@repo/interfaces";

// Use a Map to store listeners for each channel
const channelListeners: Map<
    string,
    (oldState: VoiceState, newState: VoiceState) => void
> = new Map();

export function addDiscordEventChannelListener(
    id: string,
    listener: (oldState: VoiceState, newState: VoiceState) => void
) {
    channelListeners.set(id, listener);
}

export function getDiscordEventChannelListener(id: string) {
    return channelListeners.get(id);
}

export function removeDiscordEventChannelListener(id: string) {
    const listener = channelListeners.get(id);
    channelListeners.delete(id);
    return listener;
}

export function createDiscordIdMinutesWatchedMap(
    iDiscordEvent: IDiscordEvent,
    ended: number
): { [discordId: string]: number } {
    const channelEntrances: DiscordUserActivity[] =
        iDiscordEvent.channelEntrances;
    const channelExits: DiscordUserActivity[] = iDiscordEvent.channelExits;

    channelEntrances.sort((a, b) => a.timestamp - b.timestamp);
    channelExits.sort((a, b) => a.timestamp - b.timestamp);

    const entranceMap = createEntranceMap(channelEntrances);
    const minutesWatchedMap: { [discordId: string]: number } = {};
    for (const exit of channelExits) {
        if (
            entranceMap[exit.discordId] &&
            entranceMap[exit.discordId].length > 0
        ) {
            const entrance = entranceMap[exit.discordId].shift();
            if (exit.timestamp > entrance.timestamp) {
                const timeSpent = exit.timestamp - entrance.timestamp;
                if (minutesWatchedMap[exit.discordId]) {
                    minutesWatchedMap[exit.discordId] += timeSpent;
                } else {
                    minutesWatchedMap[exit.discordId] = timeSpent;
                }
            }
        }
    }

    // If user is still in channel, calculate remaining duration against the playtest's ending time
    for (const discordId in entranceMap) {
        if (entranceMap[discordId] && entranceMap[discordId].length > 0) {
            const lastEntrance = entranceMap[discordId][0];
            const timeSpent = ended - lastEntrance.timestamp;
            if (minutesWatchedMap[discordId]) {
                minutesWatchedMap[discordId] += timeSpent;
            } else {
                minutesWatchedMap[discordId] = timeSpent;
            }
        }
    }

    // convert ms to minutes
    const discordIds = Object.keys(minutesWatchedMap);
    for (const discordId of discordIds) {
        const minutesWatched = Math.floor(
            minutesWatchedMap[discordId] / 1000 / 60
        );
        minutesWatchedMap[discordId] = Math.max(minutesWatched, 1); // round up to 1 minute even if they were in for less
    }

    return minutesWatchedMap;
}

function createEntranceMap(channelEntrances: DiscordUserActivity[]): {
    [discordId: string]: DiscordUserActivity[];
} {
    return channelEntrances.reduce((acc, val) => {
        if (!acc[val.discordId]) {
            acc[val.discordId] = [];
        }
        acc[val.discordId].push(val);
        return acc;
    }, {} as { [discordId: string]: DiscordUserActivity[] });
}

export async function handleVoiceStateUpdate(
    oldState: VoiceState,
    newState: VoiceState,
    channelId: string,
    scheduledDiscordEventId: string
) {
    const oldChannel = oldState.channel;
    const newChannel = newState.channel;
    const now = Date.now();
    const userActivity: DiscordUserActivity = {
        discordId: newState.member.user.id,
        timestamp: now,
    };
    const name = newState.member.user.username;
    const query = { scheduledEventId: scheduledDiscordEventId };

    const isMemberLeavingChannel =
        oldChannel &&
        oldChannel.id == channelId &&
        (!newChannel || newChannel.id !== oldChannel.id);
    const isMemberJoiningChannel =
        newChannel &&
        newChannel.id == channelId &&
        (!oldChannel || newChannel.id !== oldChannel.id);

    const user = newState.member.user;

    if (isMemberLeavingChannel) {
        // Member left the channel
        const update = {
            $push: { channelExits: userActivity },
        };
        await updateOneDiscordEventDB(query, update);
        logInfo(
            `(-) Member: ${name} left channel ${oldChannel.name} at ${now}`
        );

        await notifyGameServerOfChannelEntranceExitEvent(
            scheduledDiscordEventId,
            user,
            QueueMessageJoinType.EXIT
        );
    } else if (isMemberJoiningChannel) {
        // Member joined a new channel
        const update = {
            $push: { channelEntrances: userActivity },
        };
        await updateOneDiscordEventDB(query, update);

        logInfo(
            `(+) Member: ${name} joined channel ${newChannel.name} at ${now}`
        );

        await notifyGameServerOfChannelEntranceExitEvent(
            scheduledDiscordEventId,
            user,
            QueueMessageJoinType.ENTRANCE
        );
    }
}
