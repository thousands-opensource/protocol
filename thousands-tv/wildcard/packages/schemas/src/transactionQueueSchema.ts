import {
    ITransactionQueue,
    MONGO_REQUIRED_NUMBER,
    MONGO_REQUIRED_STRING,
    MONGO_TRANSACTION,
    TIMESTAMPS,
    TRANSACTION_QUEUE_TABLE_NAME,
    TransactionStatusEnum,
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

const transactionQueueSchema = new Schema<ITransactionQueue>({
    txnBundle: [MONGO_TRANSACTION],
    userId: Types.ObjectId,
    bundleType: String,
    onCompletionLog: String,
    status: MONGO_REQUIRED_STRING,
    runNext: MONGO_REQUIRED_NUMBER,
    retries: MONGO_REQUIRED_NUMBER,
    errMsg: String,
});

transactionQueueSchema.set(TIMESTAMPS, true);

// add indexes
transactionQueueSchema.index({ userId: 1, status: 1, runNext: 1 });

export const transactionQueueModel =
    (models[TRANSACTION_QUEUE_TABLE_NAME] as Model<
        ITransactionQueue,
        {},
        {},
        {},
        any
    >) ||
    model<ITransactionQueue>(
        TRANSACTION_QUEUE_TABLE_NAME,
        transactionQueueSchema
    );

export type TransactionQueueDoc = Document<unknown, any, ITransactionQueue> &
    ITransactionQueue &
    Required<{ _id: Types.ObjectId }>;

/**
 * Creates a new transaction queue in the database.
 * @param transactionQueue - The transactionQueue object to create.
 * @returns A promise that resolves to the created transactionQueue document.
 */
export async function createTransactionQueueDB(
    transactionQueue: ITransactionQueue
) {
    return await transactionQueueModel.create(transactionQueue);
}

/**
 * Finds the next transaction queue to be processed based on the query.
 * Returns the first transaction queue in the list.
 * @returns A promise that resolves to the next ITransactionQueue to be processed, or null if none found.
 */
export async function findNextTransactionQueueByQuery(): Promise<ITransactionQueue | null> {
    const currentTime = new Date().getTime();
    const nextTransactionQueueDoc = await transactionQueueModel
        .findOne({
            status: TransactionStatusEnum.READY,
            runNext: { $lt: currentTime },
        })
        .sort({ runNext: "asc" });

    return nextTransactionQueueDoc;
}

/**
 * Finds a single transaction queue based on the provided query.
 * @param query - The MongoDB query used to fetch the transaction queue.
 * @returns A promise that resolves to the found ITransactionQueue document or null if none found.
 */
export async function findOneTransactionQueueByQuery(
    query: FilterQuery<ITransactionQueue>
): Promise<ITransactionQueue> {
    return await transactionQueueModel.findOne(query);
}

/**
 * Finds a list of transaction queues based on the provided query.
 * @param query - The MongoDB query used to fetch transaction queues.
 * @returns A promise that resolves to an array of ITransactionQueue documents or an empty array if none found.
 */
export async function findTransactionQueuesByQuery(
    query: FilterQuery<ITransactionQueue>
): Promise<ITransactionQueue[]> {
    return await transactionQueueModel.find(query);
}

/**
 * Updates a transaction queue in the database based on the provided query.
 * @param query - The MongoDB query used to find the transaction queue to update.
 * @param updateObj - The object defining the update to apply.
 * @returns A promise that resolves to the updated ITransactionQueue document.
 */
export async function updateTransactionQueueDB(
    query: FilterQuery<ITransactionQueue>,
    updateObj: UpdateWithAggregationPipeline | UpdateQuery<ITransactionQueue>
): Promise<ITransactionQueue> {
    return await transactionQueueModel.findOneAndUpdate(query, updateObj, {
        new: true,
    });
}

// Define the type for the update operations - prevents type enforcement errors
interface UpdateOperations {
    $set: {
        [key: string]: any;
    };
}

/**
 * Updates the fields of a transaction in a transaction bundle within the database.
 * @param transactionQueueId - The ID of the transaction queue containing the transaction to update.
 * @param updates - The updates to apply to the transaction.
 * @param index - The index of the transaction in the transaction bundle to update.
 * @returns A promise that resolves to the updated ITransactionQueue document.
 */
export async function updateTransactionInTxnBundleDB(
    transactionQueueId: Types.ObjectId,
    updates: Record<string, any>,
    index: number
): Promise<ITransactionQueue> {
    const query = { _id: transactionQueueId };
    const updateObj: UpdateOperations = {
        $set: {},
    };

    // Update each key-value pair in the updates object
    for (const [key, value] of Object.entries(updates)) {
        updateObj.$set[`txnBundle.${index}.${key}`] = value;
    }
    return await updateTransactionQueueDB(query, updateObj);
}
