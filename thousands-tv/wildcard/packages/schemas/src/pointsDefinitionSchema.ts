import {
    Schema,
    model,
    Model,
    models,
    Document,
    FilterQuery,
    Types,
    UpdateQuery,
    UpdateWithAggregationPipeline,
} from "mongoose";
import {
    IPointsDefinition,
    POINTS_DEFINITION,
    MONGO_REQUIRED_NUMBER,
    MONGO_REQUIRED_STRING,
    TIMESTAMPS,
} from "@repo/interfaces";

const pointsDefinitionSchema = new Schema<IPointsDefinition>({
    pointsId: MONGO_REQUIRED_STRING,
    pointValue: MONGO_REQUIRED_NUMBER,
});

pointsDefinitionSchema.set(TIMESTAMPS, true);

// Due to a nextJS issue with mongo, we need to first check and return the model if it has already been created
// see https://stackoverflow.com/questions/62440264/mongoose-nextjs-model-is-not-defined-cannot-overwrite-model-once-compiled for more details
const pointsDefinitionModel =
    (models[POINTS_DEFINITION] as Model<IPointsDefinition, {}, {}, {}, any>) ||
    model<IPointsDefinition>(POINTS_DEFINITION, pointsDefinitionSchema);

export type PointsDefinitionDoc = Document<unknown, any, IPointsDefinition> &
    IPointsDefinition &
    Required<{ _id: Types.ObjectId }>;

/**
 * Returns a pointsDefinition object based on the provided query.
 * @param query - The MongoDB query used to fetch points for a particular query.
 * @returns A promise that resolves to the found pointsDefinition object or null if none found.
 */
export async function findPointsDefinitionByQuery(
    query: FilterQuery<IPointsDefinition>
): Promise<IPointsDefinition | null> {
    return await pointsDefinitionModel.findOne(query);
}

/**
 * Updates a pointsDefinition object in the database based on the provided query.
 * @param query - The MongoDB query used to find the pointsDefinition object to update.
 * @param update - The object defining the update to apply.
 * @returns A promise that resolves to the updated pointsDefinition object.
 */
export async function updateOnePointsDefinitionDB(
    query: FilterQuery<IPointsDefinition>,
    update: UpdateWithAggregationPipeline | UpdateQuery<IPointsDefinition>
) {
    return await pointsDefinitionModel.findOneAndUpdate(query, update, {
        returnDocument: "after",
        upsert: true,
    });
}
