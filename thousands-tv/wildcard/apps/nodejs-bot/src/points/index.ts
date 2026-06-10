import { IPoints, IUser } from "@repo/interfaces";
import { logError } from "@src/logger";
import {
    getPolygonMainnetAlchemyProvider,
    getWildpassContractAddress,
} from "@src/util/environmentUtil";
import { AssetTransfersCategory, AssetTransfersResult } from "alchemy-sdk";
import { FilterQuery } from "mongoose";
import { alchemyPolygon } from "..";
import {
    POINTS_PER_NFT_PER_BLOCK_OWNED,
    WILDPASS_POINTS_DEFINITION_ID,
    getNftPointsAndLatestBlock,
    getToAndFromTransfersForOwner,
} from "@repo/utils";
import { getAllAssociatedWalletsForUser } from "@src/util/util";
import {
    findPointsByQuery,
    findUsersByQuery,
    findPointsDefinitionByQuery,
    countUsersDocument,
    updateOnePointsDB,
} from "@repo/schemas";

export async function populatePoints() {
    const query: FilterQuery<IUser> = {
        "walletProvider.address": { $nin: [null, ""] },
    };

    try {
        // Get total number of user from matching query
        const totalEligibleUsersCount = await countUsersDocument(query);

        // Batch 500 eligible users till it exceeds total eligible users
        let iteration = 0;
        const batchSize = 500;
        while (iteration * batchSize < totalEligibleUsersCount) {
            const eligibleUsers: IUser[] = await findUsersByQuery(
                query,
                {
                    _id: 1,
                    "walletProvider.address": 1,
                    "walletProvider.additionalWallets": 1,
                    "walletProvider.wildfile.initialWildfileId": 1,
                },
                { limit: batchSize, skip: iteration * batchSize }
            );
            for (const user of eligibleUsers) {
                const wildfileId =
                    user?.walletProvider?.wildfile?.initialWildfileId;
                let userPoints: IPoints | null = await findPointsByQuery({
                    userId: user._id,
                });
                let nftPoints = userPoints?.nftPoints || [];

                let walletAddresses: string[] =
                    getAllAssociatedWalletsForUser(user);

                //If any of the userPoints wallet not owned by user, then remove it
                for (let i = nftPoints.length - 1; i >= 0; i--) {
                    const userNftPoint = nftPoints[i];
                    if (!walletAddresses.includes(userNftPoint.address)) {
                        //Remove the userPoint from the user
                        const userPointsQuery = {
                            userId: user._id?.toString(),
                        };
                        const update = {
                            $pull: {
                                nftPoints: { address: userNftPoint.address },
                            },
                        };
                        await updateOnePointsDB(userPointsQuery, update);
                        continue;
                    }

                    //Create or update points for this wallet that is still relevant
                    let latestBlockNumber = userNftPoint.blockNumber;

                    //get unclaimed points for nft
                    const {
                        points: unclaimedNftPoints,
                        newLatestBlockForUser,
                    } = await getUpdatedPointsAndLatestBlock(
                        userNftPoint.address,
                        latestBlockNumber
                    );
                    userNftPoint.points =
                        unclaimedNftPoints + userNftPoint.points;
                    userNftPoint.blockNumber = newLatestBlockForUser;
                    const userPointsUpdateQuery = {
                        userId: user._id?.toString(),
                        "nftPoints.address": userNftPoint.address,
                    };
                    const userPointsUpdate = {
                        wildfileId,
                        $set: {
                            "nftPoints.$": userNftPoint,
                        },
                    };
                    await updateOnePointsDB(
                        userPointsUpdateQuery,
                        userPointsUpdate
                    );
                }

                //Now get the wallet addresses that are not in the DB
                const newWalletAddresses = walletAddresses.filter(
                    (address) =>
                        !nftPoints.some(
                            (nftPoint) => nftPoint.address === address
                        )
                );
                for (const address of newWalletAddresses) {
                    const {
                        points: unclaimedNftPoints,
                        newLatestBlockForUser,
                    } = await getUpdatedPointsAndLatestBlock(address, 0);
                    const userPointsUpdateQuery = {
                        userId: user._id?.toString(),
                    };
                    let userPointsUpdate: any = {
                        wildfileId,
                        $push: {
                            nftPoints: {
                                address: address,
                                points: unclaimedNftPoints,
                                blockNumber: newLatestBlockForUser,
                            },
                        },
                    };
                    if (!userPoints) {
                        userPointsUpdate = {
                            userId: user._id?.toString(),
                            wildfileId,
                            nftPoints: [
                                {
                                    address: address,
                                    points: unclaimedNftPoints,
                                    blockNumber: newLatestBlockForUser,
                                },
                            ],
                        };
                    }

                    userPoints = await updateOnePointsDB(
                        userPointsUpdateQuery,
                        userPointsUpdate
                    );
                }
            }
            iteration++;
        }
    } catch (e) {
        const errMsg = `Error updating points ${e.message}`;
        logError(errMsg, e);
        return;
    }
}

async function getUpdatedPointsAndLatestBlock(
    wallet: string,
    latestBlockNumber: number
): Promise<{ points: number; newLatestBlockForUser: number }> {
    //get unclaimed points for nft
    const contractAddresses = [getWildpassContractAddress()];
    const categories = [AssetTransfersCategory.ERC721];

    // Calling the getToAndFromTransfersForOwner method
    let transfers: AssetTransfersResult[] = await getToAndFromTransfersForOwner(
        alchemyPolygon!,
        wallet,
        contractAddresses,
        latestBlockNumber,
        categories
    );
    const wildpassPointsDef = await findPointsDefinitionByQuery({
        pointsId: WILDPASS_POINTS_DEFINITION_ID,
    });
    if (!wildpassPointsDef) {
        logError(
            `${WILDPASS_POINTS_DEFINITION_ID} must be configured in the Points Definition Table`
        );
    }
    const wildpassPointValue = wildpassPointsDef?.pointValue
        ? wildpassPointsDef.pointValue
        : POINTS_PER_NFT_PER_BLOCK_OWNED;
    const { points, newLatestBlockForUser } = await getNftPointsAndLatestBlock(
        alchemyPolygon!,
        transfers,
        wildpassPointValue,
        wallet,
        latestBlockNumber,
        contractAddresses,
        getPolygonMainnetAlchemyProvider()
    );
    return { points, newLatestBlockForUser };
}
