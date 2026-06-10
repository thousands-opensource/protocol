import { ITransactionQueue, TransactionStatusEnum } from "@repo/interfaces";
import axios from "axios";

/**
 * Simple polling mechanism to check the status of the transaction
 */
export const pollTransactionQueue = async (
    txQueueId: string,
    onSuccess: (txnQueueObj: ITransactionQueue | null) => void,
    onError: (error: string) => void
) => {
    let attempts = 0;
    // wait for 5 minutes
    const maxAttempts = 60;
    const interval = 5000; // 5 seconds

    while (attempts < maxAttempts) {
        attempts++;
        try {
            const res = await axios.get(
                `/api/queryTransactionQueue?id=${txQueueId}`
            );

            console.log("Polling transaction queue response", res);
            const data = res.data;

            if (data.success) {
                // Check if the transaction bundle is completed
                const txnQueueObj: ITransactionQueue = data.data;
                if (txnQueueObj.status === TransactionStatusEnum.COMPLETED) {
                    onSuccess(txnQueueObj);
                    return;
                }
            }

            if (attempts < maxAttempts) {
                await new Promise((resolve) => setTimeout(resolve, interval));
            } else {
                console.log("Transaction polling timed out");
                onError("Transaction polling timed out");
            }
        } catch (e: any) {
            console.error("Error polling transaction queue", e.message);
            if (attempts < maxAttempts) {
                await new Promise((resolve) => setTimeout(resolve, interval));
            } else {
                onError(e.message);
            }
        }
    }
};
