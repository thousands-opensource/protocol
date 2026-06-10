import {
    ILock,
    MONGO_REQUIRED_BOOLEAN,
    MONGO_REQUIRED_DATE,
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
    UpdateWithAggregationPipeline,
    UpdateQuery,
} from "mongoose";

const LOCKS = "locks";

const locksSchema = new Schema<ILock>({
    lockType: MONGO_REQUIRED_STRING,
    walletAddress: MONGO_REQUIRED_STRING,
    isLocked: MONGO_REQUIRED_BOOLEAN,
    timestamp: MONGO_REQUIRED_DATE,
    acquireUuid: MONGO_REQUIRED_STRING,
    lockedBy: MONGO_REQUIRED_STRING,
    lockReason: MONGO_REQUIRED_STRING,
});

locksSchema.set(TIMESTAMPS, true);

// lock type and wallet address must be unique
locksSchema.index({ lockType: 1, walletAddress: 1 }, { unique: true });

const locksModel =
    (models[LOCKS] as Model<ILock, {}, {}, {}, any>) ||
    model<ILock>(LOCKS, locksSchema);

export type LockDoc = Document<unknown, any, ILock> &
    ILock &
    Required<{ _id: Types.ObjectId }>;
/**
 * Creates a new lock in the database.
 * @param lock - The lock object to create.
 * @returns A promise that resolves to the created lock document.
 */
export async function createLockDB(lock: ILock): Promise<LockDoc> {
    return await locksModel.create(lock);
}

/**
 * Finds one lock document in the database based on the provided query.
 * @param query - The MongoDB query used to find the lock.
 * @returns A promise that resolves to the found lock document or null if none found.
 */
export async function findOneLockByQuery(
    query: FilterQuery<ILock>
): Promise<LockDoc | null> {
    return await locksModel.findOne(query).sort({ _id: -1 });
}

/**
 * Updates a single lock document in the database based on the provided query.
 * @param query - The MongoDB query used to find the lock to update.
 * @param update - The object defining the update to apply.
 * @returns A promise that resolves to the updated lock document or null if none found.
 */
export async function updateOneLockDB(
    query: FilterQuery<ILock>,
    update: UpdateWithAggregationPipeline | UpdateQuery<ILock>
): Promise<LockDoc | null> {
    return await locksModel.findOneAndUpdate(query, update, {
        returnDocument: "after",
    });
}
