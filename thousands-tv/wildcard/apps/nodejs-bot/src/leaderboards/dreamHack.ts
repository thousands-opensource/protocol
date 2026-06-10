import {
    ILeaderboard,
    LeaderboardPointCategories,
    LeaderboardPointsAndStats,
    LeaderboardStats,
} from "@repo/interfaces";

/**
 * Get total points for dream hack
 * @param userStats - LeaderboardStats for current user
 * @param leaderboard - leaderboard we are calculating points for
 * @returns total points and updated stats for Leaderboard
 */
export function getPointsAndStatsForDreamHackLeaderboard(
    userStats: LeaderboardStats,
    leaderboard: ILeaderboard
): LeaderboardPointsAndStats {
    let points = 0;
    const stats: LeaderboardPointCategories[] = Object.keys(
        userStats
    ) as LeaderboardPointCategories[];
    const dreamHackScoringDetails = leaderboard.leaderboardScoringDetails;
    for (const stat of stats) {
        //filter non-dream hack stats out
        const dreamHackScoringDetail = dreamHackScoringDetails.find(
            (scoringDetail) =>
                scoringDetail.scoringType?.toLowerCase() === stat.toLowerCase()
        );
        if (!dreamHackScoringDetail) {
            delete userStats[stat];
            continue;
        }
        //If the stat is relevant then add to total score and do not remove
        const statMultiplier = dreamHackScoringDetail.points;
        points += (userStats[stat] || 0) * statMultiplier;
    }

    return { points, updatedStats: userStats };
}
