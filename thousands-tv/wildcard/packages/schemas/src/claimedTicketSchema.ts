import { Document, Schema, model, Model, models, Types } from "mongoose";
import {
    IClaimedTicket,
    MONGO_REQUIRED_STRING,
    TIMESTAMPS,
    USERS,
    CLAIMED_TICKETS_TABLE_NAME,
    TicketTierType,
    ACCESS_CODES_TABLE_NAME,
} from "@repo/interfaces";

// Mongo schema
const claimedTicketSchema = new Schema<IClaimedTicket>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: USERS,
        required: true,
    },
    eventId: MONGO_REQUIRED_STRING,
    tier: {
        type: String,
        required: true,
        enum: Object.values(TicketTierType),
    },
    organizationId: {
        type: Schema.Types.ObjectId,
        default: null,
    },
    accessCodeId: {
        type: Schema.Types.ObjectId,
        ref: ACCESS_CODES_TABLE_NAME,
    },
    creditMultiplier: {
        type: Number,
        default: 1,
    },
});

claimedTicketSchema.set(TIMESTAMPS, true);

// Due to a Next.js issue with MongoDB, we need to first check and return the model if it has already been created
// see https://stackoverflow.com/questions/62440264/mongoose-nextjs-model-is-not-defined-cannot-overwrite-model-once-compiled for more details
export const claimedTicketsModel =
    (models[CLAIMED_TICKETS_TABLE_NAME] as Model<
        IClaimedTicket,
        {},
        {},
        {},
        any
    >) ||
    model<IClaimedTicket>(CLAIMED_TICKETS_TABLE_NAME, claimedTicketSchema);

export type ClaimedTicketDoc = Document<unknown, any, IClaimedTicket> &
    IClaimedTicket &
    Required<{
        _id: Types.ObjectId;
    }>;
