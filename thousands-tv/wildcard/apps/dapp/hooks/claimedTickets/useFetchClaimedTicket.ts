import { useState, useEffect } from "react";
import axios from "axios";
import { ClaimedTicketDoc } from "@repo/schemas";

interface FetchClaimedTicketParams {
    userId: string;
    eventId: string;
}

interface FetchClaimedTicketResult {
    claimedTicket: ClaimedTicketDoc | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

/**
 * Fetches a claimed ticket for a user and event
 * @param userId
 * @param eventId
 */
const useFetchClaimedTicket = ({
    userId,
    eventId,
}: FetchClaimedTicketParams): FetchClaimedTicketResult => {
    const [claimedTicket, setClaimedTicket] = useState<ClaimedTicketDoc | null>(
        null
    );
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchClaimedTicket = async () => {
        setIsLoading(true);
        setError(null);

        if (!userId || !eventId) {
            return;
        }

        try {
            const response = await axios.get(
                `/api/claimedTickets/getClaimedTickets`,
                {
                    params: { userId, eventId },
                }
            );

            setClaimedTicket(response.data.claimedTicket);
        } catch (error: any) {
            setError(
                error.response?.data?.message ||
                    "An error occurred while fetching the claimed ticket"
            );
            setClaimedTicket(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchClaimedTicket();
    }, [userId, eventId]);

    return { claimedTicket, isLoading, error, refetch: fetchClaimedTicket };
};

export default useFetchClaimedTicket;
