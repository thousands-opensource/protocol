import { Alchemy, AssetTransfersResult, Network } from "alchemy-sdk";
import { ethers } from "ethers";
import { NftPoints, EventPoints } from "@repo/interfaces";

export const POINTS_PER_NFT_PER_BLOCK_OWNED = 1;
export const WILDPASS_POINTS_DEFINITION_ID = "wildpassPerBlock";

/**
 * Get the points for the given nft and latest block number
 * @param walletAddress - The wallet address
 * @returns - The points for holding the nft and the current latest block number
 */
export async function getNftPointsAndLatestBlock(
    alchemy: Alchemy,
    transfers: AssetTransfersResult[],
    points_per_block_owned: number,
    walletAddress: string,
    incomingLatestBlockNum: number,
    contractAddresses: string[],
    rpcProvider: string
): Promise<{ points: number; newLatestBlockForUser: number }> {
    const newLatestBlockForUser = (
        await ethers.getDefaultProvider(rpcProvider).getBlock("latest")
    ).number;
    let points = 0;
    let totalNumBlocksHeld = 0;
    const checkSumWallet: string | null =
        ethers.utils.getAddress(walletAddress) || null;

    //This is very important, if the user's points have been calculated before then we do not want to go to the beginning of time for transfers
    //Therefore, we need to understand which tokens they are holding since last checked so we can give them credit for holding since then
    //If the user
    if (incomingLatestBlockNum !== 0) {
        //Assume for now just one contract address passed in, this can change
        let abi = ["function balanceOf(address account)"];

        // Create function call data -- eth_call
        let iface = new ethers.utils.Interface(abi);
        let data = iface.encodeFunctionData("balanceOf", [walletAddress]);

        // Get balance at a particular block -- usage of eth_call
        let balance = await alchemy.core.call(
            {
                to: contractAddresses[0],
                data: data,
            },
            incomingLatestBlockNum
        );
        let numWildpassesHeld = 0;
        if (balance) {
            try {
                numWildpassesHeld = parseInt(balance);
            } catch (e) {
                console.log("Balance is not a valid number", e);
            }
        }

        if (numWildpassesHeld > 0) {
            totalNumBlocksHeld +=
                numWildpassesHeld *
                (newLatestBlockForUser - incomingLatestBlockNum);
        }
    }
    for (const transfer of transfers) {
        const transfterTo: string =
            ethers.utils.getAddress(transfer.to || "") || "";
        const transfterFrom: string =
            ethers.utils.getAddress(transfer.from || "") || "";
        if (transfterTo === checkSumWallet) {
            totalNumBlocksHeld +=
                newLatestBlockForUser - parseInt(transfer.blockNum);
        }
        if (transfterFrom === checkSumWallet) {
            totalNumBlocksHeld -=
                newLatestBlockForUser - parseInt(transfer.blockNum);
        }
    }
    points = totalNumBlocksHeld * points_per_block_owned;
    return { points, newLatestBlockForUser };
}

/**
 * Get total points
 * @param points - list of points, containing holdings of nft or event interaction made by user
 * @returns total points
 */
export function getTotalPoints(points: NftPoints[] | EventPoints[]) {
    return points.reduce((count: number, point: NftPoints | EventPoints) => {
        return count + point.points;
    }, 0);
}
