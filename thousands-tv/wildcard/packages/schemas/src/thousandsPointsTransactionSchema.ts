import { IThousandsPointsTransaction } from "@repo/interfaces";
import { Schema, model, models, Model, Document, Types } from "mongoose";

export const THOUSANDS_POINTS_TRANSACTIONS_TABLE_NAME =
    "thousands-points-transactions";

const thousandsPointsTransactionSchema =
    new Schema<IThousandsPointsTransaction>(
        {
            userId: {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
            transactionId: {
                type: String,
                required: true,
                unique: true,
            },
            amount: {
                type: Number,
                required: true,
            },
        },
        { timestamps: true }
    );

export const thousandsPointsTransactionModel =
    (models[THOUSANDS_POINTS_TRANSACTIONS_TABLE_NAME] as Model<
        any,
        {},
        {},
        {},
        any
    >) ||
    model(
        THOUSANDS_POINTS_TRANSACTIONS_TABLE_NAME,
        thousandsPointsTransactionSchema
    );

export interface ThousandsPointsTransactionDoc extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    transactionId: string;
    amount: number;
    createdAt: Date;
    updatedAt: Date;
}
