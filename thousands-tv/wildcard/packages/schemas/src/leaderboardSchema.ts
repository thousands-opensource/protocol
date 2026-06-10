import {
    ILeaderboard,
    ILeaderBoardCount,
    MONGO_POSTED_WILDEVENT,
    MONGO_REQUIRED_NUMBER,
    MONGO_REQUIRED_STRING,
    TIMESTAMPS,
    UserLeaderboardPosition,
} from "@repo/interfaces";
import {
    Document,
    Schema,
    model,
    Model,
    models,
    Types,
    FilterQuery,
    PipelineStage,
    ProjectionFields,
    UpdateWithAggregationPipeline,
    UpdateQuery,
} from "mongoose";

const LEADERBOARDS_TABLE_NAME = "leaderboards";
const ARCHIVE_LEADERBOARDS_TABLE_NAME = "archive-leaderboards";

const LEADERBOARD_STATS = {
    eventPoint: Number,
    wildpassNftPoint: Number,
    dreamHackPlaytestAttendance: Number,
    dreamHackPlaytestMinutesAttended: Number,
    playtestAttendance: Number,
    playtestMinutesAttended: Number,
    signatureEventAttendance: Number,
    signatureEventMinutesAttended: Number,
    communityGatheringAttendance: Number,
    communityGatheringMinutesAttended: Number,
    kudosUltimateFan: Number,
    kudosBringTheHype: Number,
    kudosLetsGetWild: Number,
    kudosFanOnFire: Number,
    kudosFlyItHigh: Number,
    kudosYouEarnedIt: Number,
    kudosTicketToWild: Number,
    kudosWildWin: Number,
};

const LEADERBOARD_ROW = {
    rank: MONGO_REQUIRED_NUMBER,
    prevRank: MONGO_REQUIRED_NUMBER,
    displayName: String,
    userId: MONGO_REQUIRED_STRING,
    score: MONGO_REQUIRED_NUMBER,
    pfpUrl: String,
    userStats: LEADERBOARD_STATS,
};

const LEADERBOARD_SCORING_DETAIL = {
    startDate: MONGO_REQUIRED_NUMBER,
    endDate: Number,
    points: MONGO_REQUIRED_NUMBER,
    scoringType: MONGO_REQUIRED_STRING,
    label: String,
};

const leaderboardDefinition = {
    name: MONGO_REQUIRED_STRING,
    leaderboardId: MONGO_REQUIRED_STRING,
    isFrozen: Boolean,
    isFullyArchived: Boolean,
    archivedPages: [Number],
    description: MONGO_REQUIRED_STRING,
    leaderboardRows: [LEADERBOARD_ROW],
    leaderboardScoringDetails: [LEADERBOARD_SCORING_DETAIL],
};

// mongo schema
const leaderboardSchema = new Schema<ILeaderboard>(leaderboardDefinition);

leaderboardSchema.set(TIMESTAMPS, true);

const leaderboardModel =
    (models[LEADERBOARDS_TABLE_NAME] as Model<ILeaderboard, {}, {}, {}, any>) ||
    model<ILeaderboard>(LEADERBOARDS_TABLE_NAME, leaderboardSchema);

export type LeaderboardDoc = Document<unknown, any, ILeaderboard> &
    ILeaderboard &
    Required<{
        _id: Types.ObjectId;
    }>;

// Archive set up and definition
const archiveLeaderboardModel =
    (models[ARCHIVE_LEADERBOARDS_TABLE_NAME] as Model<
        ILeaderboard,
        {},
        {},
        {},
        any
    >) ||
    model<ILeaderboard>(ARCHIVE_LEADERBOARDS_TABLE_NAME, leaderboardSchema);

export type ArchiveLeaderboardDoc = Document<unknown, any, ILeaderboard> &
    ILeaderboard &
    Required<{
        _id: Types.ObjectId;
    }>;
/**
 * Returns the count of leaderboards based on the provided query, including leaderboard IDs and total rows.
 * @param query - The MongoDB query used to fetch the correct leaderboards' count (e.g., isFrozen).
 * @returns A promise that resolves to an array of leaderboard IDs and total row counts.
 */
export async function countOfLeaderboardsByQuery(
    query?: FilterQuery<ILeaderboard>
): Promise<ILeaderBoardCount[]> {
    let pipelineStage: PipelineStage[] = [
        {
            $project: {
                _id: 0,
                leaderboardId: 1,
                totalRows: { $size: "$leaderboardRows" },
            },
        },
    ];
    if (query) {
        pipelineStage.unshift({
            $match: query,
        });
    }

    const totalCounts: ILeaderBoardCount[] = await leaderboardModel.aggregate(
        pipelineStage
    );
    return totalCounts;
}

/**
 * Creates an archive leaderboard in the MongoDB database.
 * @param archiveLeaderboard - The object defining the archive leaderboard to create.
 * @returns A promise that resolves to the created archive leaderboard document.
 */
export async function createOneArchiveLeaderboard(
    archiveLeaderboard: ILeaderboard
) {
    return await archiveLeaderboardModel.create(archiveLeaderboard);
}

/**
 * Returns a list of leaderboards based on the provided query.
 * @param query - The MongoDB query used to fetch leaderboards.
 * @param projectionFields - Fields to include or exclude in the returned documents.
 * @returns A promise that resolves to an array of leaderboards or an empty array if none are found.
 */
export async function findLeaderboardsByQuery(
    query: FilterQuery<ILeaderboard>,
    projectionFields?: ProjectionFields<ILeaderboard>
): Promise<ILeaderboard[]> {
    const res = await leaderboardModel.find(query, projectionFields);
    return res ? res : [];
}

/**
 * Finds a single leaderboard in the MongoDB database based on the provided query.
 * @param query - The MongoDB query used to retrieve the leaderboard.
 * @returns A promise that resolves to the found leaderboard document or null if not found.
 */
export async function findOneLeaderboard(query: FilterQuery<ILeaderboard>) {
    return await leaderboardModel.findOne(query);
}

/**
 * Returns user leaderboard positions based on the provided wildfile ID.
 * @param wildfileId - The ID to search for.
 * @returns A promise that resolves to a list of UserLeaderboardPosition objects or an empty array if none are found.
 */
export async function findUserLeaderboardPositions(
    userId: string
): Promise<UserLeaderboardPosition[]> {
    const query = { "leaderboardRows.userId": userId };
    let projectionFields = {
        _id: 0,
        leaderboardId: 1,
        name: 1,
        leaderboardRows: { $elemMatch: { userId: userId } },
    };
    const userLeaderboardPositions: ILeaderboard[] =
        await leaderboardModel.find(query, projectionFields);
    if (!userLeaderboardPositions) {
        return [];
    }

    const res: UserLeaderboardPosition[] = userLeaderboardPositions.map(
        (userPosition: ILeaderboard) => {
            return {
                leaderboardId: userPosition.leaderboardId,
                name: userPosition.name,
                userPosition: userPosition.leaderboardRows[0],
            };
        }
    );

    return res;
}

/**
 * Updates a leaderboard in the MongoDB database based on the provided query.
 * @param query - The MongoDB query used to find the leaderboard to update.
 * @param updateObj - The object defining the update to make.
 * @returns A promise that resolves to the updated leaderboard document.
 */
export async function updateOneLeaderboard(
    query: FilterQuery<ILeaderboard>,
    updateObj: UpdateWithAggregationPipeline | UpdateQuery<ILeaderboard>
) {
    const options = {
        upsert: true,
        new: true,
    };
    return await leaderboardModel.findOneAndUpdate(query, updateObj, options);
}
