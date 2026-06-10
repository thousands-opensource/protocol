import { getEthWildpassContractAddress } from "@/utils/environmentUtil";
import { BigNumber, Contract } from "ethers";
import { Signer, Provider } from "@wagmi/core";
import Wildpass from "../abi/wildpass/Wildpass.json";

export const WILDPASS_ADDRESS = getEthWildpassContractAddress();
if (!WILDPASS_ADDRESS) {
    console.warn(
        "Address of Wildpass contract not found. Run 'npm run deploy' or set WILDPASS_CONTRACT_ADDRESS environment variable to the deployed contract address"
    );
} else {
    console.log(`Using Wildpass contract address: ${WILDPASS_ADDRESS}`);
}

export class WildpassContract {
    contract: Contract;

    constructor(signerOrProvider?: Signer | Provider) {
        this.contract = new Contract(
            WILDPASS_ADDRESS,
            Wildpass.abi,
            signerOrProvider
        );
    }

    async isOwner(addr: string): Promise<boolean> {
        try {
            const balance = await this.contract.balanceOf(addr);
            return balance > 0;
        } catch (e) {
            const err = `Failed to get Wildpass.isOwner for ${addr}`;
            console.error(err, e);
            return false;
        }
    }

    async ownerOf(tokenId: number): Promise<string> {
        try {
            const owner = await this.contract.ownerOf(BigInt(tokenId));
            return owner;
        } catch (e) {
            const err = `Failed to get Wildpass.ownerOf for ${BigInt(tokenId)}`;
            console.error(err, e);
            return "";
        }
    }
}
