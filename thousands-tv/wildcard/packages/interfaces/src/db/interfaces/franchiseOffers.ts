import { Types } from "mongoose";

export const FRANCHISE_OFFERS_TABLE_NAME = "franchise-offers";

export interface IFranchiseOffer {
    userId: Types.ObjectId;
    epoch: number;
    offerAmount: number;

    // mongo fields
    createdAt?: Date;
    updatedAt?: Date;
    _id?: Types.ObjectId;
    __v?: number;
}
