import { KudosType } from "./leaderboard";
import { Types } from "mongoose";

export interface IKudosEvent {
    type: KudosType;
    recipientUserId: Types.ObjectId;
    awardedByUserId: Types.ObjectId;
    airdropTokenId: string;
    airdropTxnHash?: string;
    reason?: string;

    // mongo fields
    createdAt?: Date;
    updatedAt?: Date;
    _id?: Types.ObjectId;
    __v?: number;
}
