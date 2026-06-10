import { Types } from "mongoose";

export interface IBlacklistedAddress {
    address: string;
    _id?: Types.ObjectId;
    __v?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export const BLACKLISTED_ADDRESSES = "blacklistedAddresses";