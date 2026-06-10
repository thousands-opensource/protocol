import { TokenMetadata } from "@repo/interfaces";
import { Network, NftContractOwner } from "alchemy-sdk";
import { BigNumber } from "ethers";

// environment where the bot is running
export enum Environment {
    LOCAL = "local",
    TEST = "test",
    PROD = "prod",
    CONDUIT = "conduit",
}

export interface GasPrice {
    maxFeePerGas: BigNumber;
    maxPriorityFeePerGas: BigNumber;
}

/**
 * Result from calling functions on the smart contracts
 */
export interface ContractResult {
    // whether the call succeeded
    success: boolean;
    // data if any
    data?: any;
    // transaction hash
    txHash?: string;
    // error message if necessary
    err?: string;
}

// Token metadata from OpenSea, for example:
// {
//     "image": "https://i.seadn.io/gcs/files/913f8d706f9978138835f9169c92b207.png?w=500&auto=format",
//     "name": "Bear Paw",
//     "description": "A bear paw",
//     "external_link": null,
//     "animation_url": null,
//     "traits": [
//         {
//             "trait_type": "color",
//             "value": "brown",
//             "display_type": null,
//             "max_value": null,
//             "trait_count": 0,
//             "order": null
//         },
//         {
//             "trait_type": "fingers",
//             "value": "4",
//             "display_type": null,
//             "max_value": null,
//             "trait_count": 0,
//             "order": null
//         }
//     ]
// }

export const EMPTY_TOKEN_METADATA: TokenMetadata = {
    image: "",
    name: "",
    description: "",
    external_link: "",
    animation_url: "",
    traits: [],
};

// Wildevent Structures

export interface Wildevent {
    wildeventId: number;
    eventType: string;
    attestorWildfileId: number;
    wildfileIds: number[];
    data: Uint8Array;
}

export interface DiscordEventWildevent {
    name: string;
    eventType: string;
    description: string;
    durationMinutes: number;
}

export interface DiscordEventAttendanceWildevent {
    discordEventWildeventId: number;
    wildfileMinutesAttended: number[];
}

export interface LinkedSocialWildevent {
    platform: string;
}

export interface KudosWildevent {
    reason: string;
    awardedByWildfileId: number;
}

export interface AirdropWildevent {
    tokenId: number;
    contractAddress: string;
    chainId: number;
    reason: string;
    wildeventId: number;
}
export interface ArchivedLeaderboardWildevent {
    leaderboardId: string;
    pageNum: number;
    scores: number[];
}

export interface DiscordToUserIdMap {
    [userId: string]: number;
}

export interface PfpCollection {
    collectionName: string;
    contractAddress: string;
    network: Network;
}

export interface NftContractOwnerWithAddr {
    nftContractOwner: NftContractOwner[];
    contractAddress: string;
}

/**
 * Wildfile Ids by owner (via Multicall)
 */
export interface WildfileIdByAddress {
    wildfileId: number;
    walletAddress: string;
}
