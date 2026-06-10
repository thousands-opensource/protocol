import { TEN_SECS_IN_MS, TRANSACTION_QUEUE_RETRY_LIMIT } from "@src/constants";
import {
    BlockchainStatusEnum,
    BundleTypeEnum,
    ITransactionQueue,
    Transaction,
    TransactionStatusEnum,
    TxnTypeEnum,
    TransactionDBParams,
} from "@repo/interfaces";
import {
    findNextTransactionQueueByQuery,
    updateTransactionQueueDB,
    updateTransactionInTxnBundleDB,
} from "@repo/schemas";
import { logError, logInfo } from "@src/logger";
import { handleAirdropTransaction } from "@src/transactionQueue/handlers/airdropTransaction";
import { completeGiveKudosTransactionBundle } from "@src/transactionQueue/handlers/completionFunctions/giveKudosCompletion";
import { ContractResult } from "@src/types";
import { getBlockExplorerTxUrl } from "@src/util/blockchainUtil";
import { Types } from "mongoose";
import { handleKudosTransaction } from "@src/transactionQueue/handlers/kudosTransaction";

const NUM_MS_TO_WAIT_IF_NO_TRANSACTION = TEN_SECS_IN_MS;
const NUM_MS_TO_WAIT_IF_TRANSACTION = 0;

/**
 * Processes the next "READY" transaction queue object in the database.
 * @returns The number of milliseconds to wait before processing the next transaction queue.
 */
export async function processTransactionQueue(): Promise<number> {
    // Query the database for the next transaction queue that is ready to be processed
    // Maintain an up-to-date activeTransactionQueue by setting to the result of the DB query
    let activeTransactionQueue = await findNextTransactionQueueByQuery();
    if (!activeTransactionQueue || !activeTransactionQueue._id) {
        return NUM_MS_TO_WAIT_IF_NO_TRANSACTION;
    }

    const transactionQueueId: Types.ObjectId = activeTransactionQueue._id;
    const transactionBundleCount = activeTransactionQueue.txnBundle.length;
    logInfo(
        `Beginning to process transaction queue [${transactionQueueId}] with transactions: [${activeTransactionQueue.txnBundle
            .map((txn) => txn.type)
            .join(", ")}]`
    );

    // Mark the transaction queue as 'In Progress'
    activeTransactionQueue = await updateTransactionQueueDB(
        { _id: transactionQueueId },
        {
            status: TransactionStatusEnum.IN_PROGRESS,
        }
    );

    try {
        // Iterate over each transaction in the bundle
        for (let i = 0; i < transactionBundleCount; i++) {
            const transaction = activeTransactionQueue.txnBundle[i];
            // Process the transaction
            logInfo(
                `Processing transaction queue [${transactionQueueId}]: Transaction [${i}] - ${transaction.type}`
            );

            if (transaction.status === TransactionStatusEnum.COMPLETED) {
                logInfo(
                    `Transaction queue [${transactionQueueId}]: Transaction [${i}] - ${transaction.type} already marked 'Completed.' Continuing to next transaction...`
                );
                continue;
            }

            // If the blockchain status is 'Submitted Waiting' at the outset, then
            // the bot crashed while waiting for the transaction to be mined.
            if (
                transaction.blockchainStatus ===
                BlockchainStatusEnum.SUBMITTED_WAITING
            ) {
                const errMsg = `Transaction queue [${transactionQueueId}]: Transaction [${i}] - ${transaction.type} had 'Submitted Waiting' blockchain status. Check the transaction hash and update the status manually.`;
                logError(errMsg);
                throw new Error(errMsg);
            }

            activeTransactionQueue = await updateTransactionInTxnBundleDB(
                transactionQueueId,
                { status: TransactionStatusEnum.IN_PROGRESS },
                i
            );

            const transactionDBParams: TransactionDBParams = {
                transactionQueueId: transactionQueueId,
                transactionIndex: i,
            };
            const transactionResult = await processTransaction(
                transaction,
                transactionDBParams
            );

            if (!transactionResult) {
                throw new Error(
                    `Failed to process transaction ${transaction.type}`
                );
            }

            const txnUrl = transactionResult.txHash
                ? getBlockExplorerTxUrl(transactionResult.txHash)
                : "N/A";
            logInfo(
                `Transaction queue [${transactionQueueId}]: Transaction [${i}] - ${transaction.type} Transaction URL: ${txnUrl}`
            );

            // Update the transaction in the bundle based on the handler result
            activeTransactionQueue = await updateTransactionInTxnBundleDB(
                transactionQueueId,
                {
                    status: transactionResult.success
                        ? TransactionStatusEnum.COMPLETED
                        : TransactionStatusEnum.ERROR,
                    resultData: transactionResult.data,
                    txnHash: transactionResult.txHash,
                    errMsg: transactionResult.err,
                },
                i
            );

            if (!transactionResult.success) {
                const errMsg = `Transaction failure - Transaction queue [${transactionQueueId}], [${i}] ${transaction.type}: ${transactionResult.err}`;
                logError(errMsg);
                throw new Error(errMsg);
            }
        }

        // If a bundle type is defined, handle the completion function
        if (activeTransactionQueue.bundleType) {
            const completionResult = await onTxnBundleComplete(
                activeTransactionQueue
            );

            activeTransactionQueue = await updateTransactionQueueDB(
                { _id: transactionQueueId },
                {
                    onCompletionLog: completionResult.data,
                }
            );

            if (!completionResult.success) {
                const errMsg = `Transaction failure on the completion function - Transaction queue [${transactionQueueId}], ${activeTransactionQueue.bundleType}: ${completionResult.err}`;
                logError(errMsg);
                throw new Error(errMsg);
            }
        }

        // Update the queue status to 'Completed' if all transactions are processed successfully
        activeTransactionQueue = await updateTransactionQueueDB(
            { _id: transactionQueueId },
            {
                status: TransactionStatusEnum.COMPLETED,
                errMsg: "",
            }
        );

        logInfo(
            `Transaction queue ${transactionQueueId} processing completed.`
        );
    } catch (e) {
        logError(
            `Error processing transaction queue: ${transactionQueueId}`,
            e
        );

        // Handle transaction queue processing failure
        let nextRetry = activeTransactionQueue.retries + 1;
        if (nextRetry >= TRANSACTION_QUEUE_RETRY_LIMIT) {
            // We've hit our retry limit, mark the transaction queue as 'Error'
            logError(`Transaction queue ${transactionQueueId} hit retry limit`);
            activeTransactionQueue = await updateTransactionQueueDB(
                { _id: transactionQueueId },
                {
                    status: TransactionStatusEnum.ERROR,
                    runNext: -1,
                    errMsg: e.message,
                }
            );
            return NUM_MS_TO_WAIT_IF_TRANSACTION;
        }

        // Calculate exponential backoff
        // Retry 1: 10s
        // Retry 2: 1.5m
        // Retry 3: 13.5m
        // Retry 4: 2h 1.5m
        // Retry 5: 18h 15m
        const delay = TEN_SECS_IN_MS * Math.pow(9, nextRetry - 1);

        // Increment the retry count and update the queue status to 'Ready'
        logInfo(
            `Retrying transaction queue ${transactionQueueId} in ${delay}ms`
        );
        activeTransactionQueue = await updateTransactionQueueDB(
            { _id: transactionQueueId },
            {
                status: TransactionStatusEnum.READY,
                runNext: Date.now() + delay,
                retries: nextRetry,
                errMsg: e.message,
            }
        );
    }

    return NUM_MS_TO_WAIT_IF_TRANSACTION;
}

/**
 * Processes a transaction based on its type.
 * @param transaction Transaction to process.
 * @param transactionDBParams Parameters to update a specific transaction in a transaction bundle in the database.
 * @returns ContractResult - the result of the transaction.
 */
async function processTransaction(
    transaction: Transaction,
    transactionDBParams: TransactionDBParams
): Promise<ContractResult> {
    let transactionResult: ContractResult;

    try {
        switch (transaction.type) {
            case TxnTypeEnum.KUDOS:
                transactionResult = await handleKudosTransaction(
                    transaction,
                    transactionDBParams
                );
                break;
            case TxnTypeEnum.AIRDROP:
                transactionResult = await handleAirdropTransaction(
                    transaction,
                    transactionDBParams
                );
                break;
            default:
                logError(`Unknown transaction type: ${transaction.type}`);
                return {
                    success: false,
                    err: "Unknown transaction type",
                    txHash: null,
                };
        }
    } catch (e) {
        logError(`Error processing transaction ${transaction.type}`, e);
        return {
            success: false,
            err: e.message,
            txHash: null,
        };
    }

    return transactionResult;
}

/**
 * Processes a transaction based on its type.
 * @param transaction Transaction to process.
 * @param transactionDBParams Parameters to update a specific transaction in a transaction bundle in the database.
 * @returns ContractResult - the result of the transaction.
 */
async function onTxnBundleComplete(
    txnBundle: ITransactionQueue
): Promise<ContractResult> {
    let completionResult: ContractResult;

    try {
        switch (txnBundle.bundleType) {
            case BundleTypeEnum.AIRDROP_MESSAGE:
                // Place holder for AIRDROP_MESSAGE completion function
                completionResult = {
                    success: true,
                    err: "",
                    txHash: null,
                };
                break;
            case BundleTypeEnum.GIVE_KUDOS:
                completionResult = await completeGiveKudosTransactionBundle(
                    txnBundle
                );
                break;
            default:
                logError(
                    `Unknown transaction bundle type: ${txnBundle.bundleType}`
                );
                return {
                    success: false,
                    err: "Unknown transaction bundle type",
                    txHash: null,
                };
        }
    } catch (e) {
        logError(
            `Error processing transaction's completion function for ${txnBundle.bundleType} - Transaction queue [${txnBundle._id}]`,
            e
        );
        return {
            success: false,
            err: e.message,
            txHash: null,
        };
    }

    return completionResult;
}
