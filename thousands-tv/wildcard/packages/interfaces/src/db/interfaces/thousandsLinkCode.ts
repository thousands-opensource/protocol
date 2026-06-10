import { Types } from "mongoose";

export interface IThousandsLinkCode {
    c: string;
    gt: number;
    e: Date;
    u: boolean;
    a: number;
    _id?: Types.ObjectId;
    __v?: number;
    createdAt?: Date;
    updatedAt?: Date;
}
