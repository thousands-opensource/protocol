import { Types } from "mongoose";
export interface IEvent {
    seriesId: Types.ObjectId;
    eventName: string;
    imageUrl: string;
    startDate: Date;
    endDate: Date;
    _id?: Types.ObjectId;
    __v?: number;
    createdAt?: Date;
    updatedAt?: Date;
}
