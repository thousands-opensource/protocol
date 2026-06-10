import { Types } from "mongoose";

export const PROS_TABLE_NAME = "pros";

export interface IPro {
    proTemplateId: number;
    rarity: number;
    userId: Types.ObjectId;

    _id?: Types.ObjectId;
    __v?: number;
    createdAt?: Date;
    updatedAt?: Date;
}
