import { Types } from "mongoose";

export interface UsersAndTokenIds {
    address: string;
    tokenId: number;
}

export interface IMintFrameUsers {
    mintId: string;
    mintFrameUsers: UsersAndTokenIds[];

    // mongo fields
    createdAt?: Date;
    updatedAt?: Date;
    _id?: Types.ObjectId;
    __v?: number;
}

export interface IValidateSpordUsers {
    address: string;
    castTime: number; //unix timestamp
    fid: string;
    txnHash?: string;
    tokenId?: number;

    // mongo fields
    createdAt?: Date;
    updatedAt?: Date;
    _id?: Types.ObjectId;
    __v?: number;
}
