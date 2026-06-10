import { Types } from "mongoose";

export interface ISeries {
    seriesName: string;
    seriesDescription: string;
    startDate: Date;
    endDate: Date;
    imageUrl: string;
    backgroundImageUrl: string;
    seriesPointConfiguration?: string;

    _id?: Types.ObjectId;
    __v?: number;
    createdAt?: Date;
    updatedAt?: Date;
}
