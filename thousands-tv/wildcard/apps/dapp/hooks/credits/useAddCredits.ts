import { useState } from "react";
import axios from "axios";

interface UseAddCreditsParams {
    userId: string;
    transactionId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    paymentGateway: string;
    status: string;
}

/**
 * Demo hook to add credits to a user's account
 * @dev - this would be a restricted API call via an AWS callback (adn marked deprecated)
 * @deprecated
 * @returns
 */
const useAddCredits = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [message, setMessage] = useState("");

    const addCredits = async ({
        userId,
        transactionId,
        amount,
        currency,
        paymentMethod,
        paymentGateway,
        status,
    }: UseAddCreditsParams) => {
        try {
            setIsLoading(true);
            setError(null);
            setSuccess(false);
            setMessage("");

            const response = await axios.post(
                "/api/credits/verifyTransaction",
                {
                    userId,
                    transactionId,
                    amount,
                    currency,
                    paymentMethod,
                    paymentGateway,
                    status,
                }
            );

            const { success, message, error } = response.data;

            if (success) {
                setSuccess(true);
                setMessage(message);
            } else {
                setError(error);
                setMessage(message);
            }
        } catch (err: any) {
            setError("An error occurred while adding credits.");
            setMessage(err.message || "Error adding credits");
        } finally {
            setIsLoading(false);
        }
    };

    return { addCredits, isLoading, error, success, message };
};

export default useAddCredits;
