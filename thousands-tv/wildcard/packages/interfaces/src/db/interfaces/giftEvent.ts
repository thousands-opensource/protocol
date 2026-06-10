import { Types } from "mongoose";
import { AccountProviderType } from "./user";

export interface IGiftEvent {
    userId: Types.ObjectId;
    platformId: AccountProviderType;
    platformUserName: string;
    numberOfSubs: number;
    completedOn?: Date;

    // mongo fields
    createdAt?: Date;
    updatedAt?: Date;
    _id?: Types.ObjectId;
    __v?: number;
}
