import {
    LeaderboardPointCategories,
    UserIdToStats,
    LeaderboardStats,
    ILeaderboardScoringDetail,
} from "@repo/interfaces";

/**
 * Make sure users stats are initialized to avoid errors
 * @param userId - users id
 * @param userIdToStats - stats map of all users
 */
export function ensureMapsAreCreated(
    userId: string,
    userIdToStats: UserIdToStats
) {
    //If the map doesn't exist default it to zero
    if (!userIdToStats[userId]) {
        userIdToStats[userId] = {};
    }
}

/**
 * Increase the mapProperty by valueToAdd in the userStats object
 * @param userStats - the stats for the user for this collection of the leaderboard
 * @param mapProperty - the propery to update in the userStats
 * @param valueToAdd - value to add of the mapProperty
 */
export function addToMapProperty(
    userStats: LeaderboardStats,
    mapProperty: LeaderboardPointCategories,
    valueToAdd: number
) {
    if (!userStats[mapProperty]) {
        userStats[mapProperty] = 0;
    }
    userStats[mapProperty] += valueToAdd;
}

/**
 * Determine if the scoring detail being analyzed has a range that includes the current time
 * @param scoringDetail - the scoring detail object
 * @returns true if now is in the time range of the scoring detail
 */
export function isInTimeRange(
    scoringDetail: ILeaderboardScoringDetail
): boolean {
    //TODO: If needed this will need to calculate from time of stat, not from current time
    const currTime = new Date().getTime();
    if (currTime < scoringDetail.startDate) {
        return false;
    }
    if (!scoringDetail.endDate) {
        return true;
    }

    return currTime < scoringDetail.endDate;
}
