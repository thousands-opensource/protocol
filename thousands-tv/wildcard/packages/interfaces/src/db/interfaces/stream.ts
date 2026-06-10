import { Schema, Types } from "mongoose";

export enum ChatApp {
    WILDCARD = "wildcard",
    STREMECOIN = "stremecoin",
    NONE = "none",
    BOOST = "boost",
}
export interface IStream {
    serverId: Schema.Types.ObjectId;
    stageId: Schema.Types.ObjectId;
    vendorEventId: string;
    name: string;
    description: string;
    status: string;
    stageArn?: string;
    channelArn?: string;
    channelPlaybackUrl?: string;
    chatRoomArn?: string;
    cameraOperatorParticipantToken?: string;
    streamKey: string;
    ingestEndpoint: string;
    chatApp: ChatApp;
    createdAt: Date;
    updatedAt: Date;
    _id: Types.ObjectId;
    __v: number;
}
