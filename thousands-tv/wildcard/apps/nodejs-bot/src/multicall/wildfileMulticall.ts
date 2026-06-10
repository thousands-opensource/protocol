import { WildfileIdByAddress } from "../types";
import { logError } from "@src/logger";
import { WILDFILE_CONTRACT_VIEM } from "@src/util/contractViemUtil";
import { getPublicClient } from "@src/util/viemUtils";
import { multicallResult } from "@repo/interfaces";

// Setup the viem client (provider)
export const client = getPublicClient();

/**
 * Runs a multicall to get the wildfileId for a given wallet address
 * @param walletAddresses - wallet addresses to get the wildfileId for
 * @returns - the wildfileId and each associated wallet address
 */
export async function getWildfileIdMulticall(
    walletAddresses: string[]
): Promise<WildfileIdByAddress[]> {
    try {
        // create a contract call for each address
        const wildfileIdContractCalls = walletAddresses.map((walletAddress) => {
            return {
                abi: WILDFILE_CONTRACT_VIEM.abi, // ABI of the contract
                address: WILDFILE_CONTRACT_VIEM.address as `0x${string}`, // Contract address
                functionName: "getWildfileId", // Function to call
                args: [walletAddress], // Arguments for the function
            };
        });

        // get all wildfile holders via multicall by address
        const wildfileIdResults: multicallResult[] = await client.multicall({
            contracts: wildfileIdContractCalls,
            allowFailure: true,
        });

        // filter out wildfile elements with status "failure"
        const wildfileIdsByAddress: WildfileIdByAddress[] = [];

        for (let index = 0; index < walletAddresses.length; index++) {
            const wildfileIdResult: any = wildfileIdResults[index];
            if (wildfileIdResult.status === "success") {
                wildfileIdsByAddress.push({
                    wildfileId: Number(wildfileIdResult.result),
                    walletAddress: walletAddresses[index],
                });
            }
        }

        return wildfileIdsByAddress;
    } catch (e) {
        logError("Failed to process the getWildfileId multicall", e);
        return e;
    }
}
