import {
    ILeaderboard,
    LeaderboardPointCategories,
    LeaderboardPointsAndStats,
    LeaderboardStats,
} from "@repo/interfaces";

/**
 * Get total points for AlphaZeroLeaderboard
 * @param userStats - LeaderboardStats for current user
 * @param leaderboard - leaderboard we are calculating points for
 * @returns total points and updated stats for Leaderboard
 */
export function getPointsAndStatsForAlphaZeroLeaderboard(
    userStats: LeaderboardStats,
    leaderboard: ILeaderboard
): LeaderboardPointsAndStats {
    let points = 0;
    const stats: LeaderboardPointCategories[] = Object.keys(
        userStats
    ) as LeaderboardPointCategories[];
    const alphaseries0ScoringDetails = leaderboard.leaderboardScoringDetails;
    for (const stat of stats) {
        //filter non alpha-series-0 hack stats out
        const alphaseries0ScoringDetail = alphaseries0ScoringDetails.find(
            (scoringDetail) =>
                scoringDetail.scoringType?.toLowerCase() === stat.toLowerCase()
        );
        if (!alphaseries0ScoringDetail) {
            delete userStats[stat];
            continue;
        }
        //If the stat is relevant then add to total score and do not remove
        const statMultiplier = alphaseries0ScoringDetail.points;
        points += (userStats[stat] || 0) * statMultiplier;
    }

    return { points, updatedStats: userStats };
}
