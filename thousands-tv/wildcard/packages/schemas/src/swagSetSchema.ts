import { ISwagSet, MONGO_REQUIRED_STRING, TIMESTAMPS } from "@repo/interfaces";
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
} from "mongoose";
const SWAG_SETS = "swag-sets";

// mongo schema
const swagSetSchema = new Schema<ISwagSet>({
    contractAddress: MONGO_REQUIRED_STRING,
    title: MONGO_REQUIRED_STRING,
    tokenIds: [MONGO_REQUIRED_STRING],
    claimPeriodEndDate: Date,
});

swagSetSchema.set(TIMESTAMPS, true);

const swagSetModel =
    (models[SWAG_SETS] as Model<ISwagSet, {}, {}, {}, any>) ||
    model<ISwagSet>(SWAG_SETS, swagSetSchema);

export type SwagSetDoc = Document<unknown, any, ISwagSet> &
    ISwagSet &
    Required<{
        _id: Types.ObjectId;
    }>;

/**
 * Clears all swag sets from the database.
 * @returns A promise that resolves to the result of the deletion operation.
 */
export async function clearAllSwagSets() {
    return await swagSetModel.deleteMany({});
}

/**
 * Finds swag sets in the database based on the provided query.
 * @param query - The MongoDB query used to fetch swag sets.
 * @returns A promise that resolves to a list of swag set documents or an empty array if none are found.
 */
export async function findSwagSetsByQuery(
    query: FilterQuery<ISwagSet>
): Promise<SwagSetDoc[]> {
    return await swagSetModel.find(query).sort({ _id: 1 });
}

/**
 * Finds a single swag set document in the database based on the provided query.
 * @param query - The MongoDB query used to fetch the swag set.
 * @returns A promise that resolves to the found swag set document or null if none found.
 */
export async function findOneSwagSetByQuery(
    query: FilterQuery<ISwagSet>
): Promise<SwagSetDoc | null> {
    return await swagSetModel.findOne(query);
}

/**
 * Inserts multiple swag sets into the database.
 * @param swagSets - The swag sets to insert.
 * @returns A promise that resolves when the swag sets have been successfully inserted.
 */
export async function insertManySwagSets(swagSets: ISwagSet[]) {
    return await swagSetModel.insertMany(swagSets);
}

/**
 * Updates a swag set in the database based on the provided query.
 * @param query - The MongoDB query used to find the swag set to update.
 * @param update - The object defining the update to apply.
 * @returns A promise that resolves to the updated swag set document.
 */
export async function updateOneSwagSetDB(
    query: FilterQuery<ISwagSet>,
    update: UpdateWithAggregationPipeline | UpdateQuery<ISwagSet>
) {
    return await swagSetModel.findOneAndUpdate(query, update, {
        returnDocument: "after",
    });
}
