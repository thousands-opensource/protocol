import { useState, useEffect, useCallback, useRef } from "react";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import axiosAuthClientInstance from "@/lib/axiosAuthClientInstance";

interface CreditBalanceObj {
    userId: string | null;
    balance: number;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Hook - Get the credit balance for a user
 * @param userId
 */
const useCreditBalance = (userId: string | null) => {
    const [creditBalanceObj, setCreditBalanceObj] =
        useState<CreditBalanceObj | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const { setCreditBalance } = useWildfileUserContext();
    const hasInitialFetch = useRef(false);

    const updateCreditBalance = (newCreditBalance: number) => {

        setCreditBalanceObj(prevState => { 
            const now = new Date();
            if (prevState === null) {
                return { userId: userId, balance: newCreditBalance, createdAt: now, updatedAt: now }
            }
            return {
                ...prevState, balance: newCreditBalance
            }
        });
        setCreditBalance(newCreditBalance);
    };

    const deductCredits = (amountOfCreditsToDeduct: number) => {
        if (creditBalanceObj === null)
            return;

        const newBalance = creditBalanceObj.balance - amountOfCreditsToDeduct;

        updateCreditBalance(newBalance);
        setCreditBalance(newBalance);
    };

    const fetchCreditBalance = useCallback(async () => {
        if (!userId) return;

        setLoading(true);
        try {
            const response = await axiosAuthClientInstance.get(
                `/api/credits/getBalance/?userId=${userId}`
            );
            setCreditBalanceObj(response.data.data);
            setCreditBalance(response.data.data.balance);
        } catch (error: any) {
            setError(error.message || "Error fetching credit balance");
        } finally {
            setLoading(false);
        }
    }, [userId, setCreditBalance]);

    // Only fetch once when component mounts and userId is available
    useEffect(() => {
        if (userId && !hasInitialFetch.current) {
            hasInitialFetch.current = true;
            fetchCreditBalance();
        }
    }, [userId, fetchCreditBalance]);

    if (!userId) {
        return {
            creditBalanceObj,
            setCreditBalanceObj,
            loading,
            error: "Missing userId parameter",
            updateCreditBalance,
            deductCredits,
        };
    }

    return {
        creditBalanceObj,
        loading,
        error,
        fetchCreditBalance,
        updateCreditBalance,
        deductCredits,
    };
};

export default useCreditBalance;
