import {
    Schema,
    model,
    models,
    Model,
    Document,
    Types,
} from "mongoose";
import { IProAction, USERS, PROS_TABLE_NAME } from "@repo/interfaces";

export const PRO_ACTIONS_TABLE_NAME = "pro-actions";

const proActionSchema = new Schema<IProAction>(
    {
        proId: {
            type: Schema.Types.ObjectId,
            ref: PROS_TABLE_NAME,
            required: true,
            index: true,
        },
        actionTypeId: {
            type: Number,
            required: true,
        },
        currentLevel: {
            type: Number,
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: USERS,
            required: true,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

export const proActionModel =
    (models[PRO_ACTIONS_TABLE_NAME] as Model<IProAction, {}, {}, {}, any>) ||
    model<IProAction>(PRO_ACTIONS_TABLE_NAME, proActionSchema);

export type ProActionDoc = Document<unknown, any, IProAction> &
    IProAction &
    Required<{ _id: Types.ObjectId }>;
