import {
    Document,
    models,
    model,
    Model,
    Schema,
    FilterQuery,
    Types,
    UpdateQuery,
    UpdateWithAggregationPipeline,
    ProjectionFields,
    QueryOptions,
} from "mongoose";
import {
    IPoints,
    POINTS,
    MONGO_REQUIRED_NUMBER,
    MONGO_REQUIRED_STRING,
    TIMESTAMPS,
} from "@repo/interfaces";

const pointsSchema = new Schema<IPoints>({
    userId: MONGO_REQUIRED_STRING,
    nftPoints: {
        type: [
            {
                address: MONGO_REQUIRED_STRING,
                points: MONGO_REQUIRED_NUMBER,
                blockNumber: MONGO_REQUIRED_NUMBER,
            },
        ],
        required: true,
    },
    eventPoints: {
        type: [
            {
                points: MONGO_REQUIRED_NUMBER,
                eventId: MONGO_REQUIRED_STRING,
                organizationId: Number,
            },
        ],
        required: true,
    },
});

pointsSchema.set(TIMESTAMPS, true);

// Add indexes for better query performance
// Compound index for the common query pattern in verify page
pointsSchema.index({ userId: 1, "eventPoints.eventId": 1 });
// Single index for userId queries
pointsSchema.index({ userId: 1 });
// Index for eventPoints.eventId queries
pointsSchema.index({ "eventPoints.eventId": 1 });

// Due to a nextJS issue with mongo, we need to first check and return the model if it has already been created
// see https://stackoverflow.com/questions/62440264/mongoose-nextjs-model-is-not-defined-cannot-overwrite-model-once-compiled for more details
const pointsModel =
    (models[POINTS] as Model<IPoints, {}, {}, {}, any>) ||
    model<IPoints>(POINTS, pointsSchema);

export type PointsDoc = Document<unknown, any, IPoints> &
    IPoints &
    Required<{ _id: Types.ObjectId }>;

/**
 * Returns db points object by provided query
 * @param query - mongo query used to fetch points for a particular query
 * @returns points object or null
 */
export async function findPointsByQuery(
    query: FilterQuery<IPoints>
): Promise<IPoints | null> {
    return await pointsModel.findOne(query);
}

/**
 * Inserts a new record of a points item
 * @param points IPoints to insert
 */
export async function createPointsDB(points: IPoints) {
    return await pointsModel.create(points);
}

/**
 * Update points object in DB
 * @param {string} query - mongo query to find points object to update
 * @param {string} update - object defining the update to make
 */
export async function updateOnePointsDB(
    query: FilterQuery<IPoints>,
    update: UpdateWithAggregationPipeline | UpdateQuery<IPoints>
) {
    return await pointsModel.findOneAndUpdate(query, update, {
        returnDocument: "after",
        upsert: true,
    });
}

/**
 * Returns all points docs by provided query and sorts by most recent
 * @param query - mongo query used to fetch points
 * @param projectionFields - fields to include or exclude
 * @param queryOption - specifies additional options for the query
 * @returns points or empty array if none found
 */
export async function findManyPointsByQuery(
    query: FilterQuery<IPoints>,
    projectionFields?: ProjectionFields<IPoints>,
    queryOption?: QueryOptions<IPoints>
): Promise<IPoints[]> {
    return await pointsModel
        .find(query, projectionFields, queryOption)
        .sort({ _id: -1 });
}

/**
 * Counts the number of documents that match query
 * @param query - mongo query used to fetch points
 * @returns counts the number of documents that match query
 */
export async function countPointDocument(
    query: FilterQuery<IPoints>
): Promise<number> {
    return await pointsModel.countDocuments(query);
}
