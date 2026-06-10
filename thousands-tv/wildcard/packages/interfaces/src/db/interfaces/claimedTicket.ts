import { Types } from "mongoose";

export const CLAIMED_TICKETS_TABLE_NAME = "claimed-tickets";

export enum TicketTierType {
    GENERAL_ADMISSION = "general-admission",
    VIP = "vip",
    PREMIUM = "premium",
    WILDPASS = "wildpass",
}

export interface IClaimedTicket {
    userId: Types.ObjectId;
    eventId: string;
    tier: TicketTierType; // ticket type
    organizationId?: Types.ObjectId; // organization associated with the ticket
    creditMultiplier: number; // credit multiplier associated with the ticket
    accessCodeId?: Types.ObjectId; // access code used to claim the ticket (we can use this to track the access code used to claim the ticket)

    // mongo fields
    createdAt?: Date;
    updatedAt?: Date;
    _id?: Types.ObjectId;
    __v?: number;
}
