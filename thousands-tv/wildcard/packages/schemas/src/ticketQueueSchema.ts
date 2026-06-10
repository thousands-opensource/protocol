import { Document, Schema, model, Model, models, Types } from "mongoose";
import {
    ITicketQueue,
    TICKET_QUEUES_TABLE_NAME,
    TIMESTAMPS,
    USERS,
} from "@repo/interfaces";
import {
    SERIES_TABLE_NAME,
} from "./seriesSchema";

const ticketQueueSchema = new Schema<ITicketQueue>({
    userId: { type: Schema.Types.ObjectId, ref: USERS, required: true },
    seriesId: {
        type: Schema.Types.ObjectId,
        ref: SERIES_TABLE_NAME,
        required: true,
    },
    queuePoints: { type: Number, default: 0 },
});

ticketQueueSchema.set(TIMESTAMPS, true);
ticketQueueSchema.index({ userId: 1, seriesId: 1 }, { unique: true });

export const ticketQueueModel =
    (models[TICKET_QUEUES_TABLE_NAME] as Model<
        ITicketQueue,
        {},
        {},
        {},
        any
    >) || model<ITicketQueue>(TICKET_QUEUES_TABLE_NAME, ticketQueueSchema);

export type TicketQueueDoc = Document<unknown, any, ITicketQueue> &
    ITicketQueue &
    Required<{ _id: Types.ObjectId }>;
