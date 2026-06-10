import { ISwagSet } from "@repo/interfaces";

export interface BadgeIdToSwagSet {
    [badgeId: string]: ISwagSet;
}

export interface BadgeTypeToTokenOwners {
    [token: string]: TokenOwnersForContract;
}
export interface TokenOwnersForContract {
    contractAddress: string;
    walletAddressToTokenMap: WalletAddressToTokenMap;
}

export interface WalletAddressToTokenMap {
    [walletAddress: string]: TokenBalance[];
}

export interface TokenBalance {
    tokenId: string;
    balance: string;
}

export interface WildpassTokenIdToAddressMap {
    [wildpassId: number]: string;
}

export enum BadgeType {
    SWAGSET = "swagSet",
    WILDPASS = "wildpass",
    COMMUNITY = "community",
}

export enum OGBadgeId {
    OG_MINTER = "og-minter",
}

export enum WildpassHolder {
    WILDPASS_HOLDER = "wildpass-holder",
    FULL_SPECTRUM_WILDPASS_HOLDER = "full-spectrum-wildpass-holder",
}

export enum SwagSetCollection {
    MOTM = "melee-on-the-meteor",
    COMMUNITY_GATHERINGS = "community-gatherings",
    ROAD_TO_EX1 = "road-to-ex1",
    PARTNER_ACTIVATION = "partner-activation",
    ULTIMATE_FAN = "ultimate-fan",
    MOODS_OF_BOLGAR = "moods-of-bolgar",
    SPAWN_OF_SPORD = "spawn-of-spord",
}

export enum CommunityBadgeId {
    ATTENDEE = "attendee",
    PLAYTESTER = "playtester",
    KUDO_RECEIVER = "kudo-receiver",
}
