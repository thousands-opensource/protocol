import { Types } from "mongoose";

export interface IMatchResults {
    _id: Types.ObjectId;
    matchResults: IMatchResult;

    __v?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IMatchResults2 {
    _id: Types.ObjectId;
    matchResults: IMatchResult2;

    __v?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IMatchResult {
    lobbyId: string;
    playerData: IPlayerData[];
    winningTeamId: string;
    duration: number;
    eventId: string;
    matchId: string;
    gameTypeId: string;
    createdAt: Date;
}

export interface IMatchResult2 {
    lid: string;
    pd: IPlayerData2[];
    wt: string;
    d: number;
    eid: string;
    mid: string;
    gt: string;
    createdAt: Date;
}

export interface IPlayerData {
    gamerTag: string;
    teamId: number;
    loadout: ILoadout;
    castCards: ICastCard[];
    kos: number;
    totalDamageDone: number;
    totalDamageReceived: number;
    totalHealingInflicted: number;
    totalHealingReceived: number;
    knockedouts: number;
    summonKOs: number;
    goalieKOs: number;
    sidekicksSpawned: number;
    healthCollected: string;
    manaCollected: string;
    damageTracking: IDamageTracking;
    statusTracking: IStatusTracking;
    totalWildcardsAcquired: string;
}

export interface IPlayerData2 {
    gt: string;
    t: number;
    l: ILoadout2;
    c: ICastCard2[];
    kos: number;
    tdi: number;
    tdr: number;
    thi: number;
    thr: number;
    koi: number;
    sko: number;
    gko: number;
    ss: number;
    hs: string;
    mc: string;
    dt: IDamageTracking2;
    st: IStatusTracking2;
    wca: string;
}

export interface ILoadout {
    _id: string;
    championId: string;
    name: string;
    summonCardIds: string[];
    talentCardIds: string[];
    wildCardIds: string[];
    cosmeticCardIds: string[];
    equippedCosmetics: Record<string, any>;
    IsDefault: boolean;
}

export interface ILoadout2 {
    _id: string;
    c: string;
    n: string;
    s: string[];
    t: string[];
    w: string[];
    cos: string[];
    eq: Record<string, any>;
    IsDefault: boolean;
}

export interface ICastCard {
    _id: string;
    casts: number;
}

export interface ICastCard2 {
    _id: string;
    c: number;
}

export interface IDamageTracking {
    physicalDamageInflicted: string;
    physicalDamageReceived: string;
    fireDamageInflicted: string;
    fireDamageReceived: string;
    poisonDamageInflicted: string;
    poisonDamageReceived: string;
    shockDamageInflicted: string;
    shockDamageReceived: string;
    sonicDamageInflicted: string;
    sonicDamageReceived: string;
}

export interface IDamageTracking2 {
    pdi: string;
    pdr: string;
    fdi: string;
    fdr: string;
    poisonDamageInflicted: string;
    poisonDamageReceived: string;
    kdi: string;
    kdr: string;
    sonicDamageInflicted: string;
    sonicDamageReceived: string;
}

export interface IStatusTracking {
    knockbackStatusInflicted: string;
    knockbackStatusReceived: string;
    tauntStatusInflicted: string;
    tauntStatusReceived: string;
    hasteStatusInflicted: string;
    hasteStatusReceived: string;
    slowStatusInflicted: string;
    slowStatusReceived: string;
    hackStatusInflicted: string;
    hackStatusReceived: string;
}

export interface IStatusTracking2 {
    kbi: string;
    kbr: string;
    ti: string;
    tr: string;
    hi: string;
    hr: string;
    si: string;
    sr: string;
    hai: string;
    har: string;
}