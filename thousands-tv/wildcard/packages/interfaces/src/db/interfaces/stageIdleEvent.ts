import { Types } from "mongoose";

export const EVENTIDLEEVENTS = "event-idle-events";

export interface IIdleEvent {
    name: string;
    timestamp: number;
    cost: number;
    duration: number;
    perTick: number;
    isPersonalEvent: boolean;
}

export interface IStageIdleEvent {
    userId: string;
    eventId: string;
    idleEvent: IIdleEvent;

    _id?: Types.ObjectId;
    __v?: number;
    createdAt?: Date;
    updatedAt?: Date;
}