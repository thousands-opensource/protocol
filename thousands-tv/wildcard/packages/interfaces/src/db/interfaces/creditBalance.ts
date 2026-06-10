import { Types } from "mongoose";

export interface ICreditBalance {
    userId: Types.ObjectId;
    balance: number; //  Current balance of credits for the user
    spentLoyaltyPoints?: number;
    createdAt?: Date;
    updatedAt?: Date;
}
