import { IPlayerEarningsTransaction } from "@repo/interfaces";
import { Schema, model, models, Model, Document, Types } from "mongoose";

export const PLAYER_EARNINGS_TRANSACTIONS_TABLE_NAME =
    "player-earnings-transactions";

const playerEarningsTransactionSchema =
    new Schema<IPlayerEarningsTransaction>(
        {
            gamerTag: {
                type: String,
                required: true,
            },
            type: {
                type: String,
                required: true,
            },
            tournamentId: {
                type: String,
                required: true,
            },
            amount: {
                type: Number,
                required: true,
            },
        },
        { timestamps: true }
    );

export const playerEarningsTransactionModel =
    (models[PLAYER_EARNINGS_TRANSACTIONS_TABLE_NAME] as Model<
        any,
        {},
        {},
        {},
        any
    >) ||
    model(
        PLAYER_EARNINGS_TRANSACTIONS_TABLE_NAME,
        playerEarningsTransactionSchema
    );

export interface PlayerEarningsTransactionDoc extends Document {
    _id: Types.ObjectId;
    gamerTag: string;
    type: string;
    tournamentId: string;
    amount: number;
    createdAt: Date;
    updatedAt: Date;
}

