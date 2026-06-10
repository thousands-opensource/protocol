import { IBoostBalance } from "@repo/interfaces";
import { Schema, model, Types, Document, models, Model } from "mongoose";

export const BOOST_BALANCE_TABLE_NAME = "boost-balances";

const boostBalanceSchema = new Schema<IBoostBalance>(
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
    },
    { timestamps: true }
);

export const boostBalanceModel =
    (models[BOOST_BALANCE_TABLE_NAME] as Model<any, {}, {}, {}, any>) ||
    model(BOOST_BALANCE_TABLE_NAME, boostBalanceSchema);

export interface BoostBalanceDoc extends Document {
    userId: Types.ObjectId;
    balance: number;
    createdAt: Date;
    updatedAt: Date;
}
