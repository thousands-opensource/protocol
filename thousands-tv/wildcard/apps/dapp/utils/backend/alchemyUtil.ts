import {
    Alchemy,
    GetNftsForOwnerOptions,
    GetOwnersForContractWithTokenBalancesResponse,
    Network,
    Nft,
    NftContractOwner,
    OwnedNft,
    OwnedNftsResponse,
} from "alchemy-sdk";
import {
    getAlchemyApiKey,
    getBackendAlchemyApiKey,
    getErc20StakingContractAddresses,
    getEthWildpassContractAddress,
    getMinStakedErc20TokensHeldToAllowEntryToAnEvent,
    getWildcardEventTicketContractAddress,
    getWildpassContractAddress,
    getWildpassTokensContractAddress,
} from "../environmentUtil";
import { supportedPfpCollections } from "../pfpCollectionUtil";
import { WILDCARD_SWAG_CONTRACT_ADDRESS } from "@/constants/constants";
import {
    ActivityItem,
    PfpCollection,
    ILeaderboardEvent,
} from "@repo/interfaces";
import { getAllAssociatedWalletsForUser } from "../userUtil";
import {
    DiscordStageDoc,
    findDiscordEventsByQuery,
    findLeaderboardsByQuery,
} from "@repo/schemas";
import { IUser } from "@repo/interfaces";
import { Provider } from "@wagmi/core";
import { GenericErc20StakingContract } from "@/contracts/genericErc20StakingContract";

const backendAlchemyApiKey = getBackendAlchemyApiKey();

// Ethereum Mainnet
const alchemyEthSettings = {
    apiKey: backendAlchemyApiKey,
    network: Network.ETH_MAINNET,
};
// Polygon Mainnet
const alchemyPolygonSettings = {
    apiKey: backendAlchemyApiKey,
    network: Network.MATIC_MAINNET,
};
// Base Mainnet
const alchemyBaseSettings = {
    apiKey: backendAlchemyApiKey,
    network: Network.BASE_MAINNET,
};
// Arbitrum Mainnet
const alchemyArbSettings = {
    apiKey: backendAlchemyApiKey,
    network: Network.ARB_MAINNET,
};
// Avax (Avalanche) Mainnet
const alchemyAvaxSettings = {
    apiKey: backendAlchemyApiKey,
    network: Network.AVAX_MAINNET,
};
// Create an Alchemy client
const ethAlchemy = new Alchemy(alchemyEthSettings);
const polyAlchemy = new Alchemy(alchemyPolygonSettings);
const baseAlchemy = new Alchemy(alchemyBaseSettings);
const arbAlchemy = new Alchemy(alchemyArbSettings);
const avaxAlchemy = new Alchemy(alchemyAvaxSettings);

/**
 * Get targeted network of the collection
 * @param contractAddress contract addresss of the collection
 * @returns network string
 */
export function getCollectionTargetedNetwork(contractAddress: string) {
    if (!contractAddress) {
        return "";
    }

    const pfpCollection = supportedPfpCollections.find(
        (pfpCollection) =>
            pfpCollection.contractAddress.toLowerCase() ===
            contractAddress.toLowerCase()
    );
    return pfpCollection?.network;
}

/**
 * Get the name of the network
 * @param network The name of the network
 * @returns Alchemy instance feature supported network
 */
export function getAlchemyProvider(network: Network) {
    switch (network) {
        case Network.ETH_MAINNET:
            return ethAlchemy;
        case Network.MATIC_MAINNET:
            return polyAlchemy;
        case Network.BASE_MAINNET:
            return baseAlchemy;
        case Network.ARB_MAINNET:
            return arbAlchemy;
        default:
            return undefined;
    }
}

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
 * Fetch sorted wildpass token ids that address owns
 * @param address
 * @returns Promise<number[]>
 */
export async function fetchSortedUserWildpassTokenIds(
    address: string
): Promise<number[]> {
    if (!backendAlchemyApiKey) {
        console.error(
            "Alchemy API Key env var not found. Please set the BACKEND_ALCHEMY_API_KEY environment variable"
        );
        return [];
    }

    const ownedWildpasses = await getNftsForOwner(polyAlchemy, address, [
        getWildpassContractAddress(),
    ]);
    const wildpasses = ownedWildpasses.ownedNfts;

    const sortedWildpassIds = wildpasses
        .map((nft) => Number(nft.tokenId))
        .sort((a, b) => a - b);
    return sortedWildpassIds;
}

/**
 * Fetches pfps that address owns
 * @param address - address to fetch pfp for
 * @param pageKey - pagination token that can be passed into another request to fetch the next NFTs
 * @returns OwnedNftsResponse[]
 */
export async function getOwnedPFPNfts(
    address: string,
    pageKey?: string,
    network?: Network
): Promise<OwnedNftsResponse> {
    if (!backendAlchemyApiKey) {
        console.error(
            "Alchemy API Key env var not found. Please set the BACKEND_ALCHEMY_API_KEY environment variable"
        );
        return { ownedNfts: [], totalCount: 0, validAt: { blockHash: "" } };
    }

    const contractAddresses = getAddressesFromSupportedCollectionsByNetwork(
        network || Network.ETH_MAINNET
    );

    const alchemyClient =
        network === Network.MATIC_MAINNET ? polyAlchemy : ethAlchemy;

    const ownedNfts = getNftsForOwner(
        alchemyClient,
        address,
        contractAddresses,
        pageKey
    );

    return ownedNfts;
}

/**
 * Fetches the owned tickets for a given address
 * @param address the address to fetch tickets for
 * @param network the network to fetch tickets for
 * @returns
 */
export async function getOwnedEventTickets(
    address: string
): Promise<OwnedNft[]> {
    if (!backendAlchemyApiKey) {
        console.error(
            "Alchemy API Key env var not found. Please set the BACKEND_ALCHEMY_API_KEY environment variable"
        );
        return [];
    }

    const ticketContractAddresses = getTicketContractAddresses();
    const ownedNfts: OwnedNft[] = [];
    let keepFetching = true;
    let pageKey;
    try {
        while (keepFetching) {
            const ownedNftResponses = await getNftsForOwner(
                polyAlchemy,
                address,
                ticketContractAddresses,
                pageKey
            );

            ownedNfts.push(...ownedNftResponses.ownedNfts);

            if (ownedNftResponses.pageKey) {
                pageKey = ownedNftResponses.pageKey;
            } else {
                keepFetching = false;
            }
        }

        return ownedNfts;
    } catch (e) {
        console.error(
            `Error getting nfts for owner ${address} & contract addresses: ${ticketContractAddresses}: `,
            e
        );
        return [];
    }
}

/**
 * Return contract address of the collection
 * @param pfpCollection contains contract address and type of the network is in
 * @returns collection of addresses
 */
function getAddresses(pfpCollection: PfpCollection) {
    return pfpCollection.contractAddress;
}

/**
 *  Return contract addresses from supported collections belonging to provided network
 * @param network - network to get addresses for
 * @returns string[]
 */
function getAddressesFromSupportedCollectionsByNetwork(
    network: Network
): string[] {
    return supportedPfpCollections
        .filter(
            (pfpCollection: PfpCollection) => pfpCollection.network === network
        )
        .map(getAddresses);
}

/**
 * Get all the ticket contract addresses
 * @returns string[]
 */
export function getTicketContractAddresses() {
    return [getWildcardEventTicketContractAddress()];
}

/**
 * Gets all the owners for a given NFT contract address and token ID.
 * @param alchemy - alchemy class to use
 * @param contractAddresses - The contract address of the NFT.
 * @param tokenId - Token id of the NFT.
 * @returns
 */
export async function getOwnersForNft(
    alchemy: Alchemy,
    contractAddress: string,
    tokenId: string
): Promise<string[]> {
    try {
        // Get the async iterable for the owner's NFTs.
        const nfts = await alchemy.nft.getOwnersForNft(
            contractAddress,
            tokenId
        );

        return nfts.owners;
    } catch (e) {
        console.error(
            `Error getting owner for nft from contract addresses - ${contractAddress}: `,
            e
        );
        return [];
    }
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
        console.error(
            `Error getting owner from contract addresses - ${contractAddress}: `,
            e
        );
        return [];
    }
}

type OwnerQty = { owner: string; balance: string };

function normalizeTokenId(tokenId: string): bigint {
  // supports "123" or "0x7b"
  return tokenId.startsWith("0x") ? BigInt(tokenId) : BigInt(tokenId);
}

export async function getOwnersWithQtyFor1155TokenId(
  alchemy: any,
  contractAddress: string,
  tokenId: string
): Promise<OwnerQty[]> {
  const out: OwnerQty[] = [];

  const targetId = normalizeTokenId(tokenId);

  let pageKey: string | undefined;
  let keepFetching = true;

  while (keepFetching) {
    const res = await alchemy.nft.getOwnersForContract(contractAddress, {
      withTokenBalances: true,
      ...(pageKey ? { pageKey } : {}),
    });

    // res.owners is an array of owner objects when withTokenBalances=true :contentReference[oaicite:2]{index=2}
    for (const o of res.owners ?? []) {
      const ownerAddress =
        o.ownerAddress ?? o.owner ?? o.address; // depending on SDK version

      const tokenBalances = o.tokenBalances ?? [];

      const match = tokenBalances.find((tb: any) => {
        const id = tb.tokenId ?? tb.id;
        if (id == null) return false;
        return normalizeTokenId(String(id)) === targetId;
      });

      if (match?.balance != null) {
        out.push({ owner: String(ownerAddress), balance: String(match.balance) });
      }
    }

    if (res.pageKey) pageKey = res.pageKey;
    else keepFetching = false;
  }

  return out;
}


/**
 * Determine if list of addresses contains an address that owns the NFT
 * @param ownerAddresses - array of address from user object
 * @param contractAddresses - The contract address of the NFT.
 * @param tokenId - Token id of the NFT.
 * @returns true or false whether list of addresses is the owner of the NFT
 */
export async function doesListOfAddressesOwnedNft(
    ownerAddresses: string[],
    contractAddress: string,
    tokenId: string
) {
    const targetedNetwork = getCollectionTargetedNetwork(contractAddress);
    if (!targetedNetwork) {
        return false;
    }

    const alchemyProvider = getAlchemyProvider(targetedNetwork);
    if (!alchemyProvider) {
        return false;
    }

    const ownersForNft = await getOwnersForNft(
        alchemyProvider,
        contractAddress,
        tokenId
    );

    for (const address of ownerAddresses) {
        if (
            ownersForNft
                .map((addr) => addr.toLowerCase())
                .includes(address.toLowerCase())
        ) {
            return true;
        }
    }

    return false;
}

/**
 * Fetches swag, wildpasses and pfps for a single address
 * @param address - address to retrieve
 */
export const fetchSwagWildpassesByAddressAndNetwork = async (
    address: string,
    networkId: string
) => {
    const wildpassContractAddress = getWildpassContractAddress();
    const ethWildpassContractAddress = getEthWildpassContractAddress();

    try {
        // console.log("testing");
        let alchemyClient = polyAlchemy;
        let contractAddresses = [
            wildpassContractAddress.toLowerCase(),
            WILDCARD_SWAG_CONTRACT_ADDRESS.toLowerCase(),
        ];
        if (networkId === "eth-mainnet") {
            alchemyClient = ethAlchemy;
            contractAddresses = [ethWildpassContractAddress.toLowerCase()];
        }

        const nfts = await getNftsForOwner(
            alchemyClient,
            address,
            contractAddresses
        );

        const wildpasses = nfts?.ownedNfts?.filter((nft) =>
            contractAddresses.includes(nft.contract.address.toLowerCase())
        );

        const swagPins = nfts?.ownedNfts?.filter((nft) => {
            return contractAddresses.includes(
                nft.contract.address.toLowerCase()
            );
        });
        // console.log("wildpasses", wildpasses[2]);

        // console.log("testing ends");
        // console.log("swagPins", swagPins);

        return {
            wildpasses,
            swagPins,
        };
    } catch (e) {
        console.log(`Error fetching nfts for address ${address}`, e);
        return {
            wildpasses: [],
            swagPins: [],
        };
    }
};

/**
 * Fetches swag, wildpasses and pfps for a single address
 * @param address - address to retrieve
 */
export const fetchSwagWildpassesForAddress = async (address: string) => {
    const ethWildpassContractAddress = getEthWildpassContractAddress();

    try {
        let pageKey: string | undefined = undefined;
        let ethNfts: OwnedNftsResponse = {
            ownedNfts: [],
            totalCount: 0,
            validAt: { blockHash: "" },
        };
        do {
            // Fetch NFTs for the current page
            const response = await getNftsForOwner(
                ethAlchemy,
                address,
                [ethWildpassContractAddress.toLowerCase()],
                pageKey
            );

            // Append NFTs to the consolidated result
            ethNfts.ownedNfts.push(...response.ownedNfts);
            ethNfts.totalCount = response.totalCount;
            ethNfts.validAt = response.validAt;

            // Update pageKey for the next iteration
            pageKey = response.pageKey;
        } while (pageKey);

        const wildpasses = ethNfts?.ownedNfts?.filter(
            (nft) =>
                nft.contract.address.toLowerCase() ===
                ethWildpassContractAddress.toLowerCase()
        );

        //Reset for reuse in getting Swag / Flair
        pageKey = undefined;
        let polygonNfts: OwnedNftsResponse = {
            ownedNfts: [],
            totalCount: 0,
            validAt: { blockHash: "" },
        };

        do {
            const response = await getNftsForOwner(
                polyAlchemy,
                address,
                [WILDCARD_SWAG_CONTRACT_ADDRESS],
                pageKey
            );

            // Append NFTs to the consolidated result
            polygonNfts.ownedNfts.push(...response.ownedNfts);
            polygonNfts.totalCount = response.totalCount;
            polygonNfts.validAt = response.validAt;

            // Update pageKey for the next iteration
            pageKey = response.pageKey;
        } while (pageKey);

        const swagPins = polygonNfts?.ownedNfts?.filter((nft) => {
            return (
                nft.contract.address.toLowerCase() ===
                WILDCARD_SWAG_CONTRACT_ADDRESS.toLowerCase()
            );
        });

        // console.log("swagPins", swagPins);

        return {
            wildpasses,
            swagPins,
        };
    } catch (e) {
        console.log(`Error fetching nfts for address ${address}`, e);
        return {
            wildpasses: [],
            swagPins: [],
        };
    }
};

/**
 * Returns the consolidated number of unique swag pins and balance owned by the user across all wallets
 * @param allSwagPins - All swag pins from all users not yet consolidated
 * @returns - The consolidated array of Alchemy OwnedNft (of all swagPins of all wallets)
 */
export const consolidateSwagPins = (allSwagPins: OwnedNft[]): OwnedNft[] => {
    if (!allSwagPins) {
        return [];
    }

    // Create a mapping from tokenId to consolidated OwnedNft
    let consolidatedSwagPinsMap: { [key: string]: OwnedNft } = {};

    allSwagPins.forEach((swagPin) => {
        if (consolidatedSwagPinsMap[swagPin.tokenId]) {
            // if tokenId already exists, add the balance to the existing object
            consolidatedSwagPinsMap[swagPin.tokenId] = {
                ...consolidatedSwagPinsMap[swagPin.tokenId],
                balance:
                    consolidatedSwagPinsMap[swagPin.tokenId].balance +
                    swagPin.balance,
            };
        } else {
            // add the new swagPin to the mapping
            consolidatedSwagPinsMap[swagPin.tokenId] = swagPin;
        }
    });
    return Object.values(consolidatedSwagPinsMap);
};

/**
 * Get swag pins from contract using alchemy api
 * @returns Nft[]
 */
export const fetchSwagPinsFromContract = async (): Promise<Nft[]> => {
    try {
        const swagPins = await polyAlchemy.nft.getNftsForContract(
            WILDCARD_SWAG_CONTRACT_ADDRESS
        );
        return swagPins.nfts;
    } catch (e) {
        console.log("Error fetching swag pin nft info using alchemy api:", e);
        return [];
    }
};

/**
 * Fetches swag, wildpasses and pfps for a user
 * @param user - user to fetch nfts for
 * @returns swag pins, wildpasses for user
 */
export const fetchSwagWildpassesForUser = async (
    user: IUser
): Promise<{
    wildpasses: OwnedNft[];
    swagPins: OwnedNft[];
}> => {
    let wildpasses: OwnedNft[] = [];
    let swagPins: OwnedNft[] = [];

    // get NFT's for all user's linked wallets
    const allUserAddresses = getAllAssociatedWalletsForUser(user);

    const nftRespPromises = allUserAddresses.map((address) => {
        return fetchSwagWildpassesForAddress(address || "");
    });

    const nft0 = await nftRespPromises[4];

    const nftsRespArray = await Promise.all(nftRespPromises);
    for (const nftResp of nftsRespArray) {
        wildpasses = wildpasses.concat(nftResp?.wildpasses || []);
        swagPins = swagPins.concat(nftResp?.swagPins || []);
    }

    swagPins = consolidateSwagPins(swagPins);

    return { wildpasses, swagPins };
};

/**
 * Fetches swag, wildpasses and pfps for a user
 * @param user - user to fetch nfts for
 * @returns swag pins, wildpasses for user
 */
export const fetchSwagWildpassesByUserAndNetwork = async (
    user: IUser,
    networkId: string
): Promise<{
    wildpasses: OwnedNft[];
    swagPins: OwnedNft[];
}> => {
    let wildpasses: OwnedNft[] = [];
    let swagPins: OwnedNft[] = [];

    // get NFT's for all user's linked wallets
    const allUserAddresses = getAllAssociatedWalletsForUser(user);

    const nftRespPromises = allUserAddresses.map((address) => {
        return fetchSwagWildpassesByAddressAndNetwork(address || "", networkId);
    });

    const nftsRespArray = await Promise.all(nftRespPromises);
    for (const nftResp of nftsRespArray) {
        wildpasses = wildpasses.concat(nftResp?.wildpasses || []);
        swagPins = swagPins.concat(nftResp?.swagPins || []);
    }

    swagPins = consolidateSwagPins(swagPins);

    return { wildpasses, swagPins };
};

/**
 * Fetches swag, wildpasses, pfps and user activity for a user
 * @dev - for resp. time opt. - uses similar logic as fetchSwagWildpassesForUser but also fetches user's activity items (via a promise.all)
 * @param user - user to fetch nfts for
 * @returns swag pins, wildpasses for user
 */
export const fetchSwagWildpassesAndUserActivityForUser = async (
    user: IUser
): Promise<{
    wildpasses: OwnedNft[];
    swagPins: OwnedNft[];
    userActivityWildevents: ActivityItem[];
}> => {
    let wildpasses: OwnedNft[] = [];
    let swagPins: OwnedNft[] = [];

    // get NFT's for all user's linked wallets
    const allUserAddresses = getAllAssociatedWalletsForUser(user);

    const nftRespPromises = allUserAddresses.map((address) => {
        return fetchSwagWildpassesForAddress(address || "");
    });

    // get primary wallet address
    const walletAddress = user?.walletProvider?.address;
    if (!walletAddress) {
        throw new Error("User does not have a wallet address");
    }

    // get swag pins, wildpasses, and user's wildevents activity items
    const [...nftsRespArray] = await Promise.all([...nftRespPromises]);

    for (const nftResp of nftsRespArray) {
        wildpasses = wildpasses.concat(nftResp?.wildpasses || []);
        swagPins = swagPins.concat(nftResp?.swagPins || []);
    }

    swagPins = consolidateSwagPins(swagPins);

    // NOTE: no longer usering ActivityItem[], implement ActivityLog[] instead if needed
    const userActivityWildevents: ActivityItem[] = [];

    return { wildpasses, swagPins, userActivityWildevents };
};

/**
 * Fetch all NFTs for an owner from specified contract addresses on Ethereum.
 * @param ownerAddress - The address of the NFT owner.
 * @param contractAddresses - The contract addresses to query.
 * @returns A consolidated OwnedNftsResponse with all NFTs owned by the address.
 */
export async function fetchNftsForOwnerEth(
    ownerAddress: string,
    contractAddresses: string[]
): Promise<OwnedNftsResponse | null> {
    if (!contractAddresses || contractAddresses.length === 0) {
        console.log("No contract addresses provided to fetch NFTs for owner");
        return null;
    }

    if (!ownerAddress) {
        console.log("No owner address provided to fetch NFTs for owner");
        return null;
    }

    let pageKey: string | undefined = undefined;
    let allOwnedNfts: OwnedNftsResponse = {
        ownedNfts: [],
        totalCount: 0,
        validAt: { blockHash: "" },
    };

    try {
        do {
            // Fetch NFTs for the current page
            const response = await getNftsForOwner(
                ethAlchemy,
                ownerAddress,
                contractAddresses,
                pageKey
            );

            // Append NFTs to the consolidated result
            allOwnedNfts.ownedNfts.push(...response.ownedNfts);
            allOwnedNfts.totalCount = response.totalCount;
            allOwnedNfts.validAt = response.validAt;

            // Update pageKey for the next iteration
            pageKey = response.pageKey;
        } while (pageKey); // Continue while there's a next page

        return allOwnedNfts;
    } catch (error) {
        console.error(
            `Error fetching NFTs for owner ${ownerAddress} from contracts ${contractAddresses} on page key ${pageKey}: `,
            error
        );
        // Return null in case of an error
        return null;
    }
}

/**
 * Fetch all NFTs for an owner from specified contract addresses on Polygon.
 * @param ownerAddress - The address of the NFT owner.
 * @param contractAddresses - The contract addresses to query.
 * @returns A consolidated OwnedNftsResponse with all NFTs owned by the address.
 */
export async function fetchNftsForOwnerPolygon(
    ownerAddress: string,
    contractAddresses: string[]
): Promise<OwnedNftsResponse | null> {
    if (!contractAddresses || contractAddresses.length === 0) {
        console.log("No contract addresses provided to fetch NFTs for owner");
        return null;
    }

    if (!ownerAddress) {
        console.log("No owner address provided to fetch NFTs for owner");
        return null;
    }

    let pageKey: string | undefined = undefined;
    let allOwnedNfts: OwnedNftsResponse = {
        ownedNfts: [],
        totalCount: 0,
        validAt: { blockHash: "" },
    };

    try {
        do {
            // Fetch NFTs for the current page
            const response = await getNftsForOwner(
                polyAlchemy,
                ownerAddress,
                contractAddresses,
                pageKey
            );

            // Append NFTs to the consolidated result
            allOwnedNfts.ownedNfts.push(...response.ownedNfts);
            allOwnedNfts.totalCount = response.totalCount;
            allOwnedNfts.validAt = response.validAt;

            // Update pageKey for the next iteration
            pageKey = response.pageKey;
        } while (pageKey); // Continue while there's a next page

        return allOwnedNfts;
    } catch (error) {
        console.error(
            `Error fetching NFTs for owner ${ownerAddress} from contracts ${contractAddresses} on page key ${pageKey}: `,
            error
        );
        // Return null in case of an error
        return null;
    }
}

/**
 * Fetch all NFTs for an owner from specified contract addresses on Base.
 * @param ownerAddress - The address of the NFT owner.
 * @param contractAddresses - The contract addresses to query.
 * @returns A consolidated OwnedNftsResponse with all NFTs owned by the address.
 */
export async function fetchNftsForOwnerBase(
    ownerAddress: string,
    contractAddresses: string[]
): Promise<OwnedNftsResponse | null> {
    if (!contractAddresses || contractAddresses.length === 0) {
        console.log("No contract addresses provided to fetch NFTs for owner");
        return null;
    }

    if (!ownerAddress) {
        console.log("No owner address provided to fetch NFTs for owner");
        return null;
    }

    let pageKey: string | undefined = undefined;
    let allOwnedNfts: OwnedNftsResponse = {
        ownedNfts: [],
        totalCount: 0,
        validAt: { blockHash: "" },
    };

    try {
        do {
            // Fetch NFTs for the current page
            const response = await getNftsForOwner(
                baseAlchemy,
                ownerAddress,
                contractAddresses,
                pageKey
            );

            // Append NFTs to the consolidated result
            allOwnedNfts.ownedNfts.push(...response.ownedNfts);
            allOwnedNfts.totalCount = response.totalCount;
            allOwnedNfts.validAt = response.validAt;

            // Update pageKey for the next iteration
            pageKey = response.pageKey;
        } while (pageKey); // Continue while there's a next page

        return allOwnedNfts;
    } catch (error) {
        console.error(
            `Error fetching NFTs for owner ${ownerAddress} from contracts ${contractAddresses} on page key ${pageKey}: `,
            error
        );
        // Return null in case of an error
        return null;
    }
}

/**
 * Fetch all NFTs for an owner from specified contract addresses on Avax (Avalanche).
 * @param ownerAddress - The address of the NFT owner.
 * @param contractAddresses - The contract addresses to query.
 * @returns A consolidated OwnedNftsResponse with all NFTs owned by the address.
 */
export async function fetchNftsForOwnerAvax(
    ownerAddress: string,
    contractAddresses: string[]
): Promise<OwnedNftsResponse | null> {
    if (!contractAddresses || contractAddresses.length === 0) {
        console.log("No contract addresses provided to fetch NFTs for owner");
        return null;
    }

    if (!ownerAddress) {
        console.log("No owner address provided to fetch NFTs for owner");
        return null;
    }

    let pageKey: string | undefined = undefined;
    let allOwnedNfts: OwnedNftsResponse = {
        ownedNfts: [],
        totalCount: 0,
        validAt: { blockHash: "" },
    };

    try {
        do {
            // Fetch NFTs for the current page
            const response = await getNftsForOwner(
                avaxAlchemy,
                ownerAddress,
                contractAddresses,
                pageKey
            );

            // Append NFTs to the consolidated result
            allOwnedNfts.ownedNfts.push(...response.ownedNfts);
            allOwnedNfts.totalCount = response.totalCount;
            allOwnedNfts.validAt = response.validAt;

            // Update pageKey for the next iteration
            pageKey = response.pageKey;
        } while (pageKey); // Continue while there's a next page

        return allOwnedNfts;
    } catch (error) {
        console.error(
            `Error fetching NFTs for owner ${ownerAddress} from contracts ${contractAddresses} on page key ${pageKey}: `,
            error
        );
        // Return null in case of an error
        return null;
    }
}

/**
 * Fetches ERC20 token balances for a given owner address from specified contract addresses using the provided Alchemy instance.
 * @param alchemy - The Alchemy instance to use.
 * @param ownerAddress - The address of the token owner.
 * @param contractAddresses - The ERC20 contract addresses to query.
 * @returns An array of token balances.
 */
export async function getErc20TokenBalances(
    alchemy: Alchemy,
    ownerAddress: string,
    contractAddresses: string[]
): Promise<any[]> {
    try {
        const response = await alchemy.core.getTokenBalances(
            ownerAddress,
            contractAddresses
        );
        return response.tokenBalances;
    } catch (error) {
        console.error(
            `Error fetching ERC20 token balances for owner ${ownerAddress} with contract addresses ${contractAddresses}: `,
            error
        );
        return [];
    }
}

/**
 * Fetch ERC20 token balances using the baseAlchemy instance.
 * @param ownerAddress - The address of the token owner.
 * @param contractAddresses - The ERC20 contract addresses to query.
 * @returns An array of token balances.
 */
export async function getBaseErc20TokenBalances(
    ownerAddress: string,
    contractAddresses: string[]
): Promise<any[]> {
    return getErc20TokenBalances(baseAlchemy, ownerAddress, contractAddresses);
}

/**
 * Fetch ERC20 token balances using the ethAlchemy instance.
 * @param ownerAddress - The address of the token owner.
 * @param contractAddresses - The ERC20 contract addresses to query.
 * @returns An array of token balances.
 */
export async function getEthErc20TokenBalances(
    ownerAddress: string,
    contractAddresses: string[]
): Promise<any[]> {
    return getErc20TokenBalances(ethAlchemy, ownerAddress, contractAddresses);
}

/**
 * Fetch wildcard tokens count.
 * @param ownerAddress - The address of the NFT owner.
 * @returns A consolidated OwnedNftsResponse with all NFTs owned by the address.
 */
export async function getWildcardTokens(ownerAddress: string) {
    const contractAddresses = [getWildpassTokensContractAddress()];

    try {
        const owned = await getBaseErc20TokenBalances(
            ownerAddress,
            contractAddresses
        );
        return owned;
    } catch (error) {
        console.error(
            `Error fetching NFTs for owner ${ownerAddress} from contracts ${contractAddresses}: `,
            error
        );
        return 0;
    }
}

export async function hasSufficientStakedTokens(
    walletAddresses: string[]
): Promise<boolean> {
    const minStakedTokens = BigInt(
        getMinStakedErc20TokensHeldToAllowEntryToAnEvent().toString()
    );
    const stakingAddresses = getErc20StakingContractAddresses();

    if (minStakedTokens === BigInt(-1) || stakingAddresses.length === 0) {
        return false;
    }

    for (const stakingAddress of stakingAddresses) {
        const stakingContract = new GenericErc20StakingContract(stakingAddress);
        let totalStakedForContract = BigInt(0);

        for (const userAddress of walletAddresses) {
            try {
                const stakedAmount = await stakingContract.getErc20Balance(
                    userAddress
                );
                totalStakedForContract =
                    totalStakedForContract + BigInt(stakedAmount.toString());

                // Early exit
                if (totalStakedForContract >= minStakedTokens) {
                    return true;
                }
            } catch (error) {
                console.error(
                    `Error checking staked balance at ${stakingAddress} for ${userAddress}:`,
                    error
                );
            }
        }

        // Compare sum of staked tokens across a user's addresses with the minimum required
        if (totalStakedForContract >= minStakedTokens) {
            return true;
        }
    }

    return false;
}
