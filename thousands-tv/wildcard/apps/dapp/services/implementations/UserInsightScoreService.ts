import { injectable, inject } from "inversify";
import type IUserInsightScoreRepository from "@/repositories/interfaces/IUserInsightScoreRepository";
import type ILeaderboardCacheService from "@/services/interfaces/ILeaderboardCacheService";
import type IUserRepository from "@/repositories/interfaces/iUserRepository";
import { DAILY_INSIGHT_DECAY_RATE, FREE_POINT_EQUIVALENT } from "@/constants";
import { LeaderboardEntry } from "@/pages/api/userInsightScores/getInsightScoreLeaderboard";
import { UserInsightScoreDoc, userInsightScoreSummariesModel } from "@repo/schemas";

export interface IUserInsightScoreService {
    getLeaderboardWithDecay(topCount: number, currentUserId?: string): Promise<{
        leaderboardEntries: LeaderboardEntry[];
        currentUserEntry?: LeaderboardEntry;
        totalUsersProcessed: number;
    }>;
    refreshAllUserScoresWithDecay(): Promise<{
        totalUsers: number;
        updatedUsers: number;
        ranksUpdated: boolean;
        leaderboardEntries: LeaderboardEntry[];
    }>;
    getUserLeaderboardEntry(userId: string): Promise<LeaderboardEntry | null>;
    reRankLeaderboard(topCount: number): Promise<{
        leaderboardEntries: LeaderboardEntry[];
        ranksUpdated: boolean;
    }>;
    applyDecayToAllSummaries(): Promise<{
        totalUsers: number;
        updatedUsers: number;
    }>;
}

@injectable()
export class UserInsightScoreService implements IUserInsightScoreService {
    constructor(
        @inject("IUserInsightScoreRepository")
        private userInsightScoreRepository: IUserInsightScoreRepository,
        @inject("ILeaderboardCacheService")
        private leaderboardCacheService: ILeaderboardCacheService,
        @inject("IUserRepository")
        private userRepository: IUserRepository
    ) { }

    private calculateDecayedScore(originalScore: number, calculatedAt: Date): number {
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - calculatedAt.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff <= 0) return originalScore;

        // This ensures scores never reach zero and decay compounds
        // Example with 1% daily decay: Day 1: score * 0.99, Day 2: score * 0.99^2, etc.
        const retentionRate = 1 - (DAILY_INSIGHT_DECAY_RATE / 100);
        const decayFactor = Math.pow(retentionRate, daysDiff);

        return originalScore * decayFactor;
    }

    async getUserLeaderboardEntry(userId: string): Promise<LeaderboardEntry | null> {
        const cachedEntry = await this.leaderboardCacheService.getCachedCurrentUserEntry(userId);
        if (cachedEntry) {
            return cachedEntry;
        }

        const userSummary = await this.userInsightScoreRepository.getUserInsightScoreSummaryByUserId(userId);

        if (!userSummary) {
            return null;
        }

        const user = await this.userRepository.findUserById(userId);
        const displayName = user?.preferences?.displayName || `User ${userId.slice(-6)}`;

        const leaderboardEntry: LeaderboardEntry = {
            userId,
            displayName,
            totalInsightScore: Math.round(userSummary.totalInsightScore * 100) / 100,
            totalPredictions: userSummary.totalPredictions,
            correctPredictions: userSummary.correctPredictions,
            accuracyPercentage: userSummary.accuracyPercentage,
            bestStreak: userSummary.bestStreak,
            currentStreak: userSummary.currentStreak,
            rank: userSummary.rank || 0
        };

        await this.leaderboardCacheService.cacheCurrentUserEntry(userId, leaderboardEntry);

        return leaderboardEntry;
    }

    async getLeaderboardWithDecay(topCount: number, currentUserId?: string): Promise<{
        leaderboardEntries: LeaderboardEntry[];
        currentUserEntry?: LeaderboardEntry;
        totalUsersProcessed: number;
    }> {
        let leaderboardEntries = await this.leaderboardCacheService.getCachedLeaderboard(topCount);
        let currentUserEntry: LeaderboardEntry | undefined;

        if (!leaderboardEntries) {
            console.info('Cache miss - recalculating leaderboard with daily decay applied to raw insight scores');

            const calculated = await this.refreshAllUserScoresWithDecay();
            leaderboardEntries = calculated.leaderboardEntries;
        }

        if (currentUserId) {
            const currentUserInTop = leaderboardEntries.some(entry => entry.userId === currentUserId);

            if (!currentUserInTop) {
                const userEntry = await this.getUserLeaderboardEntry(currentUserId);
                currentUserEntry = userEntry || undefined;
            } else {
                currentUserEntry = leaderboardEntries.find(entry => entry.userId === currentUserId);
            }
        }

        return {
            leaderboardEntries: leaderboardEntries || [],
            currentUserEntry,
            totalUsersProcessed: leaderboardEntries?.length || 0
        };
    }

    async refreshAllUserScoresWithDecay(): Promise<{
        totalUsers: number;
        updatedUsers: number;
        ranksUpdated: boolean;
        leaderboardEntries: LeaderboardEntry[];
    }> {
        const cutoffDate = new Date(0);

        const allUserInsightScores = await this.userInsightScoreRepository.getAllUserInsightScores(cutoffDate, false);

        const userScoreMap = new Map<string, {
            userId: any;
            totalInsightScore: number;
            totalPredictions: number;
            correctPredictions: number;
            lastUpdated: Date;
            scores: UserInsightScoreDoc[];
            bestStreak?: number;
            currentStreak?: number;
            accuracyPercentage?: number;
        }>();

        allUserInsightScores.forEach(score => {
            const userId = score.userId.toString();
            if (!userScoreMap.has(userId)) {
                userScoreMap.set(userId, {
                    userId: score.userId,
                    totalInsightScore: 0,
                    totalPredictions: 0,
                    correctPredictions: 0,
                    lastUpdated: score.calculatedAt || new Date(),
                    scores: []
                });
            }

            const userSummary = userScoreMap.get(userId)!;
            userSummary.scores.push(score);

            userSummary.totalPredictions += 1;
            if (score.wasCorrect) {
                let pointsToAward = score.pointsEarned;
                if (score.pointsEarned === 0 && score.predictionAmount === 0) {
                    pointsToAward = FREE_POINT_EQUIVALENT;
                }

                const decayedScore = this.calculateDecayedScore(
                    pointsToAward,
                    score.calculatedAt || new Date()
                );
                userSummary.totalInsightScore += decayedScore;
                userSummary.correctPredictions += 1;
            }

            if (score.calculatedAt && score.calculatedAt > userSummary.lastUpdated) {
                userSummary.lastUpdated = score.calculatedAt;
            }
        });

        const userSummaries = Array.from(userScoreMap.values());
        let updatedUsers = 0;

        const batchSize = 50;
        for (let i = 0; i < userSummaries.length; i += batchSize) {
            const batch = userSummaries.slice(i, i + batchSize);

            const batchPromises = batch.map(async (userSummary) => {
                try {
                    const userId = userSummary.userId.toString();

                    const accuracyPercentage = userSummary.totalPredictions > 0
                        ? (userSummary.correctPredictions / userSummary.totalPredictions) * 100
                        : 0;

                    const userScores = userSummary.scores;
                    userScores.sort((a: UserInsightScoreDoc, b: UserInsightScoreDoc) => (a.calculatedAt?.getTime() || 0) - (b.calculatedAt?.getTime() || 0));

                    let currentStreak = 0;
                    let bestStreak = 0;
                    let currentStreakType: 'correct' | 'incorrect' | null = null;

                    for (const score of userScores) {
                        if (score.wasCorrect) {
                            if (currentStreakType === 'correct') {
                                currentStreak++;
                            } else {
                                currentStreak = 1;
                                currentStreakType = 'correct';
                            }
                            bestStreak = Math.max(bestStreak, currentStreak);
                        } else {
                            if (currentStreakType === 'incorrect') {
                                currentStreak++;
                            } else {
                                currentStreak = 1;
                                currentStreakType = 'incorrect';
                            }
                        }
                    }

                    userSummary.bestStreak = bestStreak;
                    userSummary.currentStreak = currentStreakType === 'correct' ? currentStreak : 0;
                    userSummary.accuracyPercentage = Math.round(accuracyPercentage * 100) / 100;

                    const summaryData = {
                        totalPredictions: userSummary.totalPredictions,
                        correctPredictions: userSummary.correctPredictions,
                        totalInsightScore: userSummary.totalInsightScore,
                        accuracyPercentage: userSummary.accuracyPercentage,
                        currentStreak: userSummary.currentStreak,
                        bestStreak: userSummary.bestStreak
                    };

                    const updatedSummary = await this.userInsightScoreRepository.createOrUpdateUserInsightScoreSummary(
                        userId,
                        summaryData
                    );

                    if (updatedSummary) {
                        updatedUsers++;
                    }
                } catch (error) {
                    console.error(`Failed to update summary for user ${userSummary.userId.toString()}:`, error);
                }
            });

            await Promise.all(batchPromises);

            if (i + batchSize < userSummaries.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        console.info('Updating ranks based on fresh decayed scores...');
        let ranksUpdated = false;

        try {
            const sortedUserSummaries = userSummaries
                .sort((a, b) => b.totalInsightScore - a.totalInsightScore);

            const rankUpdateOps = sortedUserSummaries.map((summary, index) => ({
                updateOne: {
                    filter: { userId: summary.userId },
                    update: { rank: index + 1 }
                }
            }));

            if (rankUpdateOps.length > 0) {
                await userInsightScoreSummariesModel.bulkWrite(rankUpdateOps);
                ranksUpdated = true;
                console.info(`Updated ranks for ${rankUpdateOps.length} users based on decayed scores`);
            }
        } catch (error) {
            console.error('Failed to update ranks:', error);
        }

        try {
            const activeUserIds = new Set(userSummaries.map(summary => summary.userId.toString()));
            const allExistingSummaries = await this.userInsightScoreRepository.getAllUserInsightScoreSummaries();
            const staleSummaries = allExistingSummaries
                .filter(summary => !activeUserIds.has(summary.userId.toString()));

            if (staleSummaries.length > 0) {
                console.info(`Found ${staleSummaries.length} stale user summaries to delete`);

                const deleteOps = staleSummaries.map(summary => ({
                    deleteOne: {
                        filter: { userId: summary.userId }
                    }
                }));

                await userInsightScoreSummariesModel.bulkWrite(deleteOps);
                console.info(`Deleted ${staleSummaries.length} stale user summaries`);
            } else {
                console.info('No stale user summaries found to delete');
            }
        } catch (error) {
            console.error('Failed to clean up stale summaries:', error);
        }

        const sortedUserSummaries = userSummaries
            .sort((a, b) => b.totalInsightScore - a.totalInsightScore)
            .slice(0, 10);

        const leaderboardEntries: LeaderboardEntry[] = [];

        for (let i = 0; i < sortedUserSummaries.length; i++) {
            const summary = sortedUserSummaries[i];
            try {
                const user = await this.userRepository.findUserById(summary.userId.toString());
                const displayName = user?.preferences?.displayName ||
                    `User ${summary.userId.toString().slice(-6)}`;

                leaderboardEntries.push({
                    userId: summary.userId.toString(),
                    displayName,
                    totalInsightScore: Math.round(summary.totalInsightScore * 100) / 100,
                    totalPredictions: summary.totalPredictions,
                    correctPredictions: summary.correctPredictions,
                    accuracyPercentage: summary.accuracyPercentage!,
                    bestStreak: summary.bestStreak!,
                    currentStreak: summary.currentStreak!,
                    rank: i + 1
                });
            } catch (error) {
                console.error(`Failed to build leaderboard entry for user ${summary.userId.toString()}:`, error);
            }
        }

        if (leaderboardEntries.length > 0) {
            try {
                await this.leaderboardCacheService.clearLeaderboardCache();
                console.info('Cleared old leaderboard cache before caching fresh data');

                await this.leaderboardCacheService.cacheLeaderboard(10, leaderboardEntries);
                console.info(`Cached top ${leaderboardEntries.length} leaderboard entries`);
            } catch (error) {
                console.error('Failed to cache leaderboard:', error);
            }
        }

        return {
            totalUsers: userSummaries.length,
            updatedUsers,
            ranksUpdated,
            leaderboardEntries
        };
    }

    async reRankLeaderboard(topCount: number = 10): Promise<{
        leaderboardEntries: LeaderboardEntry[];
        ranksUpdated: boolean;
    }> {
        console.info('Re-ranking leaderboard from existing user summaries...');

        const allUserSummaries = await this.userInsightScoreRepository.getAllUserInsightScoreSummaries();

        if (allUserSummaries.length === 0) {
            console.info('No user summaries found for re-ranking');
            return {
                leaderboardEntries: [],
                ranksUpdated: false
            };
        }

        const sortedUserSummaries = allUserSummaries
            .sort((a, b) => b.totalInsightScore - a.totalInsightScore);

        let ranksUpdated = false;

        try {
            const rankUpdateOps = sortedUserSummaries.map((summary, index) => ({
                updateOne: {
                    filter: { userId: summary.userId },
                    update: { rank: index + 1 }
                }
            }));

            if (rankUpdateOps.length > 0) {
                await userInsightScoreSummariesModel.bulkWrite(rankUpdateOps);
                ranksUpdated = true;
                console.info(`Updated ranks for ${rankUpdateOps.length} users`);
            }
        } catch (error) {
            console.error('Failed to update ranks:', error);
        }

        const topUserSummaries = sortedUserSummaries.slice(0, topCount);
        const leaderboardEntries: LeaderboardEntry[] = [];

        for (let i = 0; i < topUserSummaries.length; i++) {
            const summary = topUserSummaries[i];
            try {
                const user = await this.userRepository.findUserById(summary.userId.toString());
                const displayName = user?.preferences?.displayName ||
                    `User ${summary.userId.toString().slice(-6)}`;

                leaderboardEntries.push({
                    userId: summary.userId.toString(),
                    displayName,
                    totalInsightScore: Math.round(summary.totalInsightScore * 100) / 100,
                    totalPredictions: summary.totalPredictions,
                    correctPredictions: summary.correctPredictions,
                    accuracyPercentage: summary.accuracyPercentage,
                    bestStreak: summary.bestStreak,
                    currentStreak: summary.currentStreak,
                    rank: i + 1
                });
            } catch (error) {
                console.error(`Failed to build leaderboard entry for user ${summary.userId.toString()}:`, error);
            }
        }

        if (leaderboardEntries.length > 0) {
            try {
                await this.leaderboardCacheService.clearLeaderboardCache();
                console.info('Cleared old leaderboard cache');

                await this.leaderboardCacheService.cacheLeaderboard(topCount, leaderboardEntries);
                console.info(`Cached top ${leaderboardEntries.length} leaderboard entries`);
            } catch (error) {
                console.error('Failed to update leaderboard cache:', error);
            }
        }

        return {
            leaderboardEntries,
            ranksUpdated
        };
    }

    async applyDecayToAllSummaries(): Promise<{
        totalUsers: number;
        updatedUsers: number;
    }> {
        console.info('Applying daily decay to all user summary scores...');

        const allUserSummaries = await this.userInsightScoreRepository.getAllUserInsightScoreSummaries();

        if (allUserSummaries.length === 0) {
            console.info('No user summaries found to apply decay to');
            return {
                totalUsers: 0,
                updatedUsers: 0
            };
        }

        const retentionRate = 1 - (DAILY_INSIGHT_DECAY_RATE / 100);
        let updatedUsers = 0;

        const decayUpdateOps = allUserSummaries.map(summary => {
            const decayedScore = summary.totalInsightScore * retentionRate;
            return {
                updateOne: {
                    filter: { userId: summary.userId },
                    update: {
                        totalInsightScore: decayedScore
                    }
                }
            };
        });

        console.log(`Prepared decay updates for ${decayUpdateOps.length} user summaries with retention rate: ${retentionRate}`);

        try {
            if (decayUpdateOps.length > 0) {
                const result = await userInsightScoreSummariesModel.bulkWrite(decayUpdateOps);
                updatedUsers = result.modifiedCount;
                console.info(`Applied daily decay to ${updatedUsers} user summaries (retention rate: ${retentionRate})`);
            }
        } catch (error) {
            console.error('Failed to apply decay to user summaries:', error);
            throw error;
        }

        try {
            const sortedUserSummaries = allUserSummaries
                .sort((a, b) => b.totalInsightScore - a.totalInsightScore)
                .slice(0, 10);

            const leaderboardEntries: LeaderboardEntry[] = [];

            for (let i = 0; i < sortedUserSummaries.length; i++) {
                const summary = sortedUserSummaries[i];
                try {
                    const user = await this.userRepository.findUserById(summary.userId.toString());
                    const displayName = user?.preferences?.displayName ||
                        `User ${summary.userId.toString().slice(-6)}`;

                    leaderboardEntries.push({
                        userId: summary.userId.toString(),
                        displayName,
                        totalInsightScore: Math.round((summary.totalInsightScore * retentionRate) * 100) / 100,
                        totalPredictions: summary.totalPredictions,
                        correctPredictions: summary.correctPredictions,
                        accuracyPercentage: summary.accuracyPercentage,
                        bestStreak: summary.bestStreak,
                        currentStreak: summary.currentStreak,
                        rank: i + 1
                    });
                } catch (error) {
                    console.error(`Failed to build leaderboard entry for user ${summary.userId.toString()}:`, error);
                }
            }

            await this.leaderboardCacheService.clearLeaderboardCache();
            console.info('Cleared leaderboard cache after applying decay');


            if (leaderboardEntries.length > 0) {
                await this.leaderboardCacheService.cacheLeaderboard(10, leaderboardEntries);
                console.info(`Cached fresh leaderboard with ${leaderboardEntries.length} entries after decay`);
            }

        } catch (error) {
            console.error('Failed to rebuild leaderboard cache after decay:', error);
        }

        return {
            totalUsers: allUserSummaries.length,
            updatedUsers
        };
    }
}
