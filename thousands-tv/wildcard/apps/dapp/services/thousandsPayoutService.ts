import { THOUSANDS_CAMPAIGN_CONTRACT } from "@/utils/backend/backendContracts";
import { executeWithTxnLock } from "@/contracts/transactionLock";
import { ContractResult } from "@/types";
import { IUser } from "@repo/interfaces";

export interface CreatePayoutParams {
    user: IUser;
    twitchChannelName: string;
    hoursWatched: number;
    payoutAmount: number;
    recipientAddress: string;
    campaignId?: number;
}

export interface PayoutResult {
    success: boolean;
    transactionHash?: string;
    distributionId?: string;
    error?: string;
}

export async function createThousandsPayout(params: CreatePayoutParams): Promise<PayoutResult> {
    const { user, twitchChannelName, hoursWatched, payoutAmount, recipientAddress, campaignId } = params;

    const defaultCampaignId = parseInt(process.env.THOUSANDS_CAMPAIGN_ID || "1", 10);
    const finalCampaignId = campaignId || defaultCampaignId;

    if (!recipientAddress) {
        return {
            success: false,
            error: "Recipient address is required"
        };
    }

    try {
        const result = await executeWithTxnLock(
            `streamer-payout-${user._id}`,
            "streamerPayout",
            async () => {
                const proofUrl = `https://wildcard.gg/proof/payout/${user._id}/${Date.now()}`;

                console.log(`Calling processCorridors with:`, {
                    payoutAmount,
                    campaignId: finalCampaignId,
                    recipients: [recipientAddress],
                    amounts: [payoutAmount.toString()],
                    proofUrl
                });

                return await THOUSANDS_CAMPAIGN_CONTRACT.processCorridors(
                    finalCampaignId,
                    [recipientAddress],
                    [payoutAmount.toString()],
                    proofUrl
                );
            }
        );

        if (!result.success || !result.tx) {
            console.error("Transaction failed:", result.err);
            return {
                success: false,
                error: result.err || "Transaction failed"
            };
        }

        console.log(`Transaction successful: ${result.tx.hash}`);

        let distributionId: string | undefined;
        try {
            const receipt = await result.tx.wait();
            if (receipt && receipt.logs) {
                distributionId = `dist_${receipt.transactionHash.slice(2, 10)}`;
                console.log(`Generated distribution ID: ${distributionId}`);
            }
        } catch (receiptError) {
            console.warn("Failed to get transaction receipt:", receiptError);
        }

        return {
            success: true,
            transactionHash: result.tx.hash,
            distributionId
        };

    } catch (error: any) {
        console.error("Error creating Thousands Protocol payout:", error);
        return {
            success: false,
            error: error.message || "Unknown error occurred"
        };
    }
}

export function validateThousandsProtocolConfig(): { isValid: boolean; error?: string } {
    const contractAddress = process.env.NEXT_PUBLIC_THOUSANDS_CAMPAIGN_CONTRACT_ADDRESS;
    const campaignId = process.env.THOUSANDS_CAMPAIGN_ID;
    const privateKey = process.env.PRIVATE_KEY;

    // if (!contractAddress) {
    //     return {
    //         isValid: false,
    //         error: "NEXT_PUBLIC_THOUSANDS_CAMPAIGN_CONTRACT_ADDRESS not configured"
    //     };
    // }

    // if (!campaignId) {
    //     return {
    //         isValid: false,
    //         error: "THOUSANDS_CAMPAIGN_ID not configured"
    //     };
    // }

    // if (!privateKey) {
    //     return {
    //         isValid: false,
    //         error: "PRIVATE_KEY not configured"
    //     };
    // }

    return { isValid: true };
}
