import { useState, useEffect } from "react";
import axios from "axios";
import { IAccessCode } from "@repo/interfaces";

interface UseAccessCodesResult {
    accessCodes: IAccessCode[];
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

/**
 * Hook to fetch access codes for a user by userId and seriesId
 */
export const useAccessCodes = (
    userId: string,
    seriesId: string
): UseAccessCodesResult => {
    const [accessCodes, setAccessCodes] = useState<IAccessCode[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAccessCodes = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get(
                `/api/accessCode/getAccessCodesByUserId?userId=${userId}&seriesId=${seriesId}`
            );
            setAccessCodes(response.data.accessCodes);
        } catch (err) {
            setError("Failed to fetch access codes");
            console.error("Error fetching access codes:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        console.log('userId, seriesId', userId, seriesId)
        fetchAccessCodes();
    }, [userId, seriesId]);

    return { accessCodes, isLoading, error, refetch: () => { 
        console.log('calledRefetch')
        // fetchAccessCodes()
    } };
};
