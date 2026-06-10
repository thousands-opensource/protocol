import { logError } from "@src/logger";
import {
    Alchemy,
    GetNftsForOwnerOptions,
    GetOwnersForContractWithTokenBalancesResponse,
    Network,
    NftContractOwner,
    OwnedNft,
    OwnedNftsResponse,
} from "alchemy-sdk";
import {
    getAlchemyApiKey,
    getWildcardEventTicketContractAddress,
    getWildfileContractAddress,
} from "./environmentUtil";
import { alchemyEth, alchemyPolygon } from "..";

/**
 * Handles fetching all of a users nfts from specified contract address (and iterating through if there are more to fetch on next page of alchemy response)
 * @param alchemy - alchemy class to use
 * @param ownerAddress - address to fetch nfts for
 * @param contractAddresses - contract addresses to get nfts from
 * @returns OwnedNftsResponse
 */
export async function getNftsForOwner(
    alchemy: Alchemy,
    ownerAddress: string,
    contractAddresses: string[],
    pageKey?: string
): Promise<OwnedNftsResponse> {
    const defaultOwnedNfts: OwnedNftsResponse = {
        ownedNfts: [],
        totalCount: 0,
        validAt: { blockHash: "" },
    };
    // pageKey=undefined - run the first batch
    // pageKey="end" - reached end of the page
    // return default owned nft object if no contract addresses are provided in array or empty string
    if (contractAddresses.length < 1 || pageKey === "end") {
        return defaultOwnedNfts;
    }

    try {
        let options: GetNftsForOwnerOptions = {
            contractAddresses: contractAddresses,
        };

        if (pageKey) {
            options = { ...options, pageKey };
        }

        // Get OwnedNftsResponse contains owner's NFTs.
        const ownedNfts = await alchemy.nft.getNftsForOwner(
            ownerAddress,
            options
        );

        return ownedNfts;
    } catch (e) {
        console.log(
            `Error getting nfts from contract addresses - ${contractAddresses}: `,
            e
        );
        return defaultOwnedNfts;
    }
}

/**
 * Fetches all of the nfts owned by a user
 * @param address owner wallet address
 * @param contractAddresses contract addresses to get nfts from
 * @param network network to use
 * @returns an array of owned nfts
 */
export async function getOwnedNfts(
    address: string,
    contractAddresses: string[],
    network?: Network,
    pageKey?: string
): Promise<OwnedNft[]> {
    const alchemyKey = getAlchemyApiKey();
    const ownedNfts: OwnedNft[] = [];

    if (!alchemyKey) {
        logError(
            "Alchemy API Key env var not found. Please set the ALCHEMY_API_KEY environment variable"
        );
        return ownedNfts;
    }

    const alchemyClient =
        network === Network.MATIC_MAINNET ? alchemyPolygon : alchemyEth;

    // Get the async iterable for the owner's NFTs.
    const ownedNftResponses = await getNftsForOwner(
        alchemyClient,
        address,
        contractAddresses,
        pageKey
    );

    return ownedNftResponses.ownedNfts;
}

/**
 * Handles fetching all of a owners of a specified contract address (and iterating through if there are more to fetch on next page of alchemy response)
 * @param alchemy - alchemy class to use
 * @param contractAddress - contract address to get owners for
 * @returns OwnedNft[]
 */
export async function getOwnersForContract(
    alchemy: Alchemy,
    contractAddress: string
): Promise<NftContractOwner[]> {
    let keepFetching = true;
    let pageKey;
    const nftOwners: NftContractOwner[] = [];
    try {
        while (keepFetching) {
            // Get the async iterable for the owner's NFTs.
            const nfts: GetOwnersForContractWithTokenBalancesResponse =
                await alchemy.nft.getOwnersForContract(contractAddress, {
                    withTokenBalances: true,
                    pageKey,
                });

            nftOwners.push(...nfts.owners);

            if (nfts.pageKey) {
                pageKey = nfts.pageKey;
            } else {
                keepFetching = false;
            }
        }

        return nftOwners;
    } catch (e) {
        logError(
            `Error getting owner from contract addresses - ${contractAddress}: `,
            e
        );
        return [];
    }
}

export interface WalletAddressToUserIdMap {
    [walletAddress: string]: string;
}
