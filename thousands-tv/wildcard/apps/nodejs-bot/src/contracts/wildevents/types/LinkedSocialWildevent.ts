import { Contract, ethers } from "ethers";
import LinkedSocialWildeventJson from "../../abi/wildevents/types/LinkedSocialWildevent.json";
import { getLinkedSocialWildeventContractAddress } from "@src/util/environmentUtil";
import { WALLET } from "@src/util/contractConstructorUtil";

// address of the contract onchain
export const linkedSocialWildeventAddress =
    getLinkedSocialWildeventContractAddress();
if (!linkedSocialWildeventAddress) {
    console.warn(
        "Address of LinkedSocialWildevent contract not found. Run 'npm run deploy' or set LINKED_SOCIAL_WILDEVENT_ADDRESS environment variable to the deployed contract address"
    );
} else {
    console.log(
        `Using LinkedSocialWildevent contract address: ${linkedSocialWildeventAddress}`
    );
}

export class LinkedSocialWildeventContract {
    contract: Contract;

    constructor() {
        this.contract = new Contract(
            linkedSocialWildeventAddress,
            LinkedSocialWildeventJson.abi,
            WALLET
        );
    }

    async encode(platform: string): Promise<Uint8Array> {
        const encodedBytesString: string = await this.contract.encode(platform);
        return ethers.utils.arrayify(encodedBytesString);
    }

    async decode(bytes: Uint8Array): Promise<string> {
        return await this.contract.decode(bytes);
    }
}

export const LINKED_SOCIAL_WILDEVENT_CONTRACT: LinkedSocialWildeventContract =
    new LinkedSocialWildeventContract();
