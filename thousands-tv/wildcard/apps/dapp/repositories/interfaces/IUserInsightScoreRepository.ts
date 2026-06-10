import { UserInsightScoreDoc, UserInsightScoreSummaryDoc } from "@repo/schemas";
import { IUserInsightScore, IUserInsightScoreSummary } from "@repo/interfaces";

export default interface IUserInsightScoreRepository {
    addUserInsightScore(
        userId: string,
        rallyPredictionId: string,
        userRallyPredictionId: string,
        pointsEarned: number,
        wasCorrect: boolean,
        predictionAmount: number,
        predictionPrice: number,
        userPrediction: boolean,
        actualOutcome: boolean,
        timingBonus?: number,
        confidenceBonus?: number
    ): Promise<UserInsightScoreDoc | null>;

    getUserInsightScoresByUserId(
        userId: string
    ): Promise<UserInsightScoreDoc[]>;

    getAllUserInsightScores(
        fromDate?: Date,
        correctOnly?: boolean
    ): Promise<UserInsightScoreDoc[]>;

    getUserInsightScoresByRallyPredictionId(
        rallyPredictionId: string
    ): Promise<UserInsightScoreDoc[]>;

    getUserInsightScoreByUserRallyPredictionId(
        userRallyPredictionId: string
    ): Promise<UserInsightScoreDoc | null>;

    deleteUserInsightScoresByRallyPredictionId(
        rallyPredictionId: string
    ): Promise<number>;

    createOrUpdateUserInsightScoreSummary(
        userId: string,
        insightScoreData: Partial<IUserInsightScoreSummary>
    ): Promise<UserInsightScoreSummaryDoc | null>;

    getUserInsightScoreSummaryByUserId(
        userId: string
    ): Promise<UserInsightScoreSummaryDoc | null>;

    getInsightScoreLeaderboard(
        limit?: number,
        offset?: number
    ): Promise<UserInsightScoreSummaryDoc[]>;

    getAccuracyLeaderboard(
        limit?: number,
        offset?: number,
        minPredictions?: number
    ): Promise<UserInsightScoreSummaryDoc[]>;

    getStreakLeaderboard(
        limit?: number,
        offset?: number
    ): Promise<UserInsightScoreSummaryDoc[]>;

    recalculateUserInsightScoreSummary(
        userId: string
    ): Promise<UserInsightScoreSummaryDoc | null>;

    getAllUserInsightScoreSummaries(): Promise<UserInsightScoreSummaryDoc[]>;

    getLeaderboardByRank(
        limit?: number
    ): Promise<UserInsightScoreSummaryDoc[]>;
}
