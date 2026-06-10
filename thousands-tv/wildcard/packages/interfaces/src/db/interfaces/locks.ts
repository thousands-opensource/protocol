import { Types } from "mongoose";

export type LockType = "sendBlockchainTxn";

export type LockReason =
    | "mintWildfile"
    | "linkWallet"
    | "unlinkWallet"
    | "linkSocial"
    | "setPfp"
    | "completedSwagSet"
    | "farcasterSwag"
    | "streamerPayout"
    | "n/a";

export interface ILock {
    lockType: LockType;
    walletAddress: string;
    isLocked: boolean;
    timestamp: Date;
    acquireUuid: string;
    lockedBy: string;
    lockReason: LockReason;

    // mongo fields
    createdAt?: Date;
    updatedAt?: Date;
    _id?: Types.ObjectId;
    __v?: number;
}
