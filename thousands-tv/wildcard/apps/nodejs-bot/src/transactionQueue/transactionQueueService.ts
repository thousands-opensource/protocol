import {
    BundleType,
    ITransactionQueue,
    Transaction,
    TransactionStatusEnum,
} from "@repo/interfaces";
import { createTransactionQueueDB } from "@repo/schemas";
import { logError } from "@src/logger";
import { Types } from "mongoose";

/**
 * Write the transaction bundle to the DB to be picked up by the transaction queue interval
 * @param transactionBundle An array of transactions defining the bundle
 * @returns the txn queue id if successfully written to the DB, otherwise empty string
 */
export async function writeTransactionQueue(
    transactionBundle: Transaction[],
    bundleType?: BundleType,
    userId?: Types.ObjectId
): Promise<string> {
    // Create and save the transaction queue to be processed
    const transactionQueue: ITransactionQueue = {
        txnBundle: transactionBundle,
        bundleType: bundleType,
        status: TransactionStatusEnum.READY,
        runNext: new Date().getTime(),
        retries: 0,
    };

    // Add the userId if it's provided
    if (userId) {
        transactionQueue.userId = userId;
    }

    // Add the bundleType if it's provided
    if (bundleType) {
        transactionQueue.bundleType = bundleType;
    }

    try {
        const doc = await createTransactionQueueDB(transactionQueue);
        return doc._id.toString();
    } catch (e) {
        logError("Error writing the transaction queue object to the DB", e);
        return "";
    }
}
