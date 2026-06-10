import { ICreditBalance } from "@repo/interfaces";
import { Schema, model, Types, Document, models, Model } from "mongoose";

export const CREDIT_BALANCE_TABLE_NAME = "credit-balances";

const creditBalanceSchema = new Schema<ICreditBalance>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        balance: {
            type: Number,
            required: true,
            default: 0,
        },
        spentLoyaltyPoints: {
            type: Number,
            required: false,
            default: 0,
        },
    },
    { timestamps: true }
);

export const creditBalanceModel =
    (models[CREDIT_BALANCE_TABLE_NAME] as Model<any, {}, {}, {}, any>) ||
    model(CREDIT_BALANCE_TABLE_NAME, creditBalanceSchema);

export interface CreditBalanceDoc extends Document {
    userId: Types.ObjectId;
    balance: number;
    spentLoyaltyPoints: number;
    createdAt: Date;
    updatedAt: Date;
}
