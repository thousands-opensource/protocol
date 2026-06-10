import { Types } from "mongoose";

export interface IProtocolPayout {
    userId: Types.ObjectId;
    twitchChannelName: string;
    hoursWatched: number;
    payoutAmount: number;
    transactionHash?: string; // blockchain transaction hash
    distributionId?: string; // distribution id from the thousands protocol contract
    valueUSDC: number;
    type: string;
    isPaid: boolean;
    createdAt: Date;
    updatedAt: Date;
    _id: Types.ObjectId;
    __v: number;
}
