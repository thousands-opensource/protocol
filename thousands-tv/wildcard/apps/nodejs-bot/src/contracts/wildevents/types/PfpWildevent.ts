import { Contract, ethers, BigNumber } from "ethers";
import PfpWildeventJson from "../../abi/wildevents/types/PfpWildevent.json";
import { getPfpWildeventContractAddress } from "@src/util/environmentUtil";
import { WALLET } from "@src/util/contractConstructorUtil";

export const pfpWildeventAddress = getPfpWildeventContractAddress();

if (!pfpWildeventAddress) {
    console.warn(
        "Address of PfpWildevent contract not found. Run 'npm run deploy' or set PFP_WILDEVENT_ADDRESS environment variable to the deployed contract address"
    );
} else {
    console.log(`Using PfpWildevent contract address: ${pfpWildeventAddress}`);
}

export interface PfpWildevent {
    tokenId: BigNumber;
    contractAddress: string;
    chainId: number;
}

export class PfpWildeventContract {
    contract: Contract;

    constructor() {
        this.contract = new Contract(
            pfpWildeventAddress,
            PfpWildeventJson.abi,
            WALLET
        );
    }

    async encode(
        tokenId: number,
        contractAddress: string,
        chainId: number
    ): Promise<Uint8Array> {
        const encodedBytesString: string = await this.contract.encode({
            tokenId,
            contractAddress,
            chainId,
        });
        return ethers.utils.arrayify(encodedBytesString);
    }

    async decode(bytes: Uint8Array): Promise<PfpWildevent> {
        const decodedObj = (await this.contract.decode(bytes)) as PfpWildevent;
        return decodedObj;
    }
}

export const PFP_WILDEVENT_CONTRACT: PfpWildeventContract =
    new PfpWildeventContract();
