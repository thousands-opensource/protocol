import { Contract, ethers } from "ethers";
import LinkedWalletWildeventJson from "../../abi/wildevents/types/LinkedWalletWildevent.json";
import { getLinkedWalletWildeventContractAddress } from "@src/util/environmentUtil";
import { WALLET } from "@src/util/contractConstructorUtil";

export const linkedWalletWildeventAddress =
    getLinkedWalletWildeventContractAddress();

if (!linkedWalletWildeventAddress) {
    console.warn(
        "Address of LinkedWalletWildevent contract not found. Run 'npm run deploy' or LINKED_WALLET_WILDEVENT_ADDRESS environment variable to the deployed contract address"
    );
} else {
    console.log(
        `Using LinkedWalletWildevent contract address: ${linkedWalletWildeventAddress}`
    );
}

export interface LinkedWalletWildevent {
    wallet: string;
    isAddingWallet: boolean;
}

export class LinkedWalletWildeventContract {
    contract: Contract;

    constructor() {
        this.contract = new Contract(
            linkedWalletWildeventAddress,
            LinkedWalletWildeventJson.abi,
            WALLET
        );
    }

    async encode(wallet: string, isAddingWallet: boolean): Promise<Uint8Array> {
        const encodedBytesString: string = await this.contract.encode(
            wallet,
            isAddingWallet
        );
        return ethers.utils.arrayify(encodedBytesString);
    }

    async decode(bytes: Uint8Array): Promise<LinkedWalletWildevent> {
        const decodedObj = await this.contract.decode(bytes);
        return {
            wallet: decodedObj[0],
            isAddingWallet: decodedObj[1],
        };
    }
}

export const LINKED_WALLET_WILDEVENT_CONTRACT: LinkedWalletWildeventContract =
    new LinkedWalletWildeventContract();
