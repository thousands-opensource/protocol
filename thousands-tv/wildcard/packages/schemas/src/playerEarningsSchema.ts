import { IPlayerEarnings } from "@repo/interfaces";
import { Schema, model, models, Model, Document, Types } from "mongoose";

export const PLAYER_EARNINGS_TABLE_NAME = "player-earnings";

const playerEarningsSchema = new Schema<IPlayerEarnings>(
    {
        gamerTag: {
            type: String,
            required: true,
        },
        earnings: {
            type: Number,
            required: true,
        },
        claimed: {
            type: Number,
            required: true,
        },
    },
    { timestamps: true }
);

export const playerEarningsModel =
    (models[PLAYER_EARNINGS_TABLE_NAME] as Model<any, {}, {}, {}, any>) ||
    model(PLAYER_EARNINGS_TABLE_NAME, playerEarningsSchema);

export interface PlayerEarningsDoc extends Document {
    _id: Types.ObjectId;
    gamerTag: string;
    earnings: number;
    claimed: number;
    createdAt: Date;
    updatedAt: Date;
}

