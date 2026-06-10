import {
    AirdropRequest,
    AirdropTransactionData,
    BlockchainStatusEnum,
    BundleTypeEnum,
    Transaction,
    TransactionStatusEnum,
    TxnTypeEnum,
} from "@repo/interfaces";
import { QUEUE_KEY_EVENT_CHANNEL_AIRDROP_RECIPIENTS } from "@src/constants";
import { logError, logInfo } from "@src/logger";
import { redisConnected, redisClient } from "@src/redis";
import { writeTransactionQueue } from "@src/transactionQueue/transactionQueueService";
import {
    getFanAttendanceAirdropPollingIntervalSeconds,
    getFanAttendanceAirdropTokenId,
} from "@src/util/environmentUtil";
import { parseAirdropRecipientMessageToObj } from "@src/util/fanAttendanceUtil";
import mongoose from "mongoose";

/**
 * Polls the Redis queue for new airdrop recipients and processes each winner in the airdrop request.
 * For each winner, creates a separate transaction bundle to handle the airdrop on the blockchain.
 * Each transaction is written to the transaction queue for further processing.
 *
 * @returns void
 */
export async function pollQueueAirdropRecipients(): Promise<void> {
    const airdropRecipientIntervalMs =
        getFanAttendanceAirdropPollingIntervalSeconds() * 1000;

    try {
        if (!redisConnected) {
            const errorMsg = `Redis not connected. Skipping poll of queue: ${QUEUE_KEY_EVENT_CHANNEL_AIRDROP_RECIPIENTS}`;
            logError(errorMsg);
            return;
        }

        // Fetch and remove the latest message from the queue
        const redisMessage = await redisClient.lpop(
            QUEUE_KEY_EVENT_CHANNEL_AIRDROP_RECIPIENTS
        );
        if (!redisMessage) {
            return;
        }
        const infoMsg = `Processing airdrop message from queue: ${redisMessage}`;
        logInfo(infoMsg);

        // Parse the airdrop request message
        const airdropRequest: AirdropRequest =
            parseAirdropRecipientMessageToObj(redisMessage);

        // Error handling for invalid messages
        if (!airdropRequest) {
            const errMsg = `Invalid airdrop recipient message: ${redisMessage}`;
            logError(errMsg);
            return;
        }

        logInfo(
            `Processing airdrop request: ${JSON.stringify(airdropRequest)}`
        );

        // Loop through each winner in the airdrop request and write an airdrop transaction for each
        const giftTokenId =
            airdropRequest?.giftId ||
            getFanAttendanceAirdropTokenId().toString();
        //--- WRITE THE AIRDROP TRANSACTION BUNDLE TO THE QUEUE FOR EACH WINNER
        for (const winner of airdropRequest.winners) {
            const userIdStr = winner.userId;
            const userId = new mongoose.Types.ObjectId(userIdStr);

            const airdropTransactionData: AirdropTransactionData = {
                recipientDBId: userId,
                tokenIdStr: giftTokenId,
            };

            // Create the transaction bundle for each winner
            const transactionBundle: Transaction[] = [];
            transactionBundle.push({
                status: TransactionStatusEnum.READY,
                blockchainStatus: BlockchainStatusEnum.NOT_SUBMITTED,
                data: JSON.stringify(airdropTransactionData),
                type: TxnTypeEnum.AIRDROP,
            });

            // Write the transaction to the queue
            const transactionQueueStatus = await writeTransactionQueue(
                transactionBundle,
                BundleTypeEnum.AIRDROP_MESSAGE,
                userId
            );

            if (!transactionQueueStatus) {
                const errMsg = `Failed to write an airdrop transaction for User [${userIdStr}] with Gift Token ID [${giftTokenId}]`;
                throw new Error(errMsg);
            }

            logInfo(
                `Successfully wrote an airdrop transaction for User [${userIdStr}] with Gift Token ID [${giftTokenId}]`
            );
        }
    } catch (e) {
        const errMsg = `Error polling the queue: ${e}`;
        logError(errMsg);
    } finally {
        // Schedule the next poll
        setTimeout(pollQueueAirdropRecipients, airdropRecipientIntervalMs);
    }
}
