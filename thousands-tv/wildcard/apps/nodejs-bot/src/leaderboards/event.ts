import {
    ILeaderboard,
    LeaderboardPointCategories,
    LeaderboardPointsAndStats,
    LeaderboardStats,
} from "@repo/interfaces";

/**
 * Get total points for event
 * @param userStats - LeaderboardStats for current user
 * @param leaderboard - leaderboard we are calculating points for
 * @returns total points and updated stats for Leaderboard
 */
export function getPointsAndStatsForEventLeaderboard(
    userStats: LeaderboardStats,
    leaderboard: ILeaderboard
): LeaderboardPointsAndStats {
    let points = 0;
    const stats: LeaderboardPointCategories[] = Object.keys(
        userStats
    ) as LeaderboardPointCategories[];
    const eventScoringDetails = leaderboard.leaderboardScoringDetails;
    // @todo calculate appropriate stats and add them all
    for (const stat of stats) {
        const eventScoringDetail = eventScoringDetails.find(
            (eventScoringDetails) =>
                eventScoringDetails.scoringType?.toLowerCase() ===
                stat.toLowerCase()
        );
        if (!eventScoringDetail) {
            delete userStats[stat];
            continue;
        }
        //If the stat is relevant then add to total score and do not remove
        const statMultiplier = eventScoringDetail.points;
        points += (userStats[stat] || 0) * statMultiplier;
    }

    return { points, updatedStats: userStats };
}
