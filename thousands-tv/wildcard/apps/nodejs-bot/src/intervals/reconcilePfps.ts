import { alchemyEth, alchemyPolygon } from "@src/index";
import { logInfo } from "@src/logger";
import { supportedPfpCollections } from "@src/supportPfpCollections";
import { NftContractOwnerWithAddr } from "@src/types";
import { Network, NftContractOwner } from "alchemy-sdk";
import { FilterQuery } from "mongoose";
import { getOwnersForContract } from "../util/alchemyUtil";
import { getAllAssociatedWalletsForUser } from "../util/util";
import { IUser, PfpMetadata } from "@repo/interfaces";
import {
    countUsersDocument,
    findUsersByQuery,
    updateOneUserDB,
} from "@repo/schemas";
import { userIdentifier } from "@repo/utils";

export async function reconcilePfps() {
    logInfo("Reconciling pfps");

    //Loop through each contract and retrieve owners for contract
    //Load all users from the database, dont load any that dont have a pfp and dont have a favorite list
    //We only need the pfp's, favorites list, linked wallets and a few other data points. Can remove rest of document for speed
    //Probably need pagination due to mongo response size limits and best practices
    //Ensure the user still owns pfp, if they have one set
    //Ensure user still owns each favorite, if they have a favorites list set

    //Get all the owners for each contract
    const nftContractOwnerWithAddrList: NftContractOwnerWithAddr[] =
        await formatAllOwnersForEachContract();

    const query: FilterQuery<IUser> = {
        $or: [
            {
                "walletProvider.pfp.tokenId": { $gt: "0" },
                "walletProvider.pfp.chainId": { $ne: "0" },
            },
            {
                "walletProvider.favoritePfps.0": { $exists: true },
            },
        ],
    };

    // Get total number of user from matching query
    const totalEligibleUsers = await countUsersDocument(query);

    // Batch 500 eligible users till it exceeds total eligible users
    let iteration = 0;
    const batchSize = 500;
    while (iteration * batchSize < totalEligibleUsers) {
        const eligibleUsers = await findUsersByQuery(
            query,
            {
                "walletProvider.pfp": 1,
                "walletProvider.favoritePfps": 1,
                "walletProvider.address": 1,
                "discordProvider.id": 1,
                "walletProvider.additionalWallets": 1,
            },
            { limit: batchSize, skip: iteration * batchSize }
        );

        //This is just for testing - keep around to test reconcile locally
        // if (eligibleUsers.length > 0) {
        //     eligibleUsers[0].walletAddress =
        //         "0x000A3E111B04A7B3eBcd59b8554B224336057A28";
        // }

        for (const eligibleUser of eligibleUsers) {
            // reconcile pfp, if they have a selected pfp and no longer own it
            reconcilePfp(eligibleUser, nftContractOwnerWithAddrList);
            // reconcile favorites, if they have a favorites list
            reconcileFavoritesList(eligibleUser, nftContractOwnerWithAddrList);
        }

        iteration += 1;
    }
    logInfo("Finished reconciling pfps");
}

/**
 * Collect all owners for each whitelisted contract and format them
 */
async function formatAllOwnersForEachContract(): Promise<
    NftContractOwnerWithAddr[]
> {
    const promises = [];
    for (const contractAddressObject of supportedPfpCollections) {
        const contractAddress = contractAddressObject.contractAddress;
        const alchemyProvider =
            contractAddressObject.network == Network.ETH_MAINNET
                ? alchemyEth
                : alchemyPolygon;
        promises.push(getOwnersForContract(alchemyProvider, contractAddress));
    }

    // Capped at MAXIMUM 2 Million elements
    const nftContractOwnerResult = await Promise.all(promises);
    const nftContractOwnerWithAddrList: NftContractOwnerWithAddr[] =
        nftContractOwnerResult.map(
            (nftContractOwner: NftContractOwner[], index: number) => {
                return {
                    nftContractOwner: nftContractOwner,
                    contractAddress:
                        supportedPfpCollections[index].contractAddress,
                };
            }
        );

    return nftContractOwnerWithAddrList;
}

/**
 * Reconcile pfp
 * @param eligibleUser - Eligible user who may have pfp or list of favorite pfps that need to be reconcile
 * @param nftContractOwnerWithAddrList - list of contract owner and collection addr
 * @returns void
 */
function reconcilePfp(
    eligibleUser: IUser,
    nftContractOwnerWithAddrList: NftContractOwnerWithAddr[]
) {
    const pfpObject = eligibleUser.walletProvider?.pfp;
    if (!pfpObject || !pfpObject.tokenId) {
        return;
    }
    const ownsPfp = doesUserOwnPfp(
        pfpObject,
        eligibleUser,
        nftContractOwnerWithAddrList
    );
    //If the user still owns pfp, do not reconcile anything
    if (ownsPfp) {
        return;
    }

    updateOneUserDB(
        { _id: eligibleUser._id },
        { $unset: { "walletProvider.pfp": 1 } }
    );
    logInfo(
        `Removed pfp in contract: ${pfpObject.contractAddress} with token id: ${
            pfpObject.tokenId
        } for user [${userIdentifier(eligibleUser)}] with wallet address:
                                ${eligibleUser.walletProvider.address}`
    );
}

/**
 * Reconcile list of favorite pfps
 * @param eligibleUser - Eligible user who may have pfp or list of favorite pfps that need to be reconcile
 * @param nftContractOwnerWithAddrList - list of contract owner and collection addr
 * @returns void
 */
function reconcileFavoritesList(
    eligibleUser: IUser,
    nftContractOwnerWithAddrList: NftContractOwnerWithAddr[]
) {
    const favoritePfpList = eligibleUser.walletProvider?.favoritePfps;
    if (!favoritePfpList || favoritePfpList.length === 0) {
        return;
    }

    let didUpdateFavList = false;
    for (let i = favoritePfpList.length - 1; i >= 0; i--) {
        const favoritePfp = favoritePfpList[i];
        const ownsPfp = doesUserOwnPfp(
            favoritePfp,
            eligibleUser,
            nftContractOwnerWithAddrList
        );
        //If it is not found just remove from list
        if (!ownsPfp) {
            didUpdateFavList = true;
            favoritePfpList.splice(i, 1);
            logInfo(
                `Removed favorite pfp in contract: ${
                    favoritePfp.contractAddress
                } with token id: ${
                    favoritePfp.tokenId
                } for user [${userIdentifier(
                    eligibleUser
                )}] with wallet address:
                                ${eligibleUser.walletProvider?.address}`
            );
        }
    }
    //If the user still owns all favorites, do not reconcile anything
    if (!didUpdateFavList) {
        return;
    }
    updateOneUserDB(
        { _id: eligibleUser._id },
        {
            "walletProvider.favoritePfps": favoritePfpList,
        }
    );
}

/**
 * Check whether user own the pfp
 * @param pfpObject - Profile picture metadata
 * @param eligibleUser - Eligible user who may have pfp or list of favorite pfps that need to be reconcile
 * @param nftContractOwnerWithAddrList - list of contract owner and collection addr
 * @returns true or false if there is a matching pfp
 */
function doesUserOwnPfp(
    pfpObject: PfpMetadata,
    eligibleUser: IUser,
    nftContractOwnerWithAddrList: NftContractOwnerWithAddr[]
): boolean {
    const pfpContractAddr = pfpObject.contractAddress;
    for (const nftContractOwnerWithAddr of nftContractOwnerWithAddrList) {
        if (
            nftContractOwnerWithAddr.contractAddress?.toLowerCase() !==
            pfpContractAddr?.toLowerCase()
        ) {
            continue;
        }
        //If contract addresses match
        for (const owner of nftContractOwnerWithAddr.nftContractOwner) {
            const eligibleUserAddresses =
                getAllAssociatedWalletsForUser(eligibleUser);

            for (const userAddress of eligibleUserAddresses) {
                if (
                    userAddress.toLowerCase() !==
                    owner.ownerAddress?.toLowerCase()
                ) {
                    continue;
                }

                for (const tokenBalance of owner.tokenBalances) {
                    // Need to wrap Number onto hexadecimal representation to convert into decimal
                    const tokenId = getDecimalString(tokenBalance.tokenId);
                    if (
                        tokenId === pfpObject.tokenId &&
                        //Need toString and parseInt because API docs are not matching and we are being extra safe
                        parseInt(tokenBalance.balance.toString()) > 0
                    ) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

/**
 * Get decimal string
 * @param tokenId - Token id of the NFT.
 * @returns token id in a decimal string
 */
function getDecimalString(tokenId: string) {
    const isHexadecimal = tokenId.startsWith("0x0");
    if (isHexadecimal) {
        return Number(tokenId).toString();
    }

    return tokenId;
}
