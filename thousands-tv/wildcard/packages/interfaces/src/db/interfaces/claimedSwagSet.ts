import { PostedWildevent } from "../dbShared";
import { Types } from "mongoose";

export interface ClaimedSwagSet {
    title: string;
    tokenIds: string[];
    postedWildevent: PostedWildevent;
}

export interface IClaimedSwagSets {
    userId: string;
    claimedSwagSets: ClaimedSwagSet[];

    // mongo fields
    createdAt?: Date;
    updatedAt?: Date;
    _id?: Types.ObjectId;
    __v?: number;
}
