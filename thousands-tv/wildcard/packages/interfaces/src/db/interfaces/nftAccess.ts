import { Types } from "mongoose";

export enum ChainType {
    ETH = 'eth',
    POLYGON = 'polygon',
    BASE = 'base',
    AVAX = 'avax',
}

export interface INftAccess {
    chain: ChainType;
    collectionAddress: string;
    tokenId: string;
    eventId: string;
    userId: string;
    createdAt?: Date;
    updatedAt?: Date;
    _id?: Types.ObjectId;
}

export interface NftAccessDetails {
    chain: ChainType;
    collectionAddress: string;
    tokenId: string;
}

export const NFT_ACCESS_TABLE_NAME = 'nftAccess';