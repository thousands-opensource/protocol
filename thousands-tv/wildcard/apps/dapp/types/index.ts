import { ContractTransaction } from "ethers";
import { StageStrategy, LocalStageStream } from "amazon-ivs-web-broadcast";
import { Types } from "mongoose";
import {
    IEvent,
    INotification,
    ISeries,
    ISkybox,
    IStage,
} from "@repo/interfaces";
import { ChannelEntity } from "@pubnub/react-chat-components";

// Wildcard Color Trait Interface
export interface ColorObject {
    colorName: string;
    hexValue: string;
}

/**
 * Result from calling functions on a contract
 */
export interface ContractResult {
    // whether the call succeeded
    success: boolean;
    // data returned from the contract
    data?: any;
    // transaction (if any)
    tx?: ContractTransaction;
    // error message if necessary
    err?: string;
    // how much the transaction cost (in MATIC)
    txnCost?: number;
}

export interface WildcardAccountsApiResponse {
    success: boolean;
    data?: any;
    message?: string;
}

export interface PaginationInfo {
    totalItems: number;
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
}
export interface INotificationResponses {
    success: boolean;
    data: INotification[];
    message: string;
    pagination?: PaginationInfo; // Optional pagination information
}

export type ClientSideMediaDeviceInfo = MediaDeviceInfo;

export interface CustomMediaDeviceInfo {
    label: string;
    value: string;
}

export interface CustomStageStrategy extends StageStrategy {
    audioTrack: LocalStageStream | null;
    videoTrack: LocalStageStream | null;
    updateTracks: (
        newAudioTrack: LocalStageStream | null,
        newVideoTrack: LocalStageStream | null
    ) => void;
}

export interface IdleEvent {
    chatActionGuid: string;
    name: ConsumableCommandAction;
    timestamp: number;
    cost: number;
    duration: number;
    perTick: number;
    isPersonalEvent: boolean;
}

export enum ConsumableCommandAction {
    FIREWORKS = "fireworks",
    CHEER = "cheer",
    CONFETTI = "confetti",
    JOINYES = "joinyes",
    JOINNO = "joinno",
    JOIN = "join",
    BUTTON_11X = "BUTTON_1.1X",
    BUTTON_15X = "BUTTON_1.5X",
    BUTTON_20X = "BUTTON_2.0X",
}

export interface WildcardActionMetaData {
    title: string;
    command: ConsumableCommandAction;
    credit: number;
    icon: string;
    description: string;
    joinable: boolean;
}

export interface NotificationData {
    recipientUserId: Types.ObjectId | string;
    subject: string;
    body: string;
    status?: string;
    priority?: string;
    sentAt?: Date;
}

export interface RouteConfigUrlParams {
    [key: string]: string;
}

export enum THOUSANDS_SERIES_NAME {
    PRE_ALPHA = "Pre-Alpha",
    ALPHA_SERIES = "Alpha Series",
}

export interface SendCommandResponse {
    Success: boolean;
    Err: string;
    Timestamp: number;
    RolledUpPersonalCredits: number;
    IdleEvent: IdleEvent | undefined;
    IdleEvents: IdleEvent[] | undefined;
}

export interface TextEvent {
    id: string;
    name: string;
    channels: ChannelEntity[];
}

export type RequestResponse = {
    success: boolean;
    message: string;
    error: string;
};

export interface SeriesToStages {
    id: string;
    stages: IStage[];
    seriesName: string;
}

export interface SeriesToEvents extends ISeries {
    events: EventsToStages[];
}

export interface EventsToStages extends IEvent {
    stages: IStage[];
}

export interface EventsToStagesWithSeriesImages extends EventsToStages {
    seriesImageUrl: string;
    seriesBackgroundImageUrl: string;
}

export interface UserServerPreferences {
    serverPrimaryLogoUrl: string;
    serverCode: string;
}

export enum RecognitionComponent {
    WILDPASS = "wildpass",
    FLAIR = "flairset",
}

export interface BoostTrigger {
    timestamp: Date;
    userId: string;
    creditsLeft: number;
    userName: string;
    pfpUrl: string;
    boostType: string;
    boostLevel: number;
    boostProgress: number;
    personalProgressStartTime: number;
    personalProgressTotalDelayTime: number;
}

export interface VoteOptionWithVotes {
    name: string;
    numberOfVotes: number;
}

export interface VoteUpdate {
    voteTitle: string;
    voteTimeSeconds: number;
    numberOfVotes: number;
    voteResults: VoteOptionWithVotes[];
    isFinalUpdate: boolean;
}

export interface BoostSignalMessage {
    boostEventType: string;
    roundNumber: number;
    eventId: string;
    redBlueRatio?: number;
    redComboMultiplier?: number;
    blueComboMultiplier?: number;
    totalRedBoosts: number;
    totalBlueBoosts: number;
    eventMatchStartTime?: number;
    boosts?: BoostTrigger[];
    averageRedBoost?: number;
    averageBlueBoost?: number;
    totalUniqueUserCount?: number;
    leaders?: LeaderCondensed[];
    voteUpdate?: VoteUpdate;
    skyboxes?: ISkybox[];
    skyboxEmojis?: SkyboxEmoji[];
}

export interface DirectMessage {
    data: PubnubBase | SkyboxInvite | TokenRewardMessage;
    type: DIRECT_MESSAGE_EVENT_TYPE;
}

export interface PubnubBase {
    pubnubToken: string;
}

export interface SkyboxInvite {
    skyboxInviteId: string;
    skyboxName: string;
    skyboxOwnerId: string;
}

export interface TokenRewardMessage {
    message: string;
}

export enum DIRECT_MESSAGE_EVENT_TYPE {
    PurchaseSkybox = "PurchaseSkybox",
    InviteUser = "InviteUser",
    AcceptInvite = "AcceptInvite",
    RemoveUser = "RemoveUser",
    Message = "Message",
}

export enum BOOST_EVENT_TYPE {
    START_MATCH = "StartMatch",
    END_MATCH = "EndMatch",
    BOOSTS_TRIGGERED = "BoostsTriggered",
    PERIODIC_UPDATE = "PeriodicUpdate",
    SET_WINNER = "SetWinner",
    START_VOTE = "StartVote",
    PERIODIC_UPDATE_VOTE = "VoteUpdate",
    HIDE_VOTE = "VoteHide",
    SET_SKYBOX = "SetSkybox",
    SKYBOX_EMOJI = "SkyboxEmoji",
}

export enum LimitedTimeDiscount {
    EARLY_BIRD = "early-bird",
    PAUL_SPOKE_TOO_SOON = "paul-spoke-too-soon",
    BETTNER_BONUS = "bettner-bonus",
    WILDPASS = "wildpass",
    FULL_SPECTRUM = "full-spectrum",
    FLAIR = "flair",
    PIRATE_NATION = "pirate-nation",
    KOIN_GAMES = "koin-games",
    AGENT_YP = "agent-yp",

    /** List of Partner NFT */
    //WOLVES_DAO = "wolves-dao",
    //WARDENS_AND_CATALYST = "wardens-and-catalyst",
}

export interface Leader {
    Rank: number;
    PreviousRank: number;
    UserId: string;
    Username: string;
    PfpImageUrl: string;
    Score: number;
}

export interface LeaderCondensed {
    r: number;
    u: string;
    s: number;
}

/**
 * Interface for incoming skybox emojis as part of the BoostSignalMessage
 * @interface SkyboxEmoji
 * @property {string} skyboxId - This is the ObjectId of the skybox in string form
 * @property {string} emoji - The unicode format emoji
 * @property {number} emojiCount - The count of emojis (not currently used)
 */
export interface SkyboxEmoji {
    skyboxId: string;
    emoji: string;
    emojiCount: number;
}

/**
 * Backend API response interface for Server API (Extendable)
 * @interface BackendApiResponse
 * @property {boolean} success - Indicates if the API call was successful
 * @property {T} [data] - The data returned from the API call
 * @property {string} [message] - A message describing the result of the API call
 */
export interface BackendApiResponse<T = any> {
    success: boolean;
    data?: T | null;
    message?: string;
}

export type ForecastStatus = "active" | "closed" | "called" | "airdropped";