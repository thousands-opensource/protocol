import { Document, Schema, model, Model, models, Types } from "mongoose";
import {
    INftAccess,
    ChainType,
    NFT_ACCESS_TABLE_NAME,
    MONGO_REQUIRED_STRING,
    TIMESTAMPS
} from "@repo/interfaces";

const nftAccessSchema = new Schema<INftAccess>({
    chain: {
        type: String,
        required: true,
        enum: Object.values(ChainType)
    },
    collectionAddress: MONGO_REQUIRED_STRING,
    tokenId: MONGO_REQUIRED_STRING,
    eventId: MONGO_REQUIRED_STRING,
    userId: MONGO_REQUIRED_STRING
});

nftAccessSchema.index(
    { 
        chain: 1, 
        collectionAddress: 1, 
        tokenId: 1, 
        eventId: 1 
    }, 
    { unique: true }
);


nftAccessSchema.set(TIMESTAMPS, true);

export const nftAccessModel =
    (models[NFT_ACCESS_TABLE_NAME] as Model<INftAccess, {}, {}, {}, any>) ||
    model<INftAccess>(NFT_ACCESS_TABLE_NAME, nftAccessSchema);

export type NftAccessDoc = Document<unknown, any, INftAccess> &
    INftAccess &
    Required<{ _id: Types.ObjectId }>;