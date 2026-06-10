import { useCallback, useState } from "react";
import axios from "axios";

/**
 * Custom hook to generate a transaction ID for Thirdweb Pay
 */
export const useGenerateTransactionId = () => {
    const [transactionId, setTransactionId] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTransactionId = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(
                "/api/credits/generateTransactionId"
            );

            if (response.status === 200) {
                setTransactionId(response.data?.data?.transactionId || null);
            } else {
                setError(
                    response.data?.error || "Failed to generate transaction ID."
                );
            }
        } catch (err) {
            setError("An error occurred while generating transaction ID.");
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        transactionId,
        setTransactionId,
        loading,
        error,
        fetchTransactionId,
    };
};
