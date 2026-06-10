import { Types } from "mongoose";

export const USER_SPONSORED_EVENTS_TABLE_NAME = "user-sponsored-events";

export interface IUserSponsoredEvent {
    userId: Types.ObjectId;
    sponsoredEventId: Types.ObjectId;
    sponsorshipSlotId: string;
    rank?: number | null;
    wcEarned: number;
    thousandsXpEarned: number;
    support: number;
    tier: number;
    house: number;
    paidOn?: Date | null;
    claimedOn?: Date | null;
    usdcPrice: number;
    _id?: Types.ObjectId;
    __v?: number;
    createdAt?: Date;
    updatedAt?: Date;
}
