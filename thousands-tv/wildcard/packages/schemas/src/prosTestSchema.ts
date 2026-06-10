import {
    Schema,
    model,
    models,
    Model,
    Document,
    Types,
} from "mongoose";
import { IProsTest, PROS_TEST_TABLE_NAME, USERS } from "@repo/interfaces";

const prosTestSchema = new Schema<IProsTest>(
    {
        currentOffset: {
            type: Number,
            required: true,
            default: 0,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: USERS,
            required: true,
            index: true,
        },
    },
    { timestamps: true }
);

export const prosTestModel =
    (models[PROS_TEST_TABLE_NAME] as Model<IProsTest, {}, {}, {}, any>) ||
    model<IProsTest>(PROS_TEST_TABLE_NAME, prosTestSchema);

export type ProsTestDoc = Document<unknown, any, IProsTest> &
    IProsTest &
    Required<{ _id: Types.ObjectId }>;
