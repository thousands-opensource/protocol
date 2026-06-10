import {
    MONGO_REQUIRED_DATE,
    MONGO_REQUIRED_NUMBER,
    MONGO_REQUIRED_STRING,
    TIMESTAMPS,
    IChatMessagesSegments,
} from "@repo/interfaces";
import { Document, Schema, model, Model, models, Types } from "mongoose";

const CHAT_MESSAGES_SEGMENTS_TABLE_NAME = "chat-messages-segments";

const chatMessagesSegmentsSchema = new Schema<IChatMessagesSegments>({
    stageId: MONGO_REQUIRED_STRING,
    segment: MONGO_REQUIRED_NUMBER,
    chatMessages: [
        {
            vendorEventId: MONGO_REQUIRED_STRING,
            stageId: MONGO_REQUIRED_STRING,
            userId: MONGO_REQUIRED_STRING,
            message: MONGO_REQUIRED_STRING,
            timestamp: MONGO_REQUIRED_DATE,
        },
    ],
});

chatMessagesSegmentsSchema.set(TIMESTAMPS, true);

export const chatMessagesSegmentsModel =
    (models[CHAT_MESSAGES_SEGMENTS_TABLE_NAME] as Model<
        IChatMessagesSegments,
        {},
        {},
        {},
        any
    >) ||
    model<IChatMessagesSegments>(
        CHAT_MESSAGES_SEGMENTS_TABLE_NAME,
        chatMessagesSegmentsSchema
    );

export type ChatMessagesSegmentsDoc = Document<
    unknown,
    any,
    IChatMessagesSegments
> &
    IChatMessagesSegments &
    Required<{ _id: Types.ObjectId }>;
