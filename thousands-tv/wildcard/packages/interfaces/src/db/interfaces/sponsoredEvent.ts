import { Types } from "mongoose";

export const SPONSORED_EVENTS_TABLE_NAME = "sponsored-events";

export interface ISponsorshipSlot {
    maxSlots: number;
    creditsPrice: number;
    usdcPrice: number;
    packageDescription: string;
    baseWC: number;
    tier: number;
    house: number;
    sponsorshipSlotId: string;
}

export interface ISponsoredEvent {
    name: string;
    type: string;
    startTime: Date;
    sponsorLockTime: Date;
    sponsorshipSlots: ISponsorshipSlot[];
    totalWC: number;
    _id?: Types.ObjectId;
    __v?: number;
    createdAt?: Date;
    updatedAt?: Date;
}
