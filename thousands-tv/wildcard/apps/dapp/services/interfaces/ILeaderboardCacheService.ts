import { LeaderboardEntry } from "@/pages/api/userInsightScores/getInsightScoreLeaderboard";

export default interface ILeaderboardCacheService {
    getCachedLeaderboard(topCount: number): Promise<LeaderboardEntry[] | null>;
    cacheLeaderboard(topCount: number, leaderboard: LeaderboardEntry[]): Promise<void>;
    getCachedCurrentUserEntry(userId: string): Promise<LeaderboardEntry | null>;
    cacheCurrentUserEntry(userId: string, userEntry: LeaderboardEntry): Promise<void>;
    clearLeaderboardCache(): Promise<void>;
}
