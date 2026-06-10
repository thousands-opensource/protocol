import { Types } from "mongoose";

/**
 * Represents a Thousands Points transaction entry.
 */
export interface IThousandsPointsTransaction {
    userId: Types.ObjectId;
    transactionId: string;
    amount: number;
    _id?: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}
