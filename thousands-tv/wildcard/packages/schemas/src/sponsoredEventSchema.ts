import mongoose, { Document, Schema, model, Model, models, Types } from "mongoose";
import {
    ISponsoredEvent,
    MONGO_REQUIRED_DATE,
    MONGO_REQUIRED_NUMBER,
    MONGO_REQUIRED_STRING,
    SPONSORED_EVENTS_TABLE_NAME,
    TIMESTAMPS,
} from "@repo/interfaces";

const sponsorshipSlotSchema = new Schema(
    {
        maxSlots: MONGO_REQUIRED_NUMBER,
        creditsPrice: MONGO_REQUIRED_NUMBER,
        usdcPrice: MONGO_REQUIRED_NUMBER,
        packageDescription: MONGO_REQUIRED_STRING,
        baseWC: MONGO_REQUIRED_NUMBER,
        tier: MONGO_REQUIRED_NUMBER,
        house: MONGO_REQUIRED_NUMBER,
        sponsorshipSlotId: {
            type: Schema.Types.ObjectId,
            default: () => new mongoose.Types.ObjectId(),
        },
    },
    { _id: false }
);

export const sponsoredEventSchema = new Schema<ISponsoredEvent>({
    name: MONGO_REQUIRED_STRING,
    type: MONGO_REQUIRED_STRING,
    startTime: MONGO_REQUIRED_DATE,
    sponsorLockTime: MONGO_REQUIRED_DATE,
    sponsorshipSlots: { type: [sponsorshipSlotSchema], required: true },
    totalWC: MONGO_REQUIRED_NUMBER,
});

sponsoredEventSchema.set(TIMESTAMPS, true);

export const sponsoredEventModel =
    (models[SPONSORED_EVENTS_TABLE_NAME] as Model<
        ISponsoredEvent,
        {},
        {},
        {},
        any
    >) ||
    model<ISponsoredEvent>(SPONSORED_EVENTS_TABLE_NAME, sponsoredEventSchema);

export type SponsoredEventDoc = Document<unknown, any, ISponsoredEvent> &
    ISponsoredEvent &
    Required<{ _id: Types.ObjectId }>;
