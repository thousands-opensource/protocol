import { useState } from "react";
import axios from "axios";
import { ClaimedTicketDoc } from "@repo/schemas";
import { baseTicketTypes } from "@/features/Event/config";

export interface ClaimTicketParams {
    userId: string;
    eventId: string;
    tier: string;
    creditMultiplier?: number;
    accessCode?: string;
}

interface ClaimTicketResult {
    claimedTicket: ClaimedTicketDoc | null;
    isLoading: boolean;
    error: string | null;
    claimTicket: (params: ClaimTicketParams) => Promise<boolean>;
}

/**
 * Hook to claim a ticket for a user for a specific event
 */
const useClaimTicket = (): ClaimTicketResult => {
    const [claimedTicket, setClaimedTicket] = useState<ClaimedTicketDoc | null>(
        null
    );
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const claimTicket = async ({
        userId,
        eventId,
        tier,
        accessCode,
    }: ClaimTicketParams): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        const ticketType = baseTicketTypes.find(
            (ticket) => ticket.tier === tier
        );
        const creditMultiplier = ticketType?.creditMultiplier || 1; // Default to 1 if not found (fallback)

        try {
            const response = await axios.post("/api/claimedTickets/claim", {
                userId,
                eventId,
                tier,
                accessCode,
                creditMultiplier,
            });

            setClaimedTicket(response.data.claimedTicket);
            setIsLoading(false);
            return true;
        } catch (error: any) {
            console.error("Error claiming ticket:", error);
            setError(
                error.response?.data?.message ||
                    "An error occurred while claiming the ticket"
            );
            setIsLoading(false);
            return false;
        }
    };

    return { claimedTicket, isLoading, error, claimTicket };
};

export default useClaimTicket;
