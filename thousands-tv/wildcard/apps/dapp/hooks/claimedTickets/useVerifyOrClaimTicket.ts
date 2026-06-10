import { useState } from "react";
import { IClaimedTicket } from "@repo/interfaces";
import axiosAuthClientInstance, {
    CustomAxiosRequestConfig,
} from "@/lib/axiosAuthClientInstance";
import { ClaimedTicketApiResponse } from "@/pages/api/claimedTickets/verifyOrClaimTicket";

interface VerifyOrClaimTicketParams {
    seriesId: string;
    eventId: string;
    isEventLive: boolean;
    userId: string;
}

interface UseVerifyOrClaimTicketResult {
    claimedTicket: IClaimedTicket | null;
    isLoading: boolean;
    error: string | null;
    verifyOrClaimTicket: () => Promise<void>;
}

/**
 * Hook to verify or claim a ticket for a user and event
 * @returns {UseVerifyOrClaimTicketResult}
 */
const useVerifyOrClaimTicket = ({
    seriesId,
    eventId,
    isEventLive,
    userId,
}: VerifyOrClaimTicketParams): UseVerifyOrClaimTicketResult => {
    const [claimedTicket, setClaimedTicket] = useState<IClaimedTicket | null>(
        null
    );
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const verifyOrClaimTicket = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response =
                await axiosAuthClientInstance.post<ClaimedTicketApiResponse>(
                    `/api/claimedTickets/verifyOrClaimTicket`,
                    {
                        seriesId,
                        eventId,
                        isEventLive,
                    },
                    { showLoading: true } as CustomAxiosRequestConfig
                );

            const { success, data, message } = response.data;

            if (success && data) {
                setClaimedTicket(data);
            } else {
                console.log(
                    `Failed to claim ticket for eventId: ${eventId}, userId: ${userId}`,
                    `Message: ${message}`
                );
                setError(
                    message || "Failed to claim ticket. Please try again."
                );
            }
        } catch (err: any) {
            const errorMessage =
                err.response?.data?.message ||
                "An unexpected error occurred while verifying ticket ownership/claiming a new ticket.";
            console.error("Ticket claim error:", errorMessage);
            setError(errorMessage);
            setClaimedTicket(null);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        claimedTicket,
        isLoading,
        error,
        verifyOrClaimTicket,
    };
};

export default useVerifyOrClaimTicket;
