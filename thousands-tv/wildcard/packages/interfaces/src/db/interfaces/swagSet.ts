import { Types } from "mongoose";

export interface ISwagSet {
    contractAddress: string;
    title: string;
    tokenIds: string[];
    claimPeriodEndDate?: Date;

    // mongo fields
    createdAt?: Date;
    updatedAt?: Date;
    _id?: Types.ObjectId;
    __v?: number;
}
