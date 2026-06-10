import { Types } from "mongoose";

export interface IStreamerStats {
    platform: string;
    channelName: string;
    channelDisplayName: string;
    channelId: string;
    hoursWatched: number;
    peakViewers: number;
    averageViewers: number;
    date: Date;
    isPaidOut: boolean;
    createdAt: Date;
    updatedAt: Date;
    _id: Types.ObjectId;
    __v: number;
}
