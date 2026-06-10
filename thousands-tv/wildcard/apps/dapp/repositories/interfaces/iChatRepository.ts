import {
    IChatMessagesSegments,
    IChatReactionsSegments,
} from "@repo/interfaces";

export default interface IChatRepository {
    getChatMessages(
        stageId: string,
        segment: number
    ): Promise<IChatMessagesSegments | null>;

    getChatReactions(
        stageId: string,
        segment: number
    ): Promise<IChatReactionsSegments | null>;

    createChatMessagesSegment(
        stageId: string,
        vendorEventId: string,
        segment: number,
        messagesCount: number,
        hoursBack: number,
        userPool: string[]
    ): Promise<IChatMessagesSegments>;

    createChatReactionsSegment(
        stageId: string,
        vendorEventId: string,
        segment: number,
        reactionCount: number,
        hoursBack: number,
        userPool: string[]
    ): Promise<IChatReactionsSegments>;
}
