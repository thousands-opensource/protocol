import {
    ILeaderboard,
    LeaderboardPointCategories,
    LeaderboardPointsAndStats,
    LeaderboardStats,
} from "@repo/interfaces";

/**
 * Get total points for nft
 * @param userStats - LeaderboardStats for current user
 * @param leaderboard - leaderboard we are calculating points for
 * @returns total points and updated stats for Leaderboard
 */
export function getPointsAndStatsForNftLeaderboard(
    userStats: LeaderboardStats,
    leaderboard: ILeaderboard
): LeaderboardPointsAndStats {
    let points = 0;
    const stats: LeaderboardPointCategories[] = Object.keys(
        userStats
    ) as LeaderboardPointCategories[];
    const nftScoringDetails = leaderboard.leaderboardScoringDetails;
    // @todo calculate appropriate stats and add them all
    for (const stat of stats) {
        const nftScoringDetail = nftScoringDetails.find(
            (scoringDetail) =>
                scoringDetail.scoringType?.toLowerCase() === stat.toLowerCase()
        );
        if (!nftScoringDetail) {
            delete userStats[stat];
            continue;
        }
        //If the stat is relevant then add to total score and do not remove
        const statMultiplier = nftScoringDetail.points;
        points += (userStats[stat] || 0) * statMultiplier;
    }

    return { points, updatedStats: userStats };
}
