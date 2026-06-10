import {
    Document,
    Schema,
    model,
    Model,
    models,
    Types,
    FilterQuery,
    UpdateWithAggregationPipeline,
    UpdateQuery,
    SchemaDefinition,
} from "mongoose";
import {
    USERS,
    IUserStats,
    MONGO_REQUIRED_NUMBER,
    TIMESTAMPS,
} from "@repo/interfaces";
import {
    SERIES_TABLE_NAME,
} from "./seriesSchema";

export const USER_STATS = "user-stats";

const Stats: SchemaDefinition = {
    gamesWon: { ...MONGO_REQUIRED_NUMBER, default: 0 },
    gamesLoss: { ...MONGO_REQUIRED_NUMBER, default: 0 },
    gamesAttended: { ...MONGO_REQUIRED_NUMBER, default: 0 },
    minutesSpentPlaying: { ...MONGO_REQUIRED_NUMBER, default: 0 },
    minutesSpentViewing: { ...MONGO_REQUIRED_NUMBER, default: 0 },
};

const userStatsSchema = new Schema<IUserStats>({
    seriesId: {
        type: Schema.Types.ObjectId,
        ref: SERIES_TABLE_NAME,
        required: true,
    },
    user: { type: Types.ObjectId, ref: USERS, required: true },
    stats: Stats,
});

userStatsSchema.set(TIMESTAMPS, true);

// Due to a nextJS issue with mongo, we need to first check and return the model if it has already been created
// see https://stackoverflow.com/questions/62440264/mongoose-nextjs-model-is-not-defined-cannot-overwrite-model-once-compiled for more details

export const userStatsModel =
    (models[USER_STATS] as Model<IUserStats, {}, {}, {}, any>) ||
    model<IUserStats>(USER_STATS, userStatsSchema);

export type UserStatsDoc = Document<unknown, any, IUserStats> &
    IUserStats &
    Required<{ _id: Types.ObjectId }>;

/**
 * Returns db user stats object by provided query
 * @param query - mongo query used to fetch points for a particular query
 * @returns user stats object or null
 */
export async function findUserStatsByQuery(
    query: FilterQuery<IUserStats>
): Promise<IUserStats | null> {
    return await userStatsModel.findOne(query);
}

/**
 * Create or update user stats object in DB
 * @param {string} query - mongo query to find points object to update
 * @param {string} update - object defining the update to make
 * @returns updated user stats object or new user stats object
 */
export async function findOneAndUpdateUserStats(
    query: FilterQuery<IUserStats>,
    update: UpdateWithAggregationPipeline | UpdateQuery<IUserStats>
): Promise<IUserStats> {
    return await userStatsModel.findOneAndUpdate(query, update, {
        returnDocument: "after",
        upsert: true,
        setDefaultsOnInsert: true,
    });
}
