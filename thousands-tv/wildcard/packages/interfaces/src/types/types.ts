import { Network } from "alchemy-sdk";

//-----Constants-----

export const LEADERBOARD_PAGE_SIZE = 10;
export const FIRST_FARCASTER_MINT_ID = "kick-off";
export const SPORD_FARCASTER_MINT_ID = "spord-mint";

//-----Wildevent types-----

export const LINKED_SOCIAL = "LinkedSocial";
export const DISCORD_EVENT = "DiscordEvent";
export const DISCORD_EVENT_ATTENDANCE = "DiscordEventAttendance";
export const KUDOS_EVENT = "Kudos";
export const AIRDROP_EVENT = "Airdrop";
export const ARCHIVED_LEADERBOARD = "ArchivedLeaderboard";
export const PFP_EVENT = "Pfp";
export const LINK_WALLET_EVENT = "LinkedWallet";

//-----MultiCall-----
export interface multicallResult {
    status: string;
    result?: any;
    error?: any;
}

//-------------------
export interface PfpCollection {
    contractAddress: string;
    collectionName: string;
    network: Network;
}

//-----Airdrop Types--------------
export interface LuckyWinner {
    userId: string; // FanId in Thousands
    timestamp: number;
}

export interface AirdropRequest {
    eventId: string;
    matchId: string;
    giftId: string; // ID of the NFT
    winners: LuckyWinner[]; // List of winners
}
