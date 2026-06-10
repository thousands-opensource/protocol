import { NextApiRequest, NextApiResponse } from "next";
import connectToDb from "@/db/connectToDb";
import { IUser } from "@repo/interfaces";
import { findPointsByQuery, findPointsDefinitionByQuery } from "@repo/schemas";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import { WildcardApiResponse } from "@repo/interfaces";
import { authorize } from "./middleware/authorization";
import { getAllAssociatedWalletsForUser } from "@/utils/userUtil";
import { IPoints } from "@repo/interfaces";
import {
    getToAndFromTransfersForOwner,
    getNftPointsAndLatestBlock,
    POINTS_PER_NFT_PER_BLOCK_OWNED,
    WILDPASS_POINTS_DEFINITION_ID,
} from "@repo/utils";
import {
    AssetTransfersCategory,
    AssetTransfersResult,
    Network,
} from "alchemy-sdk";
import { getAlchemyProvider } from "@/utils/backend/alchemyUtil";
import {
    getPolygonMainnetAlchemyProvider,
    getWildpassContractAddress,
} from "@/utils/environmentUtil";

async function handler(req: NextApiRequest, res: NextApiResponse, user: IUser) {
    if (req.method !== "GET") {
        sendApiResponse(res, {
            success: false,
            err: `Method ${req.method} Not Allowed`,
        });
        return;
    }

    return res.status(404).json({ message: "Not Found" });
}

/**
 * Get updated points for a user's account
 * @param user - The user object
 * @returns - The result of the API call
 */
async function getUpdatedPoints(user: IUser): Promise<WildcardApiResponse> {
    const wallets = getAllAssociatedWalletsForUser(user);
    const id = user._id?.toString() || "";
    let userPoints = 0;

    //get current points object for user from table
    const points: IPoints | null = await findPointsByQuery({ userId: id });

    //Now calculate the difference between the points in the db and the points at this moment
    for (const wallet of wallets) {
        let latestBlockNumber = 0;
        if (points) {
            points.nftPoints.forEach((nftPoint) => {
                if (nftPoint.address === wallet) {
                    latestBlockNumber = nftPoint.blockNumber;
                    userPoints += nftPoint.points;
                }
            });
        }
        //get unclaimed points for nft
        const contractAddresses = [getWildpassContractAddress()];
        const categories = [AssetTransfersCategory.ERC721];
        const polygonAlchemy = getAlchemyProvider(Network.MATIC_MAINNET);

        // Calling the getToAndFromTransfersForOwner method
        let transfers: AssetTransfersResult[] =
            await getToAndFromTransfersForOwner(
                polygonAlchemy!,
                wallet,
                contractAddresses,
                latestBlockNumber,
                categories
            );
        //TODO - think about storing to db every time
        const wildpassPointsDef = await findPointsDefinitionByQuery({
            pointsId: WILDPASS_POINTS_DEFINITION_ID,
        });
        if (!wildpassPointsDef) {
            console.error(
                `${WILDPASS_POINTS_DEFINITION_ID} should be configured in the Points Definition Table`
            );
        }
        const wildpassPointValue = wildpassPointsDef?.pointValue
            ? wildpassPointsDef.pointValue
            : POINTS_PER_NFT_PER_BLOCK_OWNED;
        const { points: unclaimedNftPoints, newLatestBlockForUser } =
            await getNftPointsAndLatestBlock(
                polygonAlchemy!,
                transfers,
                wildpassPointValue,
                wallet,
                latestBlockNumber,
                contractAddresses,
                getPolygonMainnetAlchemyProvider()
            );

        userPoints += unclaimedNftPoints;
    }

    return {
        success: true,
        data: { userPoints },
    };
}

export default authorize(handler);
