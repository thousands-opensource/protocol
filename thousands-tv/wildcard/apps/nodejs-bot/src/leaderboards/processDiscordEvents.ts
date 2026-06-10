import { findDiscordEventsByQuery } from "@repo/schemas";
import {
    IDiscordEvent,
    UserIdMinutesAttended,
    UserIdToStats,
} from "@repo/interfaces";
import {
    addToMapProperty,
    ensureMapsAreCreated,
} from "@src/leaderboards/leaderboardUtil";
import { DREAMHACK_DISCORD_EVENT_NAME } from "@src/constants";

const SIGNATURE_EVENT_TYPE = "signatureEvent";
const COMMUNITY_GATHERING_EVENT_TYPE = "communityGatheringEvent";
const PLAYTEST_EVENT_TYPE = "playtestEvent";
const signatureEventTypes = ["Fireside Chat", "Townhall", "AMA", "Launch"];
const playtestEventTypes = ["Playtest", "Focus Group"];
const communityGatheringTypes = ["Work 'n Chill", "Lore", "Games", "Replay"];

/**
 * Entry point to process all discord events for leaderboards
 * @param userIdToStatsMap - stats map for all users
 */
export async function processDiscordEventsForLeaderboards(
    userIdToStatsMap: UserIdToStats
) {
    //get discordevent attendance
    const query = { status: "completed" };
    const discordEventList: IDiscordEvent[] = await findDiscordEventsByQuery(
        query
    );

    //loop through all discord attendance events and populate the points for each table
    for (const discordEvent of discordEventList) {
        gatherDiscordEventStatInfo(discordEvent, userIdToStatsMap);
    }
}

/**
 * Add stats to the wildfile stats map for each user involved in the discordEvent
 * @param discordEvent - current discord event
 * @param userIdToStatsMap - stats map for all users
 */
function gatherDiscordEventStatInfo(
    discordEvent: IDiscordEvent,
    userIdToStatsMap: UserIdToStats
) {
    let discordEventTypeInternalCategory = "";
    const discordEventTypeLower = discordEvent.discordEventType.toLowerCase();
    if (
        signatureEventTypes.some((event) => {
            return event.toLowerCase() === discordEventTypeLower;
        })
    ) {
        discordEventTypeInternalCategory = SIGNATURE_EVENT_TYPE;
    } else if (
        playtestEventTypes.some((event) => {
            return event.toLowerCase() === discordEventTypeLower;
        })
    ) {
        discordEventTypeInternalCategory = PLAYTEST_EVENT_TYPE;
    } else if (
        communityGatheringTypes.some((event) => {
            return event.toLowerCase() === discordEventTypeLower;
        })
    ) {
        discordEventTypeInternalCategory = COMMUNITY_GATHERING_EVENT_TYPE;
    } else {
        //If it is of a different type, do not process
        return;
    }

    const userIdMinutesAttended: UserIdMinutesAttended[] =
        discordEvent.userIdMinutesAttended;

    //Loop through all minutes attended objects
    for (const minutesAttendedObj of userIdMinutesAttended) {
        const userId = minutesAttendedObj.userId.toString();

        const minutesAttended = minutesAttendedObj.minutesAttended;
        ensureMapsAreCreated(userId, userIdToStatsMap);
        const userStats = userIdToStatsMap[userId];
        if (discordEventTypeInternalCategory === SIGNATURE_EVENT_TYPE) {
            addToMapProperty(userStats, "signatureEventAttendance", 1);
            addToMapProperty(
                userStats,
                "signatureEventMinutesAttended",
                minutesAttended
            );
        } else if (discordEventTypeInternalCategory === PLAYTEST_EVENT_TYPE) {
            addToMapProperty(userStats, "playtestAttendance", 1);
            addToMapProperty(
                userStats,
                "playtestMinutesAttended",
                minutesAttended
            );
            if (discordEvent.name === DREAMHACK_DISCORD_EVENT_NAME) {
                addToMapProperty(userStats, "dreamHackPlaytestAttendance", 1);
                addToMapProperty(
                    userStats,
                    "dreamHackPlaytestMinutesAttended",
                    minutesAttended
                );
            }
        } else if (
            discordEventTypeInternalCategory === COMMUNITY_GATHERING_EVENT_TYPE
        ) {
            addToMapProperty(userStats, "communityGatheringAttendance", 1);
            addToMapProperty(
                userStats,
                "communityGatheringMinutesAttended",
                minutesAttended
            );
        }
    }
}
