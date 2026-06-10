import { useState } from "react";
import axios from "axios";
import { TicketTierType, ITicketQueue } from "@repo/interfaces";

interface AwardVouchersParams {
    seriesId: string;
    numberOfVouchersToAward: number;
    tier: TicketTierType;
}

interface UseAwardVouchersResult {
    awardVouchers: (params: AwardVouchersParams) => Promise<ITicketQueue[]>;
    isLoading: boolean;
    error: string | null;
}

/**
 * Award vouchers to users in the ticket queue (based on their position and requirements)
 */
export function useAwardVouchers(): UseAwardVouchersResult {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const awardVouchers = async (
        params: AwardVouchersParams
    ): Promise<ITicketQueue[]> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await axios.post(
                "/api/ticketQueue/awardVouchers",
                params
            );
            return response.data.awardedUsers;
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "An error occurred while awarding vouchers"
            );
            return [];
        } finally {
            setIsLoading(false);
        }
    };

    return { awardVouchers, isLoading, error };
}
