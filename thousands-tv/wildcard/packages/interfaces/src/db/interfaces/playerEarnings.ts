import { Types } from "mongoose";

/**
 * Represents the aggregate earnings of a player.
 */
export interface IPlayerEarnings {
    gamerTag: string;
    earnings: number;
    claimed: number;
    _id?: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

