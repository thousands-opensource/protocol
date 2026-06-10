import {
    MONGO_REQUIRED_DATE,
    MONGO_REQUIRED_NUMBER,
    MONGO_REQUIRED_STRING,
    TIMESTAMPS,
    IChatReactionsSegments,
    MONGO_REQUIRED_BOOLEAN,
} from "@repo/interfaces";
import { Document, Schema, model, Model, models, Types } from "mongoose";

const CHAT_REACTIONS_SEGMENTS_TABLE_NAME = "chat-reactions-segments";

const chatReactionsSegmentsSchema = new Schema<IChatReactionsSegments>({
    stageId: MONGO_REQUIRED_STRING,
    segment: MONGO_REQUIRED_NUMBER,
    chatReactions: [
        {
            vendorEventId: MONGO_REQUIRED_STRING,
            stageId: MONGO_REQUIRED_STRING,
            userId: MONGO_REQUIRED_STRING,
            originalMessage: MONGO_REQUIRED_STRING,
            originalMessageUserId: MONGO_REQUIRED_STRING,
            emoji: MONGO_REQUIRED_STRING,
            emojiAddedOrRemoved: MONGO_REQUIRED_BOOLEAN,
            message: MONGO_REQUIRED_STRING,
            timestamp: MONGO_REQUIRED_DATE,
        },
    ],
});

chatReactionsSegmentsSchema.set(TIMESTAMPS, true);

export const chatReactionsSegmentsModel =
    (models[CHAT_REACTIONS_SEGMENTS_TABLE_NAME] as Model<
        IChatReactionsSegments,
        {},
        {},
        {},
        any
    >) ||
    model<IChatReactionsSegments>(
        CHAT_REACTIONS_SEGMENTS_TABLE_NAME,
        chatReactionsSegmentsSchema
    );

export type ChatReactionsSegmentsDoc = Document<
    unknown,
    any,
    IChatReactionsSegments
> &
    IChatReactionsSegments &
    Required<{ _id: Types.ObjectId }>;
