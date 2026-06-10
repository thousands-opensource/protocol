import { Schema, model, models, Model, Document, Types } from "mongoose";
import { IFranchiseTransaction } from "@repo/interfaces";

export const FRANCHISE_TRANSACTIONS_COLLECTION = "franchise-transactions";

const franchiseTransactionsSchema = new Schema<IFranchiseTransaction>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "users",
            required: true,
        },
        type: {
            type: String,
            required: true,
        },
        offerRank: {
            type: Number,
            required: true,
        },
        rate: {
            type: Number,
            required: true,
        },
        ladderIndex: {
            type: Number,
            required: true,
        },
        previousRank: {
            type: Number,
            required: false,
        },
        thousandsXpToAdd: {
            type: Number,
            required: false,
        },
    },
    { timestamps: true }
);

export const franchiseTransactionsModel =
    (models[FRANCHISE_TRANSACTIONS_COLLECTION] as Model<
        IFranchiseTransaction,
        {},
        {},
        {},
        any
    >) ||
    model<IFranchiseTransaction>(
        FRANCHISE_TRANSACTIONS_COLLECTION,
        franchiseTransactionsSchema
    );

export interface FranchiseTransactionDoc extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    type: string;
    rate: number;
    createdAt: Date;
    updatedAt: Date;
}

