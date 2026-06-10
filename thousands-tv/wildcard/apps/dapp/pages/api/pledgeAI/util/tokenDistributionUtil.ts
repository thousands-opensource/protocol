import { diContainer } from "@/inversify.config";
import { EnhancedDistributionResult } from "../types";
import { UNKNOWN_USER_ID } from "./topInsightsUtil";
import ITokenDistributionLogRepository from "@/repositories/interfaces/ITokenDistributionLogRepository";

/**
 * Extracts wallet recipients from the enhanced distribution result.
 * For each top user, if they have a valid wallet address and allocatedTokens > 0,
 * returns an object with the wallet address and allocated tokens.
 *
 * @param distributionResult - The enhanced distribution result.
 * @returns An array of objects in the format { walletAddress: string; allocatedTokens: number }.
 */
export function getDistributableTokensWalletRecipientsJson(
    distributionResult: EnhancedDistributionResult
): { walletAddress: string; allocatedTokens: number }[] {
    try {
        if (
            !distributionResult ||
            !Array.isArray(distributionResult.topUsers)
        ) {
            console.warn(
                "Invalid distributionResult provided to getWalletRecipientsJson; returning empty array."
            );
            return [];
        }
        return distributionResult.topUsers
            .filter(
                (user) =>
                    user.walletAddress &&
                    user.walletAddress.trim() !== "" &&
                    user.walletAddress.trim().toLowerCase() !==
                        UNKNOWN_USER_ID.toLowerCase() &&
                    user.allocatedTokens > 0
            )
            .map((user) => ({
                walletAddress: user.walletAddress,
                allocatedTokens: user.allocatedTokens,
            }));
    } catch (error) {
        console.error("Error in getWalletRecipientsJson:", error);
        return [];
    }
}

/**
 * Logs the token distribution wallet recipients as a CSV string to MongoDB.
 *
 * @param vendorEventId - The vendor event ID.
 * @param enhancedDistributionResult - The enhanced distribution result containing the top users.
 * @returns A promise that resolves once the log is stored. If an error occurs, it logs the error without interrupting the main flow.
 */
export async function logTokenDistributionCSV(
    vendorEventId: string,
    enhancedDistributionResult: EnhancedDistributionResult
): Promise<void> {
    try {
        // Extract wallet recipients from the distribution result.
        const walletRecipients = getDistributableTokensWalletRecipientsJson(
            enhancedDistributionResult
        );

        // Generate CSV string.
        const csvHeader = "Address,Balance";
        const csvRows = walletRecipients.map(
            (recipient) =>
                `${recipient.walletAddress},${recipient.allocatedTokens}`
        );
        const csvContent = [csvHeader, ...csvRows].join("\n");

        const tokenDistributionLogsRepository =
            diContainer.get<ITokenDistributionLogRepository>(
                "ITokenDistributionLogRepository"
            );

        // Store the CSV log in MongoDB.
        await tokenDistributionLogsRepository.createTokenDistributionLog(
            vendorEventId,
            csvContent
        );
        console.log("Token distribution log stored successfully.");
    } catch (error) {
        console.error("Error storing token distribution log:", error);
    }
}
