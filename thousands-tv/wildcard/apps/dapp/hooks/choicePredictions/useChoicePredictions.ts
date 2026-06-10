import axiosAuthClientInstance from "@/lib/axiosAuthClientInstance";
import { BackendApiResponse } from "@/types";
import { IRallyPrediction } from "@repo/interfaces";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseChoiceRallyPredictionsReturn {
    predictions: IRallyPrediction[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}
export const useChoicePredictions = (): UseChoiceRallyPredictionsReturn => {
    const [predictions, setPredictions] = useState<IRallyPrediction[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const initialFetch = useRef<boolean>(true);

    const fetchChoiceRallyPredictions = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const response = await axiosAuthClientInstance.get(
                "/api/rallyPredictions/getRallyPredictions/"
            );

            const { success, data }: BackendApiResponse<IRallyPrediction[]> =
                response.data;
            if (!success) {
                setError("Failed to fetch forecasts.");
                return;
            }

            if (!data) {
                setError("No forecasts.");
                return;
            }

            console.log("data", data);
            setPredictions(data);
        } catch (e: any) {
            setError("Error failed to fetch forecasts.");
            return;
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (initialFetch.current) {
            initialFetch.current = false;
            fetchChoiceRallyPredictions();
        }
    }, []);

    return {
        predictions,
        loading,
        error,
        refetch: fetchChoiceRallyPredictions,
    };
};
