import { CommunityBadgeId } from "../interface";
import { logError } from "@src/logger";
import { processDiscordEventsForLeaderboards } from "@src/leaderboards/processDiscordEvents";
import { processKudosEventsForLeaderboards } from "@src/leaderboards/processKudosEvents";
import { IBadge, LeaderboardStats, UserIdToStats } from "@repo/interfaces";

/**
 * Process community badges requirements/conditions and give them a badge
 * @param badges - a list of badges Badge object
 */
export default async function processCommunityBadgeType(badges: IBadge[]) {
    //Map of wildfiles to their respective stats
    const userIdToStats: UserIdToStats = {};
    //get discordevent attendance and update userIdToStats
    await processDiscordEventsForLeaderboards(userIdToStats);
    //get kudos and update userIdToStats
    await processKudosEventsForLeaderboards(userIdToStats);

    const userIdsInMap = Object.keys(userIdToStats);
    for (const badge of badges) {
        for (const userIdStr of userIdsInMap) {
            const addToBadge: boolean = hasCommunityBadge(
                badge.id,
                userIdToStats,
                userIdStr
            );
            if (addToBadge) {
                badge.userIds.push(userIdStr);
            }
        }
    }
}

/**
 * Checks if wildfile satisfies community badge requirements
 * @param communityBadgeId - id of this community badge
 * @param userIdToStats - stats map of all users
 * @param userId - user's id
 * @returns true if wildfile satisfies community badge requirements
 */
function hasCommunityBadge(
    communityBadgeId: string,
    userIdToStats: UserIdToStats,
    userId: string
): boolean {
    const stats: LeaderboardStats = userIdToStats[userId];
    if (!stats) {
        return false;
    }
    const statsKeys = Object.keys(stats);
    switch (communityBadgeId) {
        case CommunityBadgeId.ATTENDEE:
            return statsKeys.some(
                (stat) =>
                    stat === "playtestAttendance" ||
                    stat === "signatureEventAttendance" ||
                    stat === "communityGatheringAttendance"
            );
        case CommunityBadgeId.PLAYTESTER:
            return !!stats["playtestAttendance"];
        case CommunityBadgeId.KUDO_RECEIVER:
            return statsKeys.some(
                (stat) => stat.toLowerCase().indexOf("kudos") >= 0
            );
        default:
            logError(`Not processing the correct community badge type`);
            return false;
    }
}
