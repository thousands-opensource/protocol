import { Contract } from "ethers";
import WildfileJson from "./abi/Wildfile.json";
import { ContractResult } from "../types";
import { logError } from "@src/logger";
import { getWildfileContractAddress } from "@src/util/environmentUtil";
import { WALLET } from "@src/util/contractConstructorUtil";

export const WILDFILE_ADDRESS = getWildfileContractAddress();
if (!WILDFILE_ADDRESS) {
    console.warn(
        "Address of Wildfile contract not found. Run 'npm run deploy' or set WILDFILE_CONTRACT_ADDRESS environment variable to the deployed contract address"
    );
} else {
    console.log(`Using Wildfile contract address: ${WILDFILE_ADDRESS}`);
}

class WildfileContract {
    contract: Contract;

    constructor() {
        this.contract = new Contract(
            WILDFILE_ADDRESS,
            WildfileJson.abi,
            WALLET
        );
    }

    async transfer(wildfileId: number, to: string): Promise<ContractResult> {
        try {
            const currentOwner = await this.contract.ownerOf(wildfileId);
            const tx = await this.contract.safeTransferFrom(
                currentOwner,
                to,
                wildfileId
            );
            return {
                success: true,
                txHash: tx.hash,
            };
        } catch (e) {
            logError("Failed to transfer", e);
            return {
                success: false,
                err: e.reason,
            };
        }
    }

    async getWildfileId(account: string): Promise<number> {
        try {
            const wildfileId = await this.contract.getWildfileId(account);
            return wildfileId.toNumber();
        } catch (e) {
            logError("Failed to get Wildfile ID", e);
            return null;
        }
    }

    async ownerOf(id: number): Promise<string> {
        try {
            const ownerAddr = await this.contract.ownerOf(id);
            return ownerAddr;
        } catch (e) {
            logError("Failed to get Wildfile ID", e);
            return null;
        }
    }
}

export const WILDFILE_CONTRACT: WildfileContract = new WildfileContract();
