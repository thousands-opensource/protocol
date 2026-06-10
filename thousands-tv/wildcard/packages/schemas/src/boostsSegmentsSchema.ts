import {
    MONGO_REQUIRED_DATE,
    MONGO_REQUIRED_NUMBER,
    MONGO_REQUIRED_STRING,
    TIMESTAMPS,
    IBoostsSegment,
} from "@repo/interfaces";
import { Document, Schema, model, Model, models, Types } from "mongoose";

const BOOSTS_SEGMENTS_TABLE_NAME = "boosts-segments";

const boostsSegmentsSchema = new Schema<IBoostsSegment>({
    stageId: MONGO_REQUIRED_STRING,
    segment: MONGO_REQUIRED_NUMBER,
    boosts: [
        {
            boostType: MONGO_REQUIRED_STRING,
            boostAmount: MONGO_REQUIRED_NUMBER,
            boostPrice: MONGO_REQUIRED_NUMBER,
            identityId: MONGO_REQUIRED_STRING,
            transactionId: MONGO_REQUIRED_STRING,
            vendorEventId: MONGO_REQUIRED_STRING,
            stageId: MONGO_REQUIRED_STRING,
            userId: MONGO_REQUIRED_STRING,
            timestamp: MONGO_REQUIRED_DATE,
        },
    ],
});

boostsSegmentsSchema.set(TIMESTAMPS, true);

export const boostsSegmentsModel =
    (models[BOOSTS_SEGMENTS_TABLE_NAME] as Model<
        IBoostsSegment,
        {},
        {},
        {},
        any
    >) ||
    model<IBoostsSegment>(BOOSTS_SEGMENTS_TABLE_NAME, boostsSegmentsSchema);

export type boostsSegmentsDoc = Document<unknown, any, IBoostsSegment> &
    IBoostsSegment &
    Required<{ _id: Types.ObjectId }>;
