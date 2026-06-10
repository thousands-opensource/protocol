import { Types } from "mongoose";

export interface IFranchiseTransaction {
    userId: Types.ObjectId;
    type: string;
    offerRank: number;
    rate: number;
    ladderIndex: number;
    previousRank?: number;
    thousandsXpToAdd?: number;
    _id?: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

