import { Types } from "mongoose";

export const POINTS_DEFINITION = "points-definition";
export interface IPointsDefinition {
    pointsId: string;
    pointValue: number;

    // mongo fields
    createdAt?: Date;
    updatedAt?: Date;
    _id?: Types.ObjectId;
    __v?: number;
}
