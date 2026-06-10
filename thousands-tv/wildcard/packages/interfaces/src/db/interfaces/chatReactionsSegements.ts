import { Types } from "mongoose";

export interface ChatReaction {
    vendorEventId: string;
    stageId: string;
    userId: string;
    originalMessage: string;
    originalMessageUserId: string;
    emoji: string;
    emojiAddedOrRemoved: boolean;
    message: string;
    timestamp: Date;
}

export interface IChatReactionsSegments {
    stageId: string;
    segment: number;
    chatReactions: ChatReaction[];

    // mongo fields
    createdAt?: Date;
    updatedAt?: Date;
    _id?: Types.ObjectId;
    __v?: number;
}
