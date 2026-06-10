import { Contract, ethers } from "ethers";
import KudosWildeventJson from "../../abi/wildevents/types/KudosWildevent.json";
import { getKudosWildeventContractAddress } from "@src/util/environmentUtil";
import { WALLET } from "@src/util/contractConstructorUtil";
import { KudosWildevent } from "@src/types";

export const kudosWildeventAddress = getKudosWildeventContractAddress();

if (!kudosWildeventAddress) {
    console.warn(
        "Address of KudosWildevent contract not found. Run 'npm run deploy' or set DISCORD_EVENT_ATTENDANCE_WILDEVENT_ADDRESS environment variable to the deployed contract address"
    );
} else {
    console.log(
        `Using KudosWildevent contract address: ${kudosWildeventAddress}`
    );
}

export class KudosWildeventContract {
    contract: Contract;

    constructor() {
        this.contract = new Contract(
            kudosWildeventAddress,
            KudosWildeventJson.abi,
            WALLET
        );
    }

    async encode(
        reason: string,
        awardedByWildfileId: number
    ): Promise<Uint8Array> {
        const encodedBytesString: string = await this.contract.encode(
            reason,
            awardedByWildfileId
        );
        return await ethers.utils.arrayify(encodedBytesString);
    }

    async decode(bytes: Uint8Array): Promise<KudosWildevent> {
        const decodedObj = await this.contract.decode(bytes);
        return {
            reason: decodedObj[0],
            awardedByWildfileId: decodedObj[1],
        };
    }
}

export const KUDOS_WILDEVENT_CONTRACT: KudosWildeventContract =
    new KudosWildeventContract();
