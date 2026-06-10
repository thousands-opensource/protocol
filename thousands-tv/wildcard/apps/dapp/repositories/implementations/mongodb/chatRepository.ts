import connectToDb from "@/db/connectToDb";
import { generateChatMessagesSegment } from "@/pages/api/pledgeAI/tests/chatMessages";
import { generateChatReactionsSegment } from "@/pages/api/pledgeAI/tests/chatReactions";
import IChatRepository from "@/repositories/interfaces/iChatRepository";
import {
    IChatMessagesSegments,
    IChatReactionsSegments,
} from "@repo/interfaces";
import {
    chatMessagesSegmentsModel,
    chatReactionsSegmentsModel,
} from "@repo/schemas";
import { injectable } from "inversify";

@injectable()
export default class ChatRepository implements IChatRepository {
    async getChatMessages(
        stageId: string,
        segment: number
    ): Promise<IChatMessagesSegments | null> {
        try {
            await connectToDb();
            return await chatMessagesSegmentsModel.findOne({
                stageId,
                segment,
            });
        } catch (e: any) {
            console.error(
                "ChatRepository.getChatMessages - Failed to fetch chat message segment",
                e
            );
            return null;
        }
    }

    async getChatReactions(
        stageId: string,
        segment: number
    ): Promise<IChatReactionsSegments | null> {
        try {
            await connectToDb();
            return await chatReactionsSegmentsModel.findOne({
                stageId,
                segment,
            });
        } catch (e: any) {
            console.error(
                "ChatRepository.getChatReactions - Failed to fetch chat reaction segment",
                e
            );
            return null;
        }
    }

    async createChatMessagesSegment(
        stageId: string,
        vendorEventId: string,
        segment: number,
        messagesCount: number = 10000, // default to 10,000 messages
        hoursBack: number = 48, // simulation timeframe,
        userPool: string[]
    ): Promise<IChatMessagesSegments> {
        try {
            await connectToDb();

            // Use the simulated utility to generate a chat messages segment.
            const chatMessagesSegment = generateChatMessagesSegment(
                messagesCount,
                segment,
                { stageId, vendorEventId, userPool, hoursBack }
            );

            const createdSegment = await chatMessagesSegmentsModel.create(
                chatMessagesSegment
            );
            return createdSegment;
        } catch (e: any) {
            console.error(
                "ChatRepository.createChatMessagesSegment - Failed to create chat messages segment",
                e
            );
            throw new Error(e.message);
        }
    }

    async createChatReactionsSegment(
        stageId: string,
        vendorEventId: string,
        segment: number,
        reactionsCount: number = 2000,
        hoursBack: number = 48,
        userPool: string[]
    ): Promise<IChatReactionsSegments> {
        try {
            await connectToDb();

            const chatReactionsSegment = generateChatReactionsSegment(
                reactionsCount,
                segment,
                {
                    stageId,
                    vendorEventId,
                    userPool,
                    originalUserPool: userPool,
                    hoursBack,
                }
            );

            const createdSegment = await chatReactionsSegmentsModel.create(
                chatReactionsSegment
            );
            return createdSegment;
        } catch (e: any) {
            console.error(
                "ChatRepository.createChatReactionsSegment - Failed to create chat reactions segment",
                e
            );
            throw new Error(e.message);
        }
    }
}
