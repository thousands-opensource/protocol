import { Types } from "mongoose";

export interface IProAction {
    proId: Types.ObjectId;
    actionTypeId: number;
    currentLevel: number;
    amount: number;
    userId: Types.ObjectId;

    _id?: Types.ObjectId;
    __v?: number;
    createdAt?: Date;
    updatedAt?: Date;
}
