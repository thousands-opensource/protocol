import { Types } from "mongoose";
export interface ILeaderboard {
    name: string;
    isFrozen?: boolean;
    isFullyArchived?: boolean;
    archivedPages?: number[];
    leaderboardId: string;
    description: string;
    leaderboardRows: ILeaderboardRow[];
    leaderboardScoringDetails: ILeaderboardScoringDetail[];

    // mongo fields
    createdAt?: Date;
    updatedAt?: Date;
    _id?: Types.ObjectId;
    __v?: number;
}

export interface ILeaderboardScoringDetail {
    startDate: number; //unix timestamp
    endDate?: number; //unix timestamp
    points: number;
    scoringType: LeaderboardPointCategories;
    label?: string;
}

export interface ILeaderboardRow {
    rank: number;
    prevRank: number;
    displayName?: string;
    userId: string;
    score: number;
    pfpUrl?: string;
    userStats: LeaderboardStats;
}

export interface UserLeaderboardPosition {
    leaderboardId: string;
    name: string;
    userPosition: ILeaderboardRow;
}

export interface ILeaderBoardCount {
    leaderboardId: string;
    totalRows: number;
}

// Leaderboard Event type result derived by mongo projection
export interface ILeaderboardEvent {
    //TODOt check
    // wildeventId?: number;
    // txnHash: string;
    // wildfileIds: number[];
    // time: Date;
    name: string;
}

export interface KudosStats {
    kudosUltimateFan?: number;
    kudosBringTheHype?: number;
    kudosLetsGetWild?: number;
    kudosFanOnFire?: number;
    kudosFlyItHigh?: number;
    kudosYouEarnedIt?: number;
    kudosTicketToWild?: number;
    kudosWildWin?: number;
}

export type KudosType = keyof KudosStats;

export interface DiscordStats {
    playtestAttendance?: number;
    playtestMinutesAttended?: number;
    signatureEventAttendance?: number;
    signatureEventMinutesAttended?: number;
    communityGatheringAttendance?: number;
    communityGatheringMinutesAttended?: number;
}

export interface DreamHackDiscordStats {
    dreamHackPlaytestAttendance?: number;
    dreamHackPlaytestMinutesAttended?: number;
}

export interface NftStats {
    wildpassNftPoint?: number;
}
export interface EventStats {
    eventPoint?: number;
}

//stats per leaderboard
export interface AlphaSeries0LeaderboardStats
    extends KudosStats,
        DiscordStats {}
export interface DreamHackLeaderboardStats extends DreamHackDiscordStats {}
export interface NftLeaderboardStats extends NftStats {}
export interface EventLeaderboardStats extends EventStats {}
export interface LeaderboardStats
    extends EventLeaderboardStats,
        NftLeaderboardStats,
        DreamHackLeaderboardStats,
        AlphaSeries0LeaderboardStats {}
export interface UserIdToStats {
    [userIdStr: string]: LeaderboardStats;
}

export type LeaderboardPointCategories = keyof LeaderboardStats;
export type AlphaSeries0LeaderboardType = keyof AlphaSeries0LeaderboardStats;
export type DiscordType = keyof DiscordStats;
export type DreamHackDiscordType = keyof DreamHackDiscordStats;
export type NftPointType = keyof NftStats;
export type EventType = keyof EventStats;

//Wildfile Id -> previous rank
export interface PrevDayUserIdToRank {
    [userId: string]: number;
}

export interface LeaderboardPointsAndStats {
    points: number;
    updatedStats: LeaderboardStats;
}
