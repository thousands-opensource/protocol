import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";

/**
 * Hook to claim a ticket for a Wildpass owner.
 * @returns
 */
export const useClaimTicketForWildpassOwner = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const router = useRouter();

    interface ClaimTicketForWildpassOwnerParams {
        stageId: string;
        seriesId: string;
        eventId: string;

        serverCode: string;
    }

    const claimTicketForWildapassOwner = async ({
        stageId,
        seriesId,
        eventId,
        serverCode,
    }: ClaimTicketForWildpassOwnerParams) => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.post(
                "/api/claimedTickets/claimTicketForWildpassOwner",
                {
                    stageId,
                    seriesId,
                    eventId,
                    serverCode,
                }
            );

            if (response.status === 200) {
                const { stageUrl } = response.data;
                // Redirect to the stream URL
                router.push(stageUrl);
            } else {
                setError(response.data.message || "An error occurred.");
            }
        } catch (err: any) {
            setLoading(false);

            setError(
                err.response?.data?.message || "An unexpected error occurred."
            );
        }
    };

    return {
        claimTicket: claimTicketForWildapassOwner,
        loading,
        error,
    };
};
