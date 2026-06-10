import { useState, useEffect, useCallback } from "react";
import axiosAuthClientInstance from "@/lib/axiosAuthClientInstance";
import { IUserRallyPrediction, IRallyPrediction } from "@repo/interfaces";

interface UseUserPredictionsReturn {
    predictions: IUserRallyPrediction[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

interface UseUserPredictionsByEventReturn {
    predictions: IUserRallyPrediction[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export const useUserPredictions = (): UseUserPredictionsReturn => {
    const [predictions, setPredictions] = useState<IUserRallyPrediction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPredictions = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await axiosAuthClientInstance.post(
                "/api/rallyPredictions/getUserRallyPredictionsByUserId",
                {}
            );

            if (response.data.success && response.data.data) {
                // Sort by rallyPredictionId ascending, then createdAt descending
                const sortedPredictions = [...response.data.data].sort((a: IUserRallyPrediction, b: IUserRallyPrediction) => {
                    const idCompare = a.rallyPredictionId.toString().localeCompare(b.rallyPredictionId.toString());
                    if (idCompare !== 0) return idCompare;
                    
                    const dateA = new Date(a.createdAt || 0).getTime();
                    const dateB = new Date(b.createdAt || 0).getTime();
                    return dateB - dateA;
                });
                
                setPredictions(sortedPredictions);
            } else {
                setError(response.data.message || "Failed to fetch predictions");
            }
        } catch (err: any) {
            console.error("Error fetching user predictions:", err);
            setError(err.response?.data?.message || "Failed to fetch predictions");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPredictions();
    }, [fetchPredictions]);

    return { predictions, loading, error, refetch: fetchPredictions };
};

export const useUserPredictionsByEvent = (rallyPredictionId: string | null): UseUserPredictionsByEventReturn => {
    const [predictions, setPredictions] = useState<IUserRallyPrediction[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPredictions = useCallback(async () => {
        if (!rallyPredictionId) {
            setPredictions([]);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            const response = await axiosAuthClientInstance.post(
                "/api/rallyPredictions/getUserRallyPredictionsByUserIdAndRallyPredictionId",
                { rallyPredictionId }
            );

            if (response.data.success && response.data.data) {
                // Sort by createdAt descending
                const sortedPredictions = [...response.data.data].sort((a: IUserRallyPrediction, b: IUserRallyPrediction) => {
                    const dateA = new Date(a.createdAt || 0).getTime();
                    const dateB = new Date(b.createdAt || 0).getTime();
                    return dateB - dateA;
                });
                
                setPredictions(sortedPredictions);
            } else {
                setError(response.data.message || "Failed to fetch predictions");
            }
        } catch (err: any) {
            console.error("Error fetching user predictions by event:", err);
            setError(err.response?.data?.message || "Failed to fetch predictions");
        } finally {
            setLoading(false);
        }
    }, [rallyPredictionId]);

    useEffect(() => {
        fetchPredictions();
    }, [fetchPredictions]);

    return { predictions, loading, error, refetch: fetchPredictions };
};

export const useAllRallyPredictions = () => {
    const [predictions, setPredictions] = useState<IRallyPrediction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPredictions = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await axiosAuthClientInstance.get(
                "/api/rallyPredictions/getRallyPredictions"
            );

            if (response.data.success && response.data.data) {
                setPredictions(response.data.data);
            } else {
                setError(response.data.message || "Failed to fetch forecasts");
            }
        } catch (err: any) {
            console.error("Error fetching forecasts:", err);
            setError(err.response?.data?.message || "Failed to fetch forecasts");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPredictions();
    }, [fetchPredictions]);

    return { predictions, loading, error, refetch: fetchPredictions };
};