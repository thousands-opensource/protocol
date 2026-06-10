import { Contract } from "ethers";
import WildpassJson from "./abi/Wildpass.json";
import { logError } from "@src/logger";
import { getWildpassContractAddress } from "@src/util/environmentUtil";
import { WALLET } from "@src/util/contractConstructorUtil";

export const WILDPASS_ADDRESS = getWildpassContractAddress();
if (!WILDPASS_ADDRESS) {
    console.warn(
        "Address of Wildpass contract not found. Run 'npm run deploy' or set WILDPASS_CONTRACT_ADDRESS environment variable to the deployed contract address"
    );
} else {
    console.log(`Using Wildpass contract address: ${WILDPASS_ADDRESS}`);
}

class WildpassContract {
    contract: Contract;

    constructor() {
        this.contract = new Contract(
            WILDPASS_ADDRESS,
            WildpassJson.abi,
            WALLET
        );
    }

    async isOwner(addr: string): Promise<boolean> {
        try {
            const balance = await this.contract.balanceOf(addr);
            return balance > 0;
        } catch (e) {
            logError(`Failed to get isOwner for ${addr}`, e);
            return false;
        }
    }
}

export const WILDPASS_CONTRACT: WildpassContract = new WildpassContract();
