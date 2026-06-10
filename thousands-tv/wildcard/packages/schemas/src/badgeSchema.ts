import {
    IBadge,
    MONGO_REQUIRED_NUMBER,
    MONGO_REQUIRED_STRING,
    TIMESTAMPS,
} from "@repo/interfaces";
import {
    Document,
    Schema,
    model,
    Model,
    models,
    Types,
    FilterQuery,
} from "mongoose";

const BADGES_TABLE_NAME = "badges";

// mongo schema
const badgeSchema = new Schema<IBadge>({
    id: MONGO_REQUIRED_STRING,
    name: MONGO_REQUIRED_STRING,
    type: MONGO_REQUIRED_STRING,
    swagSetTitle: String,
    description: MONGO_REQUIRED_STRING,
    userIds: [MONGO_REQUIRED_STRING],
});

badgeSchema.set(TIMESTAMPS, true);

const badgeModel =
    (models[BADGES_TABLE_NAME] as Model<IBadge, {}, {}, {}, any>) ||
    model<IBadge>(BADGES_TABLE_NAME, badgeSchema);

export type BadgeDoc = Document<unknown, any, IBadge> &
    IBadge &
    Required<{ _id: Types.ObjectId }>;

/**
 * Performs bulk update operations on badge documents in the MongoDB database.
 * @param bulkWriteOps - An array of bulk write operations to be executed.
 * @returns A promise that resolves to the result of the bulk update operation.
 */
export async function bulkUpdateManyBadge(bulkWriteOps: any[]) {
    const options = {
        ordered: false,
    };

    return await badgeModel.bulkWrite(bulkWriteOps, options);
}

/**
 * Retrieves a list of badges based on the provided query.
 * @param query - The MongoDB query object used to fetch the badges.
 * @returns A promise that resolves to an array of badges, or an empty array if no badges are found.
 */
export async function findBadgesByQuery(
    query: FilterQuery<IBadge>
): Promise<IBadge[]> {
    return await badgeModel.find(query).sort({ _id: 1 });
}
