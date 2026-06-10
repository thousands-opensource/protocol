import { FanfareEffect } from "@/services/interfaces/iFanVisibilityService";

export type Ranking = {
    gt: number;
    rank: number;
    score: number;
    stats: string[];
};

export type Leaderboard = {
    lbId: string;
    boardSize: number;
    rankings: Ranking[];
};

export interface GetAllPlayersForEventResponse {
    result: string;
    lb: Leaderboard;
}

export interface Content {
    symbol: string;
    name: string;
    start_date: Date;
    phases: Phase[];
}

export interface Phase {
    name: string;
    duration_minutes: number;
    rules: Rule[];
    durationMillis: number;
    durationSeconds: number;
}

export interface Rule {
    rule: string;
    value: string;
}

export interface PhaseTime {
    name: string;
    startTime: number;
    endTime: number;
}

export interface GetEventDetailsResponse {
    id: string;
    content: Content;
    leaderboardId: string;
    startTime: number;
    state: string;
    origin: string;
    createdAt: number;
    endTime: number;
    phaseTimes: PhaseTime[];
}

export interface SetPlayerScoreForEventResponse {
    success: boolean;
    errormessage: string;
}

export interface Event {
    id: string;
    name: string;
    leaderboardId: string;
    score: number;
    rank: number;
    running: boolean;
    secondsRemaining: number;
}

export interface GetEventsForPlayerResponse {
    running: Event[];
    done: Event[];
}

export default interface IEventService {
    //User Context API calls
    getAllPlayersForEvent(
        gamerTag: string,
        vendorEventId: string
    ): Promise<GetAllPlayersForEventResponse>;

    getEventsForPlayer(gamerTag: string): Promise<GetEventsForPlayerResponse>;

    setPlayerScoreForEvent(
        gamerTag: string,
        vendorEventId: string,
        score: number,
        increment: boolean
    ): Promise<SetPlayerScoreForEventResponse>;

    //Admin Context API calls
    getEventDetails(vendorEventId: string): Promise<GetEventDetailsResponse>;

    getStreamIdFromVendorEventId(vendorEventId: string): Promise<string>;

    //Calls Timeless Microservice
    endEvent(vendorEventId: string, endDateUtc: Date): Promise<boolean>;

    //Calls Timeless Microservice
    addEventMatch(
        vendorEventId: string,
        matchId: string,
        cameraOperator: string,
        competitorGameTags: string[]
    ): Promise<boolean>;

    //Calls Timeless Microservice
    setStat(
        gamerTag: string,
        statName: string,
        statValue: string
    ): Promise<boolean>;

    //Calls Timeless Microservice
    setUserAsCompetitor(gamerTag: string): Promise<boolean>;

    setUserName(gamerTag: string, userName: string): Promise<boolean>;

    //Calls Timeless Microservice
    cancelEventMatch(vendorEventId: string, matchId: string): Promise<boolean>;

    //Calls Timeless Microservice
    scheduleEvent(
        name: string,
        symbol: string,
        startDate: string,
        phaseName: string,
        rules: { [rule: string]: string },
        durationMinutes: number
    ): Promise<{ success: boolean; error?: any; response?: any }>;

    sendBoost(vendorEventId: string, fanId: string, fanfareEffects: FanfareEffect[]): Promise<{ success: boolean; error?: any; response?: any }>;
}
