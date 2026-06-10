import { Contract, ethers } from "ethers";
import ArchivedLeaderboardWildeventJson from "../../abi/wildevents/types/ArchivedLeaderboardWildevent.json";
import { getArchivedLeaderboardWildeventContractAddress } from "@src/util/environmentUtil";
import { WALLET } from "@src/util/contractConstructorUtil";
import { ArchivedLeaderboardWildevent } from "@src/types";

export const archivedLeaderboardWildeventAddress =
    getArchivedLeaderboardWildeventContractAddress();

if (!archivedLeaderboardWildeventAddress) {
    console.warn(
        "Address of ArchivedLeaderboardWildevent contract not found. Run 'npm run deploy' or set ARCHIVED_LEADERBOARD_WILDEVENT_ADDRESS environment variable to the deployed contract address"
    );
} else {
    console.log(
        `Using ArchivedLeaderboardWildevent contract address: ${archivedLeaderboardWildeventAddress}`
    );
}

export class ArchivedLeaderboardWildeventContract {
    contract: Contract;

    constructor() {
        this.contract = new Contract(
            archivedLeaderboardWildeventAddress,
            ArchivedLeaderboardWildeventJson.abi,
            WALLET
        );
    }

    //encodes leaderboard id and page num
    async encode(
        leaderboardId: string,
        pageNum: number,
        scores: number[]
    ): Promise<Uint8Array> {
        const encodedBytesString: string = await this.contract.encode(
            leaderboardId,
            pageNum,
            scores
        );
        return await ethers.utils.arrayify(encodedBytesString);
    }

    //decodes leaderboard id and page num
    async decode(bytes: Uint8Array): Promise<ArchivedLeaderboardWildevent> {
        const decodedObj = await this.contract.decode(bytes);
        return {
            leaderboardId: decodedObj[0],
            pageNum: decodedObj[1],
            scores: decodedObj[2],
        };
    }

    /**
     * Calls contract to see if thie particular page number of the leaderboard has been archived
     * @param leaderboardId - id of leaderboard to check on chain
     * @param pageNum - page number of leaderboard to check on chain
     * @returns true if page has already been archived on chain
     */
    async isPageAlreadyArchived(
        leaderboardId: string,
        pageNum: number
    ): Promise<boolean> {
        const isArchived = await this.contract.isPageAlreadyArchived(
            leaderboardId,
            pageNum
        );
        return isArchived;
    }
}

export const ARCHIVED_LEADERBOARD_WILDEVENT_CONTRACT: ArchivedLeaderboardWildeventContract =
    new ArchivedLeaderboardWildeventContract();
