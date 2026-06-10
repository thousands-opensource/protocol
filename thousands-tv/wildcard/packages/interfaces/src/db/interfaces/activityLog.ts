import { Types } from "mongoose";

export enum ActivityLogTypeEnum {
    UPDATE_PFP = "Updated Profile Picture",
    LINK_WALLET = "Linked Wallet",
    UNLINK_WALLET = "Unlinked Wallet",
}

export type ActivityLogType =
    | ActivityLogTypeEnum.UPDATE_PFP
    | ActivityLogTypeEnum.LINK_WALLET
    | ActivityLogTypeEnum.UNLINK_WALLET;

export interface ActivityLog {
    userId: string;
    time: Date;
    type: ActivityLogTypeEnum;
    data: string; // JSON string

    // mongo fields
    createdAt?: Date;
    updatedAt?: Date;
    _id?: Types.ObjectId;
    __v?: number;
}
