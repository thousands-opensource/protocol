import { useState } from "react";
import axios from "axios";
import { ITicketQueue } from "@repo/interfaces";

interface JoinTicketQueueResult {
    isLoading: boolean;
    error: string | null;
    queueEntry: ITicketQueue | null;
    joinQueue: (userId: string, seriesId: string) => Promise<void>;
}

/**
 * Join the ticket queue for a user
 */
export function useJoinTicketQueue(): JoinTicketQueueResult {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [queueEntry, setQueueEntry] = useState<ITicketQueue | null>(null);

    const joinQueue = async (userId: string, seriesId: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await axios.post("/api/ticketQueue/join", {
                userId,
                seriesId,
            });
            setQueueEntry(response.data.queueEntry);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "An error occurred while joining the queue"
            );
        } finally {
            setIsLoading(false);
        }
    };

    return { isLoading, error, queueEntry, joinQueue };
}
