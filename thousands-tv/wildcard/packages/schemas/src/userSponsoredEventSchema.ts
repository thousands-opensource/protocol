import { Document, Schema, model, Model, models, Types } from "mongoose";
import {
    IUserSponsoredEvent,
    MONGO_REQUIRED_NUMBER,
    SPONSORED_EVENTS_TABLE_NAME,
    TIMESTAMPS,
    USERS,
    USER_SPONSORED_EVENTS_TABLE_NAME,
} from "@repo/interfaces";

export const userSponsoredEventSchema = new Schema<IUserSponsoredEvent>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: USERS,
        required: true,
    },
    sponsoredEventId: {
        type: Schema.Types.ObjectId,
        ref: SPONSORED_EVENTS_TABLE_NAME,
        required: true,
    },
    sponsorshipSlotId: {
        type: String,
        required: true,
    },
    rank: {
        type: Number,
        default: null,
    },
    wcEarned: {
        type: Number,
        required: true,
        default: 0,
    },
    thousandsXpEarned: {
        type: Number,
        required: true,
        default: 0,
    },
    support: {
        type: Number,
        required: true,
        default: 0,
    },
    tier: MONGO_REQUIRED_NUMBER,
    house: MONGO_REQUIRED_NUMBER,
    paidOn: {
        type: Date,
        default: null,
    },
    claimedOn: {
        type: Date,
        default: null,
    },
    usdcPrice: MONGO_REQUIRED_NUMBER,
});

userSponsoredEventSchema.set(TIMESTAMPS, true);

export const userSponsoredEventModel =
    (models[USER_SPONSORED_EVENTS_TABLE_NAME] as Model<
        IUserSponsoredEvent,
        {},
        {},
        {},
        any
    >) ||
    model<IUserSponsoredEvent>(
        USER_SPONSORED_EVENTS_TABLE_NAME,
        userSponsoredEventSchema
    );

export type UserSponsoredEventDoc = Document<
    unknown,
    any,
    IUserSponsoredEvent
> &
    IUserSponsoredEvent &
    Required<{ _id: Types.ObjectId }>;
