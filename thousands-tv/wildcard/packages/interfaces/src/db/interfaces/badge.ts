import { Types } from "mongoose";

export interface IBadge {
    id: string;
    swagSetTitle?: string;
    type: "swagSet" | "wildpass" | "community" | "og";
    name: string;
    description: string;
    userIds: string[];

    // mongo fields
    createdAt?: Date;
    updatedAt?: Date;
    _id?: Types.ObjectId;
    __v?: number;
}
