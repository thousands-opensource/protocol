import { findUsersByQuery } from "@repo/schemas";
import { IUser } from "@repo/interfaces";
import { getOwnersForContract } from "@src/util/alchemyUtil";
import { getAllAssociatedWalletsForUser } from "@src/util/util";
import {
    AssetTransfersCategory,
    AssetTransfersResponse,
    AssetTransfersResult,
    NftContractOwner,
} from "alchemy-sdk";
import { getAddress } from "viem";
import { alchemyPolygon } from "..";
import {
    WalletAddressToTokenMap,
    TokenBalance,
    WildpassTokenIdToAddressMap,
    BadgeTypeToTokenOwners,
    TokenOwnersForContract,
} from "./interface";
import { getWildpassContractAddress } from "@src/util/environmentUtil";

// ***************** Data Preprocessing ***************** //

/**
 * Build wallet address to token mapping
 * @param allWalletAddressesSetToLookup - collection of unique wallet address
 * @param walletAddrToTokenMap - an empty mapping of wallet address:TokenBalance object
 * @param tokenContractAddress - Specifies a specific token contract to do lookup
 */
export async function buildAddressToTokensOwnedHm(
    allWalletAddressesSetToLookup: Set<string>,
    walletAddrToTokenMap: WalletAddressToTokenMap,
    tokenContractAddress: string
): Promise<void> {
    const owners: NftContractOwner[] = await getOwnersForContract(
        alchemyPolygon,
        tokenContractAddress
    );

    for (const owner of owners) {
        const ownerAddress = owner.ownerAddress.toLowerCase();
        //Add to the global addresses to look up
        allWalletAddressesSetToLookup.add(getAddress(ownerAddress));
        if (!walletAddrToTokenMap[ownerAddress]) {
            walletAddrToTokenMap[ownerAddress] = [];
        }

        const tokens: { [key: string]: TokenBalance } = {};
        for (const token of owner.tokenBalances) {
            const tokenId = parseInt(token.tokenId, 16).toString();
            tokens[tokenId] = {
                tokenId: tokenId,
                balance: token.balance,
            };
        }
        walletAddrToTokenMap[ownerAddress] = Object.values(tokens);
    }
}

/**
 * Consolidate a mapping of wallet address:TokenBalance object with new sets of unique users with their assicoated/additional wallet address
 * @param users - an array of User object
 * @param walletAddrToTokenMap - a mapping of wallet address:TokenBalance object
 * @returns a consolidated mapping of wallet address:TokenBalance object
 */
export function consolidateTokensMap(
    users: IUser[],
    walletAddrToTokenMap: WalletAddressToTokenMap
): WalletAddressToTokenMap {
    const consolidatedWalletAddrToTokenMap: WalletAddressToTokenMap = {};
    for (const user of users) {
        if (!user.walletProvider?.address) {
            continue;
        }
        // Get all wallet address including additional wallet address
        const allUserAddress = getAllAssociatedWalletsForUser(user);
        // Get all token that are in kept in each of the wallet address
        let allTokens: TokenBalance[] = [];
        for (let addr of allUserAddress) {
            addr = addr.toLowerCase();
            const tokens: TokenBalance[] = walletAddrToTokenMap[addr];
            if (!tokens || tokens.length === 0) {
                continue;
            }

            allTokens = allTokens.concat(tokens);
        }

        // Consolidate all the token into a mapping
        const consolidatedTokens: { [key: string]: TokenBalance } = {};
        for (const token of allTokens) {
            const tokenId = token.tokenId;
            if (!consolidatedTokens[tokenId]) {
                consolidatedTokens[tokenId] = {
                    tokenId: tokenId,
                    balance: token.balance,
                };
            } else {
                consolidatedTokens[tokenId] = {
                    ...consolidatedTokens[tokenId],
                    balance:
                        consolidatedTokens[tokenId].balance + token.balance,
                };
            }
        }

        // Store consolidate token mapping to primary wallet holder which contains checksum address
        consolidatedWalletAddrToTokenMap[user.walletProvider.address] =
            Object.values(consolidatedTokens);
    }
    return consolidatedWalletAddrToTokenMap;
}

/**
 * Get all users and paginate because there could be thousands
 * @param allWalletAddressesSetToLookup - collection of unique wallet address
 * @returns an unique user array
 */
export async function getAllUsers(
    allWalletAddressesSetToLookup: Set<string>
): Promise<IUser[]> {
    let usersArr: IUser[] = [];
    const batchSize = 500;
    const allWallerAddrs: string[] = Array.from(allWalletAddressesSetToLookup);
    const numBatches: number = Math.ceil(allWallerAddrs.length / batchSize);
    for (let i = 0; i < numBatches; i++) {
        const currBatch = allWallerAddrs.splice(0, batchSize);
        const query = {
            $or: [
                { "walletProvider.address": { $in: currBatch } },
                { "walletProvider.additionalWallets": { $in: currBatch } },
            ],
            // Must have a minted wildfile
            "walletProvider.wildfile.initialWildfileId": { $exists: true },
        };
        const eligibleUsers: IUser[] = await findUsersByQuery(query, {
            "walletProvider.address": 1,
            "discordProvider.id": 1,
            "discordProvider.discordTag": 1,
            "walletProvider.wildfile.initialWildfileId": 1,
            "walletProvider.additionalWallets": 1,
        });

        usersArr = usersArr.concat(eligibleUsers);
    }

    //Remove duplicates from users array - O(n) or worst case O(n log(n))
    const usersMap: { [discordId: string]: IUser } = {};
    for (const user of usersArr) {
        usersMap[user.discordProvider?.id] = user;
    }

    const uniqueUsersArr = Object.values(usersMap);

    return uniqueUsersArr;
}

/**
 * Build wildfile token id to wallet address mapping (wildpass OG holder)
 * @param allWalletAddressesSetToLookup - a collection of unique wallet address
 * @param wildpassTokenIdToAddressMap - a mapping of wildpass token id to wallet address
 */
export async function buildWildfileTokenIdToAdressHm(
    allWalletAddressesSetToLookup: Set<string>,
    wildpassTokenIdToAddressMap: WildpassTokenIdToAddressMap
) {
    const allAssetTransfers: AssetTransfersResult[] = [];
    //call alchemy api and get all asset transfers
    let keepFetching = true;
    let pageKey;
    while (keepFetching) {
        const res: AssetTransfersResponse =
            await alchemyPolygon.core.getAssetTransfers({
                fromBlock: "0x0",
                contractAddresses: [getWildpassContractAddress()],
                excludeZeroValue: true,
                category: [AssetTransfersCategory.ERC721],
                pageKey,
            });
        allAssetTransfers.push(...res.transfers);

        if (res.pageKey) {
            pageKey = res.pageKey;
        } else {
            keepFetching = false;
        }
    }

    //50,000 blocks after first wildpass minted (approx 1 day)
    const LAST_BLOCK_CONSIDERED_OG = 41781207;
    const transfersAfterLastOgBlock: AssetTransfersResult[] = [];

    //preprocess and find all the last to addresses before the last block
    for (const transfer of allAssetTransfers) {
        if (Number(transfer.blockNum) < LAST_BLOCK_CONSIDERED_OG) {
            allWalletAddressesSetToLookup.add(transfer.to);
            const tokenId = parseInt(transfer.tokenId);
            wildpassTokenIdToAddressMap[tokenId] = transfer.to;
        } else {
            transfersAfterLastOgBlock.push(transfer);
        }
    }

    //If there was a transfer with this token id after the last og block, remove that key value from the object
    for (const transfer of transfersAfterLastOgBlock) {
        const tokenId = parseInt(transfer.tokenId);
        allWalletAddressesSetToLookup.delete(
            wildpassTokenIdToAddressMap[tokenId]
        );
        delete wildpassTokenIdToAddressMap[tokenId];
    }
}

/**
 * Get specific badge type of token owners
 * @param badgeTypeToTokenOwnerMap - a mapping of badge type to token owner mapping
 * @param badgeType - a badge type
 * @returns specific badge type of token owners
 */
export function getTokenOwners(
    badgeTypeToTokenOwnerMap: BadgeTypeToTokenOwners,
    badgeType: string
): TokenOwnersForContract {
    return badgeTypeToTokenOwnerMap[badgeType];
}
