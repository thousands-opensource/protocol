import { Types } from "mongoose";

export const NFTS_TO_PROCESS_COLLECTION = "nfts-to-process";

export interface INftsToProcess {
    chainId: string;
    nftName: string;
    address: string;
    tokenId: string;
    scanMethod: string;
    startingBlockNumber: number;
    active?: boolean;
    expectedTokenCount: number;
    _id?: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}
