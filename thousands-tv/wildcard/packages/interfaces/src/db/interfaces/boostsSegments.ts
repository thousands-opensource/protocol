import { Types } from "mongoose";

export interface Boost {
    userId: string;
    boostType: string;
    boostPrice: number;
    boostAmount: number;
    identityId: string;
    transactionId: string;
    vendorEventId: string;
    stageId: string;
    timestamp: Date;
    skyboxId?: string;
    skyboxTier?: number
}

export interface IBoostsSegment {
    stageId: string;
    segment: number;
    boosts: Boost[];

    // mongo fields
    createdAt?: Date;
    updatedAt?: Date;
    _id?: Types.ObjectId;
    __v?: number;
}

export interface BoostRound {
    round: number;
    creditsSpent: number;
}

export interface IUserEventBoostSummary {
    eventName: string;
    rounds: BoostRound[];
}
