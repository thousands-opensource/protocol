import { Types } from "mongoose";
import { TicketTierType } from "./claimedTicket";
import { UserRole } from "./user";

export enum AccessCodeType {
    SINGLE_USE = "single-use",
    MULTI_USE = "multi-use",
    NFT_ACCESS = "nft-access",
    VOUCHER = "voucher",
}

export enum AccessCodeIntent {
    ACCESS_ROLE = "access-role",
    TICKET = "ticket",
}

export const ACCESS_CODES_TABLE_NAME = "access-codes";

export interface IAccessCode {
    organizationId: Types.ObjectId | null;
    accessCode: string;
    isClaimed: boolean;
    claimedUsers: {
        claimedCodeEventId?: Types.ObjectId | null;
        claimedBy: Types.ObjectId;
    }[];

    seriesId?: Types.ObjectId | null;

    // access code type
    codeType: AccessCodeType; // SINGLE_USE, MULTI_USE, VOUCHER
    maxQuantity: number; // max number of times the code can be used / redeemed

    // Intent-specific fields based on access code intent
    intent: AccessCodeIntent;

    // custom fields based on access code intent
    tier?: TicketTierType; // ticket tier (general admission, vip, etc.)
    accessRoles?: UserRole[]; // the role type that the access code grants

    partnerId?: Types.ObjectId | null; // partner id associated

    // mongo fields
    createdAt?: Date;
    updatedAt?: Date;
    _id?: Types.ObjectId;
    __v?: number;
}
