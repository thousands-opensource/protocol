import { Document, Schema, model, Model, models, Types } from "mongoose";
import {
    ISeries,
    MONGO_REQUIRED_NUMBER,
    MONGO_REQUIRED_STRING,
} from "@repo/interfaces";

export const SERIES_TABLE_NAME = "series";

// Series Schema
export const seriesSchema = new Schema<ISeries>(
    {
        seriesName: MONGO_REQUIRED_STRING,
        seriesDescription: MONGO_REQUIRED_STRING,
        startDate: { type: Date },
        endDate: { type: Date },
        imageUrl: MONGO_REQUIRED_STRING,
        backgroundImageUrl: MONGO_REQUIRED_STRING,
        seriesPointConfiguration: String,
    },
    {
        timestamps: true,
    }
);
// Due to a Next.js issue with MongoDB, we need to first check and return the model if it has already been created
// see https://stackoverflow.com/questions/62440264/mongoose-nextjs-model-is-not-defined-cannot-overwrite-model-once-compiled for more details

export const seriesModel =
    (models[SERIES_TABLE_NAME] as Model<ISeries, {}, {}, {}, any>) ||
    model<ISeries>(SERIES_TABLE_NAME, seriesSchema);

export type SeriesDoc = Document<unknown, any, ISeries> &
    ISeries &
    Required<{ _id: Types.ObjectId }>;
