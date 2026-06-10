import { Types } from "mongoose";

export interface IUserInsightScore {
    _id?: Types.ObjectId;
    userId: Types.ObjectId;
    rallyPredictionId: Types.ObjectId;
    userRallyPredictionId: Types.ObjectId;
    pointsEarned: number;
    wasCorrect: boolean;
    predictionAmount: number;
    predictionPrice: number;
    userPrediction: boolean;
    actualOutcome: boolean;
    timingBonus?: number;
    confidenceBonus?: number;
    calculatedAt: Date;
    __v?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IUserInsightScoreSummary {
    _id?: Types.ObjectId;
    userId: Types.ObjectId;
    totalInsightScore: number;
    totalPredictions: number;
    correctPredictions: number;
    incorrectPredictions: number;
    accuracyPercentage: number;
    totalPointsEarned: number;
    averagePointsPerPrediction: number;
    bestStreak: number;
    currentStreak: number;
    lastUpdated: Date;
    rank?: number;
    __v?: number;
    createdAt?: Date;
    updatedAt?: Date;
}
