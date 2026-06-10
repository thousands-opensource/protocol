import { Contract } from "ethers";
import { Signer, Provider } from "@wagmi/core";
import SwordAndShieldJson from "../abi/ygg/SwordAndShield.json";

export const SWORD_AND_SHIELD_ADDRESS =
    "0x9bb26200691a21E8f737424e6d800609e3C5b2fe";

if (!SWORD_AND_SHIELD_ADDRESS) {
    console.warn(
        "Address of Sword and Shield contract not found. Run 'npm run deploy' or set SWORD_AND_SHIELD_CONTRACT_ADDRESS environment variable to the deployed contract address"
    );
} else {
    console.log(
        `Using Sword and Shield contract address: ${SWORD_AND_SHIELD_ADDRESS}`
    );
}

export class SwordAndShieldContract {
    contract: Contract;

    constructor(provider: Provider) {
        this.contract = new Contract(
            SWORD_AND_SHIELD_ADDRESS,
            SwordAndShieldJson.abi,
            provider
        );
    }

    async balanceOf(addr: string): Promise<number> {
        try {
            const balance = await this.contract.balanceOf(addr);
            return balance.toNumber();
        } catch (e) {
            const err = `Failed to get SwordAndShield.balanceOf for ${addr}`;
            console.error(err, e);
            return 0;
        }
    }
}
