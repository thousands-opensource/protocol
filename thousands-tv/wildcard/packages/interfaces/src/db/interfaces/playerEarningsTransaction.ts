import { Types } from "mongoose";

/**
 * Describes a payout or earnings adjustment granted to a player.
 */
export interface IPlayerEarningsTransaction {
    gamerTag: string;
    type: string;
    tournamentId: string;
    amount: number;
    _id?: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

