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
    QueryOptions,
} from "mongoose";
import {
    IStreamerStats,
    MONGO_REQUIRED_STRING,
    MONGO_REQUIRED_NUMBER,
    MONGO_REQUIRED_DATE,
    TIMESTAMPS,
} from "@repo/interfaces";

export const STREAMER_STATS_TABLE_NAME = "streamer-stats";

const streamerStatsSchema = new Schema<IStreamerStats>({
    platform: MONGO_REQUIRED_STRING,
    channelName: MONGO_REQUIRED_STRING,
    channelDisplayName: MONGO_REQUIRED_STRING,
    channelId: MONGO_REQUIRED_STRING,
    hoursWatched: MONGO_REQUIRED_NUMBER,
    peakViewers: MONGO_REQUIRED_NUMBER,
    averageViewers: MONGO_REQUIRED_NUMBER,
    date: MONGO_REQUIRED_DATE,
    isPaidOut: {
        type: Boolean,
        required: true,
        default: false,
    },
});

streamerStatsSchema.set(TIMESTAMPS, true);

streamerStatsSchema.index({ channelId: 1, date: 1 }, { unique: true });
streamerStatsSchema.index({ date: 1 });

export const StreamerStatsModel: Model<IStreamerStats> =
    models[STREAMER_STATS_TABLE_NAME] ||
    model<IStreamerStats>(STREAMER_STATS_TABLE_NAME, streamerStatsSchema);

export async function insertManyStreamerStats(
    streamerStats: Partial<IStreamerStats>[]
) {
    return await StreamerStatsModel.insertMany(streamerStats);
}

export async function findOneStreamerStatsByQuery(
    query: FilterQuery<IStreamerStats>
): Promise<IStreamerStats | null> {
    return await StreamerStatsModel.findOne(query).lean();
}

export async function findManyStreamerStatsByQuery(
    query: FilterQuery<IStreamerStats>
): Promise<IStreamerStats[]> {
    return await StreamerStatsModel.find(query).lean();
}

export async function updateOneStreamerStatsDB(
    filter: FilterQuery<IStreamerStats>,
    update:
        | UpdateWithAggregationPipeline
        | UpdateQuery<IStreamerStats>
        | Partial<IStreamerStats>,
    options?: QueryOptions<IStreamerStats>
): Promise<IStreamerStats | null> {
    return await StreamerStatsModel.findOneAndUpdate(filter, update, {
        new: true,
        ...options,
    }).lean();
}

export async function deleteManyStreamerStatsDB(
    filter: FilterQuery<IStreamerStats>
): Promise<any> {
    return await StreamerStatsModel.deleteMany(filter);
}

export async function countStreamerStatsByQuery(
    query: FilterQuery<IStreamerStats>
): Promise<number> {
    return await StreamerStatsModel.countDocuments(query);
}

export async function markStreamerStatsAsPaidOut(
    streamerStatsIds: Types.ObjectId[]
) {
    return await StreamerStatsModel.updateMany(
        { _id: { $in: streamerStatsIds } },
        { $set: { isPaidOut: true } }
    );
}

export async function findUnpaidStreamerStatsByChannelName(
    channelName: string
): Promise<IStreamerStats[]> {
    return await StreamerStatsModel.find({
        channelName,
        isPaidOut: { $ne: true }
    });
}
