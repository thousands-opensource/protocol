import { CreditTransactionStatus } from "@repo/interfaces";
import axios from "axios";
import { useState, useRef, useEffect } from "react";

const usePollTransactionStatus = (
    transactionId: string,
    purchaseStarted: boolean,
    onComplete?: () => void
) => {
    const [status, setStatus] = useState<CreditTransactionStatus>(
        CreditTransactionStatus.NONE
    );
    const [error, setError] = useState<string | null>(null);

    // Add a ref to track if we've already handled completion
    const hasCompletedRef = useRef(false);

    useEffect(() => {
        if (!transactionId || !purchaseStarted) {
            return;
        }

        // Reset completion flag when transaction ID changes
        if (!hasCompletedRef.current) {
            const pollTransactionStatus = async () => {
                try {
                    const response = await axios.get(
                        `/api/credits/getTransactionStatusByTransactionId?transactionId=${transactionId}`
                    );
                    if (response.data.success) {
                        const { status: newStatus } = response.data.data;

                        // Only update status if we haven't completed yet
                        if (
                            newStatus === CreditTransactionStatus.COMPLETED || newStatus === CreditTransactionStatus.PENDING &&
                            !hasCompletedRef.current
                        ) {
                            hasCompletedRef.current = true;
                            if (!!onComplete) setTimeout(() => onComplete?.(), 1000) // some users report no update, give db time to update
                            setStatus(CreditTransactionStatus.COMPLETED);
                        } else if (!hasCompletedRef.current) {
                            setStatus(newStatus);
                        }
                    }
                } catch (err) {
                    setError("Failed to fetch transaction status.");
                    console.error(err);
                }
            };

            // Poll every X seconds
            const intervalId = setInterval(pollTransactionStatus, 3000);

            return () => {
                clearInterval(intervalId);
            };
        }
    }, [transactionId, purchaseStarted]);

    // Reset completion flag when transaction ID changes
    useEffect(() => {
        hasCompletedRef.current = false;
    }, [transactionId]);

    return { status, error, setStatus };
};

export default usePollTransactionStatus;
