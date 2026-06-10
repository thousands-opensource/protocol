import { Types } from "mongoose";

export interface RecognitionProgram {
    totalPoints: number;
    recognitionItems: PointItemCategory[];
}
export interface PointItemCategory {
    name: string;
    recognitionComponent: string;
    pointItemCollections: PointItemCollection[];
}

export interface PointItemCollection {
    name: string;
    bonusPoints: number;
    completeSetImageUrl?: string;
    showCompleteSetImageUrl?: boolean;
    countOfPointItemsOwned?: number;
    backgroundImageUrl?: string;
    pointItems: PointItem[];
}

// NFT metadata attribute
export interface MetadataAttribute {
    traitType: string;
    value: string;
}

export interface PointItem {
    networkId: string;
    contractAddress: string;
    name: string;
    points: number;
    itemImageUrl: string;
    tokenId?: string;
    quantityOwned: number;
    metadataAttributes?: MetadataAttribute[];
}

export interface IRecognitionProgram {
    name: string;
    pointConfiguration: PointItemCategory[];

    _id?: Types.ObjectId;
    __v?: number;
    createdAt?: Date;
    updatedAt?: Date;
}
