import { Contract, ethers } from "ethers";
import DiscordEventWildeventJson from "../../abi/wildevents/types/DiscordEventWildevent.json";
import { getDiscordEventWildeventContractAddress } from "@src/util/environmentUtil";
import { WALLET } from "@src/util/contractConstructorUtil";
import { DiscordEventWildevent } from "@src/types";

export const discordEventWildeventAddress =
    getDiscordEventWildeventContractAddress();

if (!discordEventWildeventAddress) {
    console.warn(
        "Address of DiscordEventWildevent contract not found. Run 'npm run deploy' or set DISCORD_EVENT_WILDEVENT_ADDRESS environment variable to the deployed contract address"
    );
} else {
    console.log(
        `Using DiscordEventWildevent contract address: ${discordEventWildeventAddress}`
    );
}

export class DiscordEventWildeventContract {
    contract: Contract;

    constructor() {
        this.contract = new Contract(
            discordEventWildeventAddress,
            DiscordEventWildeventJson.abi,
            WALLET
        );
    }

    async encode(
        name: string,
        eventType: string,
        description: string,
        durationMinutes: number
    ): Promise<Uint8Array> {
        const encodedBytesString: string = await this.contract.encode(
            name,
            eventType,
            description,
            durationMinutes
        );
        return await ethers.utils.arrayify(encodedBytesString);
    }

    async decode(bytes: Uint8Array): Promise<DiscordEventWildevent> {
        const decodedObj = await this.contract.decode(bytes);

        return {
            name: decodedObj[0],
            eventType: decodedObj[1],
            description: decodedObj[2],
            durationMinutes: decodedObj[3],
        };
    }
}

export const DISCORD_EVENT_WILDEVENT_CONTRACT: DiscordEventWildeventContract =
    new DiscordEventWildeventContract();
