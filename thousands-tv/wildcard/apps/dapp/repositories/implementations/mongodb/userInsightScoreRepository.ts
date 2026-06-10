import { injectable } from "inversify";
import "reflect-metadata";
import connectToDb from "@/db/connectToDb";
import IUserInsightScoreRepository from "@/repositories/interfaces/IUserInsightScoreRepository";
import { IUserInsightScoreSummary } from "@repo/interfaces";
import {
    userInsightScoresModel,
    userInsightScoreSummariesModel,
    UserInsightScoreDoc,
    UserInsightScoreSummaryDoc
} from "@repo/schemas";
import { Types } from "mongoose";
import { DAILY_INSIGHT_DECAY_RATE } from "@/constants";

@injectable()
export default class UserInsightScoreRepository implements IUserInsightScoreRepository {

    async addUserInsightScore(
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
    ): Promise<UserInsightScoreDoc | null> {
        await connectToDb();

        try {
            const userInsightScore = new userInsightScoresModel({
                userId: new Types.ObjectId(userId),
                rallyPredictionId: new Types.ObjectId(rallyPredictionId),
                userRallyPredictionId: new Types.ObjectId(userRallyPredictionId),
                pointsEarned,
                wasCorrect,
                predictionAmount,
                predictionPrice,
                userPrediction,
                actualOutcome,
                timingBonus: timingBonus || 0,
                confidenceBonus: confidenceBonus || 0,
                calculatedAt: new Date()
            });

            return await userInsightScore.save();
        } catch (error) {
            console.error('Error adding user insight score:', error);
            return null;
        }
    }

    async getUserInsightScoresByUserId(userId: string): Promise<UserInsightScoreDoc[]> {
        await connectToDb();

        try {
            return await userInsightScoresModel
                .find({ userId: new Types.ObjectId(userId) })
                .sort({ calculatedAt: -1 })
                .exec();
        } catch (error) {
            console.error('Error getting user insight scores by user ID:', error);
            return [];
        }
    }

    async getAllUserInsightScores(fromDate?: Date, correctOnly?: boolean): Promise<UserInsightScoreDoc[]> {
        await connectToDb();

        try {
            const query: any = {};

            if (fromDate) {
                query.calculatedAt = { $gte: fromDate };
            }

            if (correctOnly) {
                query.wasCorrect = true;
            }

            return await userInsightScoresModel
                .find(query)
                .sort({ calculatedAt: -1 })
                .exec();
        } catch (error) {
            console.error('Error getting all user insight scores:', error);
            return [];
        }
    }

    async getUserInsightScoresByRallyPredictionId(rallyPredictionId: string): Promise<UserInsightScoreDoc[]> {
        await connectToDb();

        try {
            return await userInsightScoresModel
                .find({ rallyPredictionId: new Types.ObjectId(rallyPredictionId) })
                .sort({ pointsEarned: -1 })
                .exec();
        } catch (error) {
            console.error('Error getting user insight scores by rally prediction ID:', error);
            return [];
        }
    }

    async getUserInsightScoreByUserRallyPredictionId(userRallyPredictionId: string): Promise<UserInsightScoreDoc | null> {
        await connectToDb();

        try {
            return await userInsightScoresModel
                .findOne({ userRallyPredictionId: new Types.ObjectId(userRallyPredictionId) })
                .exec();
        } catch (error) {
            console.error('Error getting user insight score by user rally prediction ID:', error);
            return null;
        }
    }

    async deleteUserInsightScoresByRallyPredictionId(rallyPredictionId: string): Promise<number> {
        await connectToDb();

        try {
            const result = await userInsightScoresModel
                .deleteMany({ rallyPredictionId: new Types.ObjectId(rallyPredictionId) })
                .exec();
            return result.deletedCount || 0;
        } catch (error) {
            console.error('Error deleting user insight scores by rally prediction ID:', error);
            return 0;
        }
    }

    async createOrUpdateUserInsightScoreSummary(
        userId: string,
        insightScoreData: Partial<IUserInsightScoreSummary>
    ): Promise<UserInsightScoreSummaryDoc | null> {
        await connectToDb();

        try {
            const userIdObj = new Types.ObjectId(userId);

            const existingSummary = await userInsightScoreSummariesModel
                .findOne({ userId: userIdObj })
                .exec();

            if (existingSummary) {
                Object.assign(existingSummary, insightScoreData);
                existingSummary.lastUpdated = new Date();
                return await existingSummary.save();
            } else {
                const newSummary = new userInsightScoreSummariesModel({
                    userId: userIdObj,
                    ...insightScoreData,
                    lastUpdated: new Date()
                });
                return await newSummary.save();
            }
        } catch (error) {
            console.error('Error creating/updating user insight score summary:', error);
            return null;
        }
    }

    async getUserInsightScoreSummaryByUserId(userId: string): Promise<UserInsightScoreSummaryDoc | null> {
        await connectToDb();

        try {
            return await userInsightScoreSummariesModel
                .findOne({ userId: new Types.ObjectId(userId) })
                .exec();
        } catch (error) {
            console.error('Error getting user insight score summary by user ID:', error);
            return null;
        }
    }

    async getInsightScoreLeaderboard(limit: number = 100, offset: number = 0): Promise<UserInsightScoreSummaryDoc[]> {
        await connectToDb();

        try {
            const decayPeriodDays = Math.ceil(100 / DAILY_INSIGHT_DECAY_RATE);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - decayPeriodDays);

            return await userInsightScoreSummariesModel
                .find({
                    lastUpdated: { $gte: cutoffDate }
                })
                .sort({ totalInsightScore: -1 })
                .skip(offset)
                .limit(limit)
                .exec();
        } catch (error) {
            console.error('Error getting insight score leaderboard:', error);
            return [];
        }
    }

    async getAccuracyLeaderboard(
        limit: number = 100,
        offset: number = 0,
        minPredictions: number = 5
    ): Promise<UserInsightScoreSummaryDoc[]> {
        await connectToDb();

        try {
            return await userInsightScoreSummariesModel
                .find({ totalPredictions: { $gte: minPredictions } })
                .sort({ accuracyPercentage: -1 })
                .skip(offset)
                .limit(limit)
                .exec();
        } catch (error) {
            console.error('Error getting accuracy leaderboard:', error);
            return [];
        }
    }

    async getStreakLeaderboard(limit: number = 100, offset: number = 0): Promise<UserInsightScoreSummaryDoc[]> {
        await connectToDb();

        try {
            return await userInsightScoreSummariesModel
                .find({})
                .sort({ bestStreak: -1 })
                .skip(offset)
                .limit(limit)
                .exec();
        } catch (error) {
            console.error('Error getting streak leaderboard:', error);
            return [];
        }
    }

    async recalculateUserInsightScoreSummary(userId: string): Promise<UserInsightScoreSummaryDoc | null> {
        await connectToDb();

        try {
            const userIdObj = new Types.ObjectId(userId);

            const userScores = await userInsightScoresModel
                .find({ userId: userIdObj })
                .sort({ calculatedAt: 1 })
                .exec();

            if (userScores.length === 0) {
                return null;
            }

            const totalPredictions = userScores.length;
            const correctPredictions = userScores.filter(score => score.wasCorrect).length;
            const totalInsightScore = userScores.reduce((sum, score) => sum + score.pointsEarned, 0);
            const accuracyPercentage = (correctPredictions / totalPredictions) * 100;

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

            const summaryData: Partial<IUserInsightScoreSummary> = {
                totalPredictions,
                correctPredictions,
                totalInsightScore,
                accuracyPercentage: Math.round(accuracyPercentage * 100) / 100,
                currentStreak: currentStreakType === 'correct' ? currentStreak : 0,
                bestStreak
            };

            return await this.createOrUpdateUserInsightScoreSummary(userId, summaryData);
        } catch (error) {
            console.error('Error recalculating user insight score summary:', error);
            return null;
        }
    }

    async getAllUserInsightScoreSummaries(): Promise<UserInsightScoreSummaryDoc[]> {
        await connectToDb();

        try {
            return await userInsightScoreSummariesModel
                .find({})
                .sort({ totalInsightScore: -1 })
                .exec();
        } catch (error) {
            console.error('Error getting all user insight score summaries:', error);
            return [];
        }
    }

    async getLeaderboardByRank(limit: number = 10): Promise<UserInsightScoreSummaryDoc[]> {
        await connectToDb();

        try {
            return await userInsightScoreSummariesModel
                .find({ rank: { $ne: null } })
                .sort({ rank: 1 })
                .limit(limit)
                .exec();
        } catch (error) {
            console.error('Error getting leaderboard by rank:', error);
            return [];
        }
    }
}
