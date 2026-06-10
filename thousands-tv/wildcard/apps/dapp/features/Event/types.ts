export enum EventSection {
    EVENTS = "EVENTS",
    STAGES = "STAGES",
    STORE = "STORE",
    LEADERBOARDS = "LEADERBOARDS",
    BADGES = "BADGES",
}

export enum EventStatus {
    LIVE = "live",
    NEXT_EVENT = "next",
    UPCOMING = "upcoming",
    COMPLETED = "completed",
}

export enum GAME_MODE {
    NONE = "none",
    "1V1" = "1v1",
    "2v2" = "2v2",
}

// ***************************
// Boost/Multiplier Button Attributes
// ***************************

export interface BoostButtonAttrs {
    background: string;
    borderColor: string;
}

export interface ActiveBoost {
    chatActionGuid: string;
    boostValue: number;
    duration: number;
    expiration: number;
}
