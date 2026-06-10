import { Types } from "mongoose";

export interface ChatMessage {
    vendorEventId: string;
    stageId: string;
    userId: string;
    message: string;
    timestamp: Date;
}

export interface IChatMessagesSegments {
    stageId: string;
    segment: number;
    chatMessages: ChatMessage[];

    // mongo fields
    createdAt?: Date;
    updatedAt?: Date;
    _id?: Types.ObjectId;
    __v?: number;
}
