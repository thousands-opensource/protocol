import { TokenDistributionLogDoc } from "@repo/schemas";

/**
 * Repository interface for token distribution logs.
 */
export default interface ITokenDistributionLogRepository {
    /**
     * Creates a token distribution log.
     * @param vendorEventId - The vendor event ID.
     * @param logs - The CSV string representing wallet recipients.
     * @returns A promise that resolves to the created log document, or null if creation fails.
     */
    createTokenDistributionLog(
        vendorEventId: string,
        logs: string
    ): Promise<TokenDistributionLogDoc | null>;
}
