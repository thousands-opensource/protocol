import { Types } from "mongoose";
import { IUser } from "./user";
import { IEvent } from "./event";
import { IIdentity } from "./identity";

export const STAGES_TABLE_NAME = "stages";

export interface IStage {
    serverId: Types.ObjectId;
    seriesId?: Types.ObjectId;
    eventId?: Types.ObjectId | IEvent;
    beamableEventId: string | null;
    name: string;
    description: string;
    startDate: Date;
    users: IUser[];
    identities: IIdentity[];
    channels: Channel[];
    imageUrl: string;
    status: string;
    endDate: Date;
    eventType: string;
    cameraOperator?: string;
    currentSegment: number;
    gameMode?: string;
    numberOfSkyboxes?: number;

    _id?: Types.ObjectId;
    __v?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Channel {
    name: string;
    src: string;
    _id?: Types.ObjectId;
}
