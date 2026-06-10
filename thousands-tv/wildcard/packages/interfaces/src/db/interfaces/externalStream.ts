import { Types } from "mongoose";
import { AccountProviderType } from "./user";

export interface IExternalStream {
    userId: Types.ObjectId;
    platformId: AccountProviderType;
    platformUserName: string;
    amountEarned: number;
    startDate: Date;
    endDate?: Date;

    // mongo fields
    createdAt?: Date;
    updatedAt?: Date;
    _id?: Types.ObjectId;
    __v?: number;
}
