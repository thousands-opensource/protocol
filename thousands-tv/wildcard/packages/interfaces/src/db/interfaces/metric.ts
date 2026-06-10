import { Types } from "mongoose";

export interface IMetric {
    _id?: Types.ObjectId;
    timestamp: Date;
    key: string; // kos, damageDone, damageReceived, summonKos, goalieKos, etc...
    value: number;
    category: string;

    __v?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IWideMetric {
    timestamp: Date;
    [key: string]: any;
}
