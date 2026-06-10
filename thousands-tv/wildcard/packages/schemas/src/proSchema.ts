import {
    Schema,
    model,
    models,
    Model,
    Document,
    Types,
} from "mongoose";
import { IPro, USERS, PROS_TABLE_NAME } from "@repo/interfaces";

const proSchema = new Schema<IPro>(
    {
        proTemplateId: {
            type: Number,
            required: true,
        },
        rarity: {
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

export const proModel =
    (models[PROS_TABLE_NAME] as Model<IPro, {}, {}, {}, any>) ||
    model<IPro>(PROS_TABLE_NAME, proSchema);

export type ProDoc = Document<unknown, any, IPro> &
    IPro &
    Required<{ _id: Types.ObjectId }>;
