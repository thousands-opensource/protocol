import {
    Document,
    Schema,
    model,
    Model,
    models,
    Types,
    InferSchemaType,
} from "mongoose";

interface IUserInsightScore {
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

interface IUserInsightScoreSummary {
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

export const USER_INSIGHT_SCORES_TABLE_NAME = "user-insight-scores";
export const USER_INSIGHT_SCORE_SUMMARIES_TABLE_NAME = "user-insight-score-summaries";

const userInsightScoresSchema = new Schema<IUserInsightScore>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        rallyPredictionId: {
            type: Schema.Types.ObjectId,
            ref: "rally-predictions",
            required: true,
            index: true,
        },
        userRallyPredictionId: {
            type: Schema.Types.ObjectId,
            ref: "user-rally-predictions",
            required: true,
            unique: true,
        },
        pointsEarned: {
            type: Number,
            required: true,
        },
        wasCorrect: {
            type: Boolean,
            required: true,
        },
        predictionAmount: {
            type: Number,
            required: true,
        },
        predictionPrice: {
            type: Number,
            required: true,
        },
        userPrediction: {
            type: Boolean,
            required: true,
        },
        actualOutcome: {
            type: Boolean,
            required: true,
        },
        timingBonus: {
            type: Number,
            default: 0,
        },
        confidenceBonus: {
            type: Number,
            default: 0,
        },
        calculatedAt: {
            type: Date,
            required: true,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

const userInsightScoreSummariesSchema = new Schema<IUserInsightScoreSummary>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },
        totalInsightScore: {
            type: Number,
            required: true,
            default: 0,
            index: true,
        },
        totalPredictions: {
            type: Number,
            required: true,
            default: 0,
        },
        correctPredictions: {
            type: Number,
            required: true,
            default: 0,
        },
        incorrectPredictions: {
            type: Number,
            required: true,
            default: 0,
        },
        accuracyPercentage: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
            max: 100,
        },
        totalPointsEarned: {
            type: Number,
            required: true,
            default: 0,
        },
        averagePointsPerPrediction: {
            type: Number,
            required: true,
            default: 0,
        },
        bestStreak: {
            type: Number,
            required: true,
            default: 0,
        },
        currentStreak: {
            type: Number,
            required: true,
            default: 0,
        },
        lastUpdated: {
            type: Date,
            required: true,
            default: Date.now,
        },
        rank: {
            type: Number,
            default: null,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

userInsightScoresSchema.index({ userId: 1, rallyPredictionId: 1 });
userInsightScoresSchema.index({ rallyPredictionId: 1, wasCorrect: 1 });
userInsightScoresSchema.index({ calculatedAt: -1 });

userInsightScoreSummariesSchema.index({ totalInsightScore: -1 });
userInsightScoreSummariesSchema.index({ accuracyPercentage: -1 });
userInsightScoreSummariesSchema.index({ bestStreak: -1 });
userInsightScoreSummariesSchema.index({ rank: 1 });


export const userInsightScoresModel =
    (models[USER_INSIGHT_SCORES_TABLE_NAME] as Model<IUserInsightScore, {}, {}, {}, any>) ||
    model<IUserInsightScore>(USER_INSIGHT_SCORES_TABLE_NAME, userInsightScoresSchema);

export const userInsightScoreSummariesModel =
    (models[USER_INSIGHT_SCORE_SUMMARIES_TABLE_NAME] as Model<IUserInsightScoreSummary, {}, {}, {}, any>) ||
    model<IUserInsightScoreSummary>(USER_INSIGHT_SCORE_SUMMARIES_TABLE_NAME, userInsightScoreSummariesSchema);

export type UserInsightScoreDoc = Document<unknown, any, any> & {
    _id: Types.ObjectId;
} & {
    userId: Types.ObjectId;
    rallyPredictionId: Types.ObjectId;
    userRallyPredictionId: Types.ObjectId;
    pointsEarned: number;
    wasCorrect: boolean;
    predictionAmount: number;
    predictionPrice: number;
    userPrediction: boolean;
    actualOutcome: boolean;
    timingBonus: number;
    confidenceBonus: number;
    calculatedAt: Date;
};

export type UserInsightScoreSummaryDoc = Document<unknown, any, any> & {
    _id: Types.ObjectId;
} & {
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
};

export type UserInsightScoreInsert = InferSchemaType<typeof userInsightScoresSchema>;
export type UserInsightScoreSummaryInsert = InferSchemaType<typeof userInsightScoreSummariesSchema>;
