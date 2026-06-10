import { Types } from "mongoose";

export const COLLECTIBLE = "collectible";
export interface ICollectible {
    address: string;
    tokenId: string;
    name: string;
    icon: string;
    cost: number;
    quantity: number;

    // mongo fields
    createdAt?: Date;
    updatedAt?: Date;
    _id?: Types.ObjectId;
    __v?: number;
}
