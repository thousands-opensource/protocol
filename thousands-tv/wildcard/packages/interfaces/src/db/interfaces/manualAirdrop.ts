import { Types } from "mongoose";

export interface IManualAirdrop {
    address: string; // Wallet address to which the airdrop was sent
    txnHash: string; // Transaction hash of the airdrop
    tokenId: number; // ID of the token airdropped

    // mongo fields
    createdAt?: Date;
    updatedAt?: Date;
    _id?: Types.ObjectId;
    __v?: number;
}
