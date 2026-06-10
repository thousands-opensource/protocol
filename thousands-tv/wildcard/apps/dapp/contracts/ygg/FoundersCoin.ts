import { Contract } from "ethers";
import { Signer, Provider } from "@wagmi/core";
import FoundersCoinJson from "../abi/ygg/FoundersCoin.json";

// Specific contract address and token ID for FoundersCoin
export const FOUNDERS_COIN_CONTRACT_ADDRESS =
    "0xd07dc4262BCDbf85190C01c996b4C06a461d2430";
export const FOUNDERS_COIN_TOKEN_ID = 119180;

if (!FOUNDERS_COIN_CONTRACT_ADDRESS) {
    console.warn(
        "Address of FoundersCoin contract not found. Run 'npm run deploy' or set FOUNDERS_COIN_CONTRACT_ADDRESS environment variable to the deployed contract address."
    );
} else {
    console.log(
        `Using FoundersCoin contract address: ${FOUNDERS_COIN_CONTRACT_ADDRESS}`
    );
}

export class FoundersCoinContract {
    contract: Contract;

    constructor(provider: Provider) {
        this.contract = new Contract(
            FOUNDERS_COIN_CONTRACT_ADDRESS,
            FoundersCoinJson.abi,
            provider
        );
    }

    /**
     * Fetch the balance of a specific token for a given owner
     * @param ownerAddress The owner's address
     * @param tokenId The ID of the token
     * @returns The balance of the specified token for the owner
     */
    async balanceOf(ownerAddress: string, tokenId: number): Promise<number> {
        try {
            const balance = await this.contract.balanceOf(
                ownerAddress,
                tokenId
            );
            return balance.toNumber();
        } catch (e) {
            const err = `Failed to get FoundersCoin.balanceOf for owner ${ownerAddress} and token ID ${tokenId}`;
            console.error(err, e);
            return 0;
        }
    }
}
