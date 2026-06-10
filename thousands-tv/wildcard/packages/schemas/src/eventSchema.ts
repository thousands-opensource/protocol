import { Document, Schema, model, Model, models, Types } from "mongoose";
import { IEvent, MONGO_REQUIRED_STRING, TIMESTAMPS } from "@repo/interfaces";
import { SERIES_TABLE_NAME } from "./seriesSchema";

export const EVENTS_TABLE_NAME = "events";

// Seasons Schema
export const eventsSchema = new Schema<IEvent>(
    {
        seriesId: {
            type: Schema.Types.ObjectId,
            ref: SERIES_TABLE_NAME,
        },
        eventName: MONGO_REQUIRED_STRING,
        startDate: { type: Date },
        endDate: { type: Date },
        imageUrl: MONGO_REQUIRED_STRING,
    }
);

eventsSchema.set(TIMESTAMPS, true);

// Due to a Next.js issue with MongoDB, we need to first check and return the model if it has already been created
// see https://stackoverflow.com/questions/62440264/mongoose-nextjs-model-is-not-defined-cannot-overwrite-model-once-compiled for more details

export const eventsModel =
    (models[EVENTS_TABLE_NAME] as Model<IEvent, {}, {}, {}, any>) ||
    model<IEvent>(EVENTS_TABLE_NAME, eventsSchema);

export type EventDoc = Document<unknown, any, IEvent> &
    IEvent &
    Required<{ _id: Types.ObjectId }>;
