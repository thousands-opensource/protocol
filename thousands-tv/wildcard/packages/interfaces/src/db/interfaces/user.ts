import { Types } from "mongoose";
import { PostedWildevent } from "../dbShared";

export const USERS = "users";
export const LEGACY_USERS = "legacy-users";

export enum AccountProviderType {
    TWITTER = "twitter",
    TWITCH = "twitch",
    DISCORD = "discord",
    GOOGLE = "google",
    WALLET = "wallet", // web3 wallet
    BEAMABLE = "beamable", // the game platform (Beamable account)
    KICK = "kick",
}

// Based on the user's role, user's will have different permissions which are predefined and enforced by the role types
export enum UserRole {
    SPECTATOR = "spectator", // least permissions
    COMPETITOR = "competitor", // if the user sign in via the dame
    ORGANIZER = "organizer", // admin required
    DEVELOPER = "developer",
    ADMIN = "admin", // admin
    BROADCASTER = "broadcaster",
    GUESTBROADCASTER = "guestbroadcaster",
    MODERATOR = "moderator",
    STREAMER = "streamer",
}

export enum AccountStatus {
    ACTIVE = "active",
    SUSPENDED = "suspended",
    DELETED = "deleted",
}

export interface LinkedFarcaster {
    fid: string;
    username: string;
    message: string;
    signature: string;
    nonce: string;
    wildevent?: PostedWildevent;
}
export enum LinkedAccountProvider {
    TWITTER = "twitter",
    TWITCH = "twitch",
    DISCORD = "discord",
    GOOGLE = "google",
    BEAMABLE = "beamable",
    WALLET = "web3-wallet",
}

export enum KycStatus {
    NOTSTARTED = "notstarted",
    STARTED = "started",
    PENDING = "pending",
    FAILED = "failed",
    COMPLETED = "completed",
}

export interface AccountProvider {
    id: string;
    name: string;
    image?: string;
    email?: string;
}

export interface GoogleAccountProvider extends AccountProvider {}

export interface DiscordAccountProvider extends AccountProvider {
    discordTag?: string;
}

export interface TwitchAccountProvider extends AccountProvider {}

export interface KickAccountProvider extends AccountProvider {}

export interface TwitterAccountProvider extends AccountProvider {}

export interface FarcasterAccountProvider extends AccountProvider {}
export interface BeamableAccountProvider extends AccountProvider {
    isVerified: boolean;
    pid?: string;
}

export interface WalletAccountProvider {
    address: string;
    additionalWallets?: string[];
    wildfile?: Wildfile;
    favoritePfps?: PfpMetadata[];

    pfp?: PfpMetadata;
}

export interface Wildfile {
    tokenId?: number;
    initialWildfileId?: number;
    mintTxn?: string; // txn where we minted a Wildfile on behalf of the user
    mintTxnTime?: Date; // time of mint event
    mintType?: string; // type of mint function used for wildfile (i.e. public mint, allowlist mint, wildpass mint)
    mintWildpassTokenId?: number; // for wildfiles minted using wildpass,the token id of the wildpass used
    wildpassAllowlistWalletAddress?: string; // address registered for the Wildpass allowlist (no signature required)
}

export interface PfpMetadata {
    tokenId: string;
    contractAddress: string;
    chainId: number;
    name: string;
    imageUrl: string;
    accountProviderType?: AccountProviderType;
}

export interface UserAuthenticator {
    isEnabled: boolean;
    appEnabled: boolean;
    appSecretKey: string;
    appMethod: string;
    mfaStepCompleted: boolean;
    mfaStepCompletedAt: Date;
}

export interface UserAnalytics {
    ipAddress: string; // ipv4 or ipv6 address
    lastPasswordResetOn?: Date;
    lastLogin?: Date;
    lastLoginIp?: string;
    lastLoginUserAgent?: string;
}

export interface UserPreferences {
    displayName?: string;
    activePfpImageUrl?: AccountProviderType;
    avatarThemeColor?: string;
    showLinkedSocials: boolean;
    sendNotifications: boolean;
    primarylNotificationEmail?: string;
    defaultProfileImageUrl?: string;
}

export interface UserKyc {
    status?: KycStatus;
    sessionId?: string;
    depositAddress?: string;
}

export interface IUser {
    // providers
    preferredProvider: AccountProviderType;
    walletProvider?: WalletAccountProvider;
    discordProvider?: DiscordAccountProvider;
    googleProvider?: GoogleAccountProvider;
    beamableProvider?: BeamableAccountProvider;
    twitchProvider?: TwitchAccountProvider;
    kickProvider?: KickAccountProvider;
    twitterProvider?: TwitterAccountProvider;
    farcasterProvider?: FarcasterAccountProvider;

    roles: UserRole[];
    status: AccountStatus;
    preferences: UserPreferences;
    latestFeatureRelease?: number;
    authenticator?: UserAuthenticator;
    analytics?: UserAnalytics;
    originalUserId?: Types.ObjectId; // reference to original user id
    accumulatedPersonalCredits?: number; // accumulated total credits earned by the user
    competitorStripeId?: string;
    autoAcceptOffers?: boolean | null;
    bannedOn?: Date | null;
    payoutMethod?: "USD" | "USDC";
    thousandsXp?: number;
    draftPicksEarned?: number;
    draftPicksConsumed?: number;
    kyc?: UserKyc;
    stripeConnectedAccountEnabled?: boolean;

    // New fields for suspension
    isSuspended?: boolean; // Flag indicating if the user is suspended
    suspendedUntil?: Date; // Date until which the user is suspended

    // mongo fields
    createdAt?: Date;
    updatedAt?: Date;
    _id?: Types.ObjectId;
    __v?: number;
}

export type WildfileMintType =
    | "public"
    | "allowlist"
    | "wildpass"
    | "forbidden";

export interface WildfileMintDetails {
    wildfileMintType: WildfileMintType | undefined;
    wildpassTokenIdForMint: number | undefined;
    wildpassAlreadyUsed: boolean | undefined;
}

// Discord Role Interface derived from Discord.js Role Type
export interface DiscordRole {
    name: string;
    discordId: string;
    guildId: string;
    rawPosition: number;
    color: number;
    hexColor: string;
    id: string;
}
