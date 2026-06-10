import { Types } from "mongoose";

export const SKYBOX_TABLE_NAME = "skyboxes";

export interface ISkybox {
    stageId: Types.ObjectId;
    ownerUserId: Types.ObjectId;
    skyboxName: string;
    skyboxPrimaryColor: string;
    skyboxTier: number;
    skyboxLogoUrl: string;
    skyboxChannelMembers: string[];

    _id?: Types.ObjectId;
    __v?: number;
    createdAt?: Date;
    updatedAt?: Date;
}
