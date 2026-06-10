import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { UserTicketQueueData } from "@/pages/api/ticketQueue/getQueuePosition";
import { TICKET_QUEUE_REFRESH_INTERVAL_MS } from "@/features/Event/constants";

interface QueuePositionResult {
    queuePosition: number | null;
    totalInQueue: number | null;
    userTicketQueueData: UserTicketQueueData | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

/**
 * Get the queue position for a user
 * @param userId
 * @param seriesId
 * @returns
 */
export function useGetUserQueuePosition(
    userId: string,
    seriesId: string
): QueuePositionResult {
    const [queuePosition, setQueuePosition] = useState<number | null>(null);
    const [totalInQueue, setTotalInQueue] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userTicketQueueData, setUserTicketQueueData] =
        useState<UserTicketQueueData | null>(null);
    const [hasFetchedInitially, setHasFetchedInitially] = useState(false);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const fetchQueuePosition = useCallback(async () => {
        if (!userId || !seriesId) return;

        // Show loading only for the initial fetch
        if (!hasFetchedInitially) {
            setIsLoading(true);
        }

        setError(null);

        if (!userId || !seriesId) {
            return;
        }

        try {
            const response = await axios.get(
                `/api/ticketQueue/getQueuePosition?userId=${userId}&seriesId=${seriesId}`
            );

            const {
                queuePosition: newQueuePosition,
                totalInQueue: newTotalInQueue,
                ...restData
            } = response.data;

            // Update state only if data has changed
            if (newQueuePosition !== queuePosition)
                setQueuePosition(newQueuePosition);
            if (newTotalInQueue !== totalInQueue)
                setTotalInQueue(newTotalInQueue);
            if (
                JSON.stringify(restData) !== JSON.stringify(userTicketQueueData)
            )
                setUserTicketQueueData(restData);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "An error occurred while fetching the queue position"
            );
        } finally {
            setIsLoading(false);

            if (!hasFetchedInitially) setHasFetchedInitially(true);
        }
    }, [
        userId,
        seriesId,
        queuePosition,
        totalInQueue,
        userTicketQueueData,
        hasFetchedInitially,
    ]);

    useEffect(() => {
        fetchQueuePosition();

        intervalRef.current = setInterval(
            fetchQueuePosition,
            TICKET_QUEUE_REFRESH_INTERVAL_MS
        );

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [fetchQueuePosition]);

    return {
        queuePosition,
        totalInQueue,
        userTicketQueueData,
        isLoading: !hasFetchedInitially && isLoading,
        error,
        refetch: fetchQueuePosition,
    };
}
