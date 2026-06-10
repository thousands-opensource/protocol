import { Contract, ethers } from "ethers";
import AirdropWildeventJson from "../../abi/wildevents/types/AirdropWildevent.json";
import { getAirdropWildeventContractAddress } from "@src/util/environmentUtil";
import { WALLET } from "@src/util/contractConstructorUtil";
import { AirdropWildevent } from "@src/types";

export const airdropWildeventAddress = getAirdropWildeventContractAddress();

if (!airdropWildeventAddress) {
    console.warn(
        "Address of AirdropWildevent contract not found. Run 'npm run deploy' or set AIRDROP_WILDEVENT_ADDRESS environment variable to the deployed contract address"
    );
} else {
    console.log(
        `Using AirdropWildevent contract address: ${airdropWildeventAddress}`
    );
}

export class AirdropWildeventContract {
    contract: Contract;

    constructor() {
        this.contract = new Contract(
            airdropWildeventAddress,
            AirdropWildeventJson.abi,
            WALLET
        );
    }

    async encode(
        tokenId: number,
        contractAddress: string,
        chainId: number,
        reason: string,
        wildeventId: number
    ): Promise<Uint8Array> {
        const encodedBytesString: string = await this.contract.encode(
            tokenId,
            contractAddress,
            chainId,
            reason,
            wildeventId
        );
        return await ethers.utils.arrayify(encodedBytesString);
    }

    async decode(bytes: Uint8Array): Promise<AirdropWildevent> {
        const decodedObj = await this.contract.decode(bytes);
        console.log(decodedObj);
        return {
            tokenId: decodedObj[0].toNumber(),
            contractAddress: decodedObj[1],
            chainId: Number(decodedObj[2]),
            reason: decodedObj[3],
            wildeventId: decodedObj[4].toNumber(),
        };
    }
}

export const AIRDROP_WILDEVENT_CONTRACT: AirdropWildeventContract =
    new AirdropWildeventContract();
