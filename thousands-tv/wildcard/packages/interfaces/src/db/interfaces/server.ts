import { Schema, Types } from "mongoose";
import { IStage } from "./stage";
import { ISeries } from "./series";
import { IEvent } from "./event";
import { IIdentity } from "./identity";

export interface IServer {
    serverCode: string;
    serverName: string;
    description: string;
    status: string;
    serverPrimaryLogoUrl: string;
    stages?: IStage[];
    series?: ISeries[];
    events?: IEvent[];
    identities: IIdentity[];
    createdAt: Date;
    updatedAt: Date;
    _id: Types.ObjectId;
    __v: number;
}
