import {
    Document,
    Schema,
    model,
    Model,
    models,
    FilterQuery,
    Types,
    ProjectionFields,
    QueryOptions,
} from "mongoose";
import {
    ICollectible,
    COLLECTIBLE,
    MONGO_REQUIRED_NUMBER,
    MONGO_REQUIRED_STRING,
    TIMESTAMPS,
} from "@repo/interfaces";

const collectibleSchema = new Schema<ICollectible>({
    address: MONGO_REQUIRED_STRING,
    tokenId: MONGO_REQUIRED_STRING,
    name: MONGO_REQUIRED_STRING,
    icon: MONGO_REQUIRED_STRING,
    cost: MONGO_REQUIRED_NUMBER,
    quantity: MONGO_REQUIRED_NUMBER,
});

collectibleSchema.set(TIMESTAMPS, true);

// Due to a nextJS issue with mongo, we need to first check and return the model if it has already been created
// see https://stackoverflow.com/questions/62440264/mongoose-nextjs-model-is-not-defined-cannot-overwrite-model-once-compiled for more details
const collectibleModel =
    (models[COLLECTIBLE] as Model<ICollectible, {}, {}, {}, any>) ||
    model<ICollectible>(COLLECTIBLE, collectibleSchema);

export type CollectibleDoc = Document<unknown, any, ICollectible> &
    ICollectible &
    Required<{ _id: Types.ObjectId }>;

/**
 * Create a new collectible in the database.
 * @param collectible - The collectible object to create.
 * @returns The created collectible document.
 */
export async function createCollectibleDB(collectible: ICollectible) {
    return await collectibleModel.create(collectible);
}

/**
 * Returns all collectible documents based on the provided query, sorted by the most recent.
 * @param query - The MongoDB query used to fetch collectibles.
 * @param projectionFields - Fields to include or exclude in the returned documents.
 * @param queryOption - Additional options for the query.
 * @returns An array of collectibles or an empty array if none are found.
 */
export async function findCollectiblesByQuery(
    query: FilterQuery<ICollectible>,
    projectionFields?: ProjectionFields<ICollectible>,
    queryOption?: QueryOptions<ICollectible>
) {
    return await collectibleModel
        .find(query, projectionFields, queryOption)
        .sort({ _id: -1 });
}

/**
 * Returns a single collectible document based on the provided query.
 * @param query - The MongoDB query used to fetch the collectible.
 * @returns The found collectible document or null if not found.
 */
export async function findOneCollectibleByQuery(
    query: FilterQuery<ICollectible>
): Promise<ICollectible | null> {
    return await collectibleModel.findOne(query).sort({ _id: -1 });
}
