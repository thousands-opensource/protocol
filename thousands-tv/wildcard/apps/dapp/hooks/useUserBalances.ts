import { useState, useCallback } from "react";
import axiosAuthClientInstance from "@/lib/axiosAuthClientInstance";

interface TokenBalance {
    balance: string;
    decimals: number;
    symbol?: string;
}

interface UserBalancesData {
    address: string;
    balances: { [contractAddress: string]: TokenBalance };
    timestamp: string;
}

interface UseUserBalancesReturn {
    userBalances: UserBalancesData | null;
    isLoadingBalances: boolean;
    fetchUserBalances: (address: string) => Promise<void>;
    refreshBalances: () => Promise<void>;
    clearBalances: () => void;
}

export const useUserBalances = (): UseUserBalancesReturn => {
    const [userBalances, setUserBalances] = useState<UserBalancesData | null>(null);
    const [isLoadingBalances, setIsLoadingBalances] = useState<boolean>(false);
    const [currentAddress, setCurrentAddress] = useState<string>("");

    const fetchUserBalances = useCallback(async (address: string) => {
        if (!address) return;

        try {
            setIsLoadingBalances(true);
            setCurrentAddress(address);

            const response = await axiosAuthClientInstance.get(`/api/user-balances?address=${address}`);

            if (response.data.success) {
                setUserBalances(response.data.data);
                console.log("User balances fetched:", response.data.data);
            } else {
                console.error("Failed to fetch balances:", response.data.err);
                setUserBalances(null);
            }
        } catch (error) {
            console.error("Error fetching user balances:", error);
            setUserBalances(null);
        } finally {
            setIsLoadingBalances(false);
        }
    }, []);

    const refreshBalances = useCallback(async () => {
        if (currentAddress) {
            await fetchUserBalances(currentAddress);
        }
    }, [currentAddress, fetchUserBalances]);

    const clearBalances = useCallback(() => {
        setUserBalances(null);
        setCurrentAddress("");
    }, []);

    return {
        userBalances,
        isLoadingBalances,
        fetchUserBalances,
        refreshBalances,
        clearBalances
    };
};
