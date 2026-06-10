import { useState, useCallback } from "react";
import axiosAuthClientInstance from "@/lib/axiosAuthClientInstance";

interface UseTotalPaidOutReturn {
    totalPaidOut: number;
    isLoadingTotal: boolean;
    fetchTotalPaidOut: () => Promise<void>;
    refreshTotal: () => Promise<void>;
}

export const useTotalPaidOut = (): UseTotalPaidOutReturn => {
    const [totalPaidOut, setTotalPaidOut] = useState<number>(0);
    const [isLoadingTotal, setIsLoadingTotal] = useState<boolean>(false);

    const fetchTotalPaidOut = useCallback(async () => {
        try {
            setIsLoadingTotal(true);

            const response = await axiosAuthClientInstance.get("/api/user-total-paid-out");

            if (response.data.success) {
                setTotalPaidOut(response.data.data.totalPaidOut);
                console.log("Total paid out fetched:", response.data.data.totalPaidOut);
            } else {
                console.error("Failed to fetch total paid out:", response.data.err);
                setTotalPaidOut(0);
            }
        } catch (error) {
            console.error("Error fetching total paid out:", error);
            setTotalPaidOut(0);
        } finally {
            setIsLoadingTotal(false);
        }
    }, []);

    const refreshTotal = useCallback(async () => {
        await fetchTotalPaidOut();
    }, [fetchTotalPaidOut]);

    return {
        totalPaidOut,
        isLoadingTotal,
        fetchTotalPaidOut,
        refreshTotal
    };
};
