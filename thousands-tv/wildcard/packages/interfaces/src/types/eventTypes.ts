import { ChatApp } from "@src/db/interfaces/stream";

export interface Rule {
    rule: string;
    value: string;
}

export interface Phase {
    name: string;
    duration_minutes?: string;
    durationSeconds?: number;
    durationMillis?: number;
    rules: Rule[];
}

export interface Permissions {
    write_self: boolean;
}

export interface GroupRewards {
    scoreRewards: any[];
}

export interface CohortSettings {
    cohorts: any[];
}

export enum GAME_MODE {
    NONE = "none",
    "1V1" = "1v1",
    "2v2" = "2v2",
}

export interface EventCreationContent {
    id?: string;
    serverCode: string;
    name: string;
    symbol: string;
    start_date: string;
    phases: Phase[];
    partition_size: string;
    permissions: Permissions;
    score_rewards: any[];
    rank_rewards: any[];
    group_rewards: GroupRewards;
    type: string;
    recurring: null;
    cohortSettings: CohortSettings;
    imageUrl: string;
    durationMinutes: number;
    billboardImageUrl: string;
    seriesId: string;
    gameMode: GAME_MODE;
    numberOfSkyboxes: number;
}

export interface EventCreationPayload {
    content: EventCreationContent;
}
