import { useState, useEffect } from "react";
import axiosAuthClientInstance from "@/lib/axiosAuthClientInstance";

interface ClosedForecastStats {
    correctCalls: number;
    incorrectCalls: number;
    totalUsers: number; // Total unique users who participated
    totalWCEarned: number;
    duration: number; // in days
    startDate: Date;
    endDate: Date;
    largestCorrectCall: number;
    largestIncorrectCall: number;
    resolvedChoice: boolean | null;
    winnerText: string | null;
}

interface UseClosedForecastStatsReturn {
    stats: ClosedForecastStats | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export const useClosedForecastStats = (
    rallyPredictionId: string | null,
    shouldFetch: boolean = true
): UseClosedForecastStatsReturn => {
    const [stats, setStats] = useState<ClosedForecastStats | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = async () => {
        if (!rallyPredictionId || !shouldFetch) {
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await axiosAuthClientInstance.get(
                `/api/rallyPredictions/getClosedForecastStats?rallyPredictionId=${rallyPredictionId}`
            );

            if (response.data.success) {
                // console.log("forecast-debug: Setting stats in hook:", response.data.data);
                setStats(response.data.data);
            } else {
                setError(response.data.message || "Failed to fetch stats");
            }
        } catch (err: any) {
            if (
                err.response?.status === 400 &&
                err.response?.data?.message === "Forecast is not yet closed"
            ) {
                // This is expected for non-closed forecasts
                setStats(null);
                setError(null);
            } else {
                setError(
                    err.response?.data?.message ||
                        "An error occurred while fetching stats"
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const refetch = async () => {
        await fetchStats();
    };

    useEffect(() => {
        fetchStats();
    }, [rallyPredictionId, shouldFetch]);

    return {
        stats,
        loading,
        error,
        refetch,
    };
};
