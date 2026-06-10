import { Contract, ethers } from "ethers";
import DiscordEventAttendanceWildeventJson from "../../abi/wildevents/types/DiscordEventAttendanceWildevent.json";
import { getDiscordEventAttendanceWildeventContractAddress } from "@src/util/environmentUtil";
import { WALLET } from "@src/util/contractConstructorUtil";
import { DiscordEventAttendanceWildevent } from "@src/types";

export const discordEventAttendanceWildeventAddress =
    getDiscordEventAttendanceWildeventContractAddress();

if (!discordEventAttendanceWildeventAddress) {
    console.warn(
        "Address of DiscordEventAttendanceWildevent contract not found. Run 'npm run deploy' or set DISCORD_EVENT_ATTENDANCE_WILDEVENT_ADDRESS environment variable to the deployed contract address"
    );
} else {
    console.log(
        `Using DiscordEventAttendanceWildevent contract address: ${discordEventAttendanceWildeventAddress}`
    );
}

export class DiscordEventAttendanceWildeventContract {
    contract: Contract;

    constructor() {
        this.contract = new Contract(
            discordEventAttendanceWildeventAddress,
            DiscordEventAttendanceWildeventJson.abi,
            WALLET
        );
    }

    async encode(
        discordEventWildeventId: number,
        wildfileMinutesAttended: number[]
    ): Promise<Uint8Array> {
        const encodedBytesString: string = await this.contract.encode(
            discordEventWildeventId,
            wildfileMinutesAttended
        );
        return await ethers.utils.arrayify(encodedBytesString);
    }

    async decode(bytes: Uint8Array): Promise<DiscordEventAttendanceWildevent> {
        const decodedObj = await this.contract.decode(bytes);
        return {
            discordEventWildeventId: decodedObj[0].toNumber(),
            wildfileMinutesAttended: decodedObj[1],
        };
    }
}

export const DISCORD_EVENT_ATTENDANCE_WILDEVENT_CONTRACT: DiscordEventAttendanceWildeventContract =
    new DiscordEventAttendanceWildeventContract();
