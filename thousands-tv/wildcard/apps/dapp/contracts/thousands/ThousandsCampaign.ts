import { Contract, ethers } from "ethers";
import { ContractResult } from "@/types";
import { Signer, Provider } from "@wagmi/core";
import { getThousandsCampaignContractAddress as getContractAddress } from "@/utils/environmentUtil";

import CampaignABI from "../abi/thousand-protocol/Campaign.json";
import { Hash } from "viem";

export function getThousandsCampaignContractAddress(): string {
    const address = getContractAddress();
    if (!address) {
        console.warn(
            "Thousands Campaign contract address not set. Please set environment variable NEXT_PUBLIC_THOUSANDS_CAMPAIGN_CONTRACT_ADDRESS"
        );
        return "";
    }
    return address;
}

export class ThousandsCampaignContract {
    public contract: Contract;
    public address: string;

    constructor(signerOrProvider: Signer | Provider) {
        this.address = getThousandsCampaignContractAddress();
        if (!this.address) {
            // throw new Error("Thousands Campaign contract address not configured");
        }

        this.contract = new Contract(
            this.address,
            CampaignABI.abi,
            signerOrProvider
        );

        console.log(`Using Thousands Campaign contract address: ${this.address}`);
    }

    /**
     * Process corridors to distribute tokens to recipients
     * This is the main function for distributing payouts through the Thousands Protocol
     * @param campaignId The ID of the campaign to distribute from
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to distribute (in USDC, will be converted to 6 decimals)
     * @param proofUrl URL providing proof of the distribution
     * @returns Contract transaction result
     */
    async processCorridors(
        campaignId: number,
        recipients: string[],
        amounts: string[], // These should be in converted/readable USDC (e.g., "100" for 100 USDC)
        proofUrl: string
    ): Promise<ContractResult> {
        try {
            console.log(`Processing corridors for campaign ${campaignId}:`, {
                recipients,
                amounts,
                proofUrl
            });

            // Validate inputs
            if (recipients.length !== amounts.length) {
                throw new Error("Recipients and amounts arrays must have the same length");
            }

            if (recipients.length === 0) {
                throw new Error("No recipients provided");
            }

            const amountsBN = amounts.map(amount =>
                ethers.utils.parseUnits(amount.toString(), 6)
            );

            const totalAmount = amountsBN.reduce((sum, amount) => sum.add(amount), ethers.BigNumber.from(0));

            const corridorData = ethers.utils.defaultAbiCoder.encode(
                ["address[]", "uint256[]"],
                [recipients, amountsBN]
            );

            console.log("Encoded corridor data:", {
                totalAmount: totalAmount.toString(),
                corridorData,
                recipients,
                amountsBN: amountsBN.map(bn => bn.toString())
            });

            const transaction = await this.contract.processCorridors(
                campaignId,
                [totalAmount],
                [corridorData],
                proofUrl
            );

            console.log(`Corridors processing transaction submitted: ${transaction.hash}`);

            return {
                success: true,
                data: transaction,
                tx: transaction
            };
        } catch (error: any) {
            console.error("Error processing corridors:", error);
            return {
                success: false,
                err: error.message || "Failed to process corridors on Thousands Campaign contract"
            };
        }
    }

    async getCampaignData(campaignId: number) {
        try {
            const campaignData = await this.contract.getCampaignData(campaignId);

            const formattedData = {
                id: campaignData.id.toString(),
                owner: campaignData.owner,
                operator: campaignData.operator,
                token: campaignData.token,
                bountyAmount: ethers.utils.formatUnits(campaignData.bountyAmount, 6),
                amountUnlocked: ethers.utils.formatUnits(campaignData.amountUnlocked, 6),
                amountDistributed: ethers.utils.formatUnits(campaignData.amountDistributed, 6),
                name: campaignData.name,
                conversionProofUrl: campaignData.conversionProofUrl,
                distributionProofUrl: campaignData.distributionProofUrl,
                corridors: campaignData.corridors
            };

            return {
                success: true,
                data: formattedData
            };
        } catch (error: any) {
            console.error("Error getting campaign data:", error);
            return {
                success: false,
                err: error.message || "Failed to get campaign data"
            };
        }
    }

    async getDistributionIdFromTransaction(txHash: Hash): Promise<string | null> {
        try {
            const receipt = await this.contract.provider.waitForTransaction(txHash);

            const iface = new ethers.utils.Interface(CampaignABI.abi);

            for (const log of receipt.logs) {
                try {
                    const parsedLog = iface.parseLog(log);
                    if (parsedLog.name === "CorridorsProcessed") {
                        return parsedLog.args.distributionId.toString();
                    }
                } catch (e) {
                    continue;
                }
            }

            return null;
        } catch (error) {
            console.error("Error getting distribution ID from transaction:", error);
            return null;
        }
    }

    /**
     * Create a single payout (wrapper around processCorridors for single recipient)
     * @param recipient The wallet address to receive the payout
     * @param amount The amount in USDC (e.g., "100" for 100 USDC)
     * @param campaignId The campaign ID to use for the payout
     * @param proofUrl Proof URL for the payout
     * @returns Contract transaction result
     */
    async createPayout(
        recipient: string,
        amount: string,
        campaignId: number,
        proofUrl: string
    ): Promise<ContractResult> {
        return this.processCorridors(
            campaignId,
            [recipient],
            [amount],
            proofUrl
        );
    }

    async isConnected(): Promise<boolean> {
        try {
            await this.contract.owner();
            return true;
        } catch (error) {
            console.error("Contract connection check failed:", error);
            return false;
        }
    }
}