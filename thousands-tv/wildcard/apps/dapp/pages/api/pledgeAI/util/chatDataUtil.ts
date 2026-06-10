// utils/getChatDataSegments.ts

import IChatRepository from "@/repositories/interfaces/iChatRepository";
import IBoostRepository from "@/repositories/interfaces/iBoostRepository";
import {
    IChatMessagesSegments,
    IChatReactionsSegments,
} from "@repo/interfaces";
import { IBoostsSegment } from "@repo/interfaces";
import { simulateChatDataSegments } from "../tests/simulateChatData";

export interface ChatDataSegments {
    chatMessagesSegments: IChatMessagesSegments | null;
    chatReactionsSegments: IChatReactionsSegments | null;
    boostsSegments: IBoostsSegment | null;
}

/**
 * Retrieves chat data segments either from the database or via simulation.
 *
 * @param params.simulation - If true, use simulated data.
 * @param params.stageId - The stage ID.
 * @param params.vendorEventId - The vendor event ID.
 * @param params.segment - The segment number.
 * @param params.chatRepository - Repository instance to fetch chat messages.
 * @param params.boostRepository - Repository instance to fetch boosts.
 * @returns An object containing chatMessagesSegments, chatReactionsSegments, and boostsSegments.
 */
export async function getChatDataSegments(params: {
    stageId: string;
    vendorEventId: string;
    segment: number;
    chatRepository: IChatRepository;
    boostRepository: IBoostRepository;
    isTestMode: boolean;
}): Promise<ChatDataSegments> {
    const {
        isTestMode,
        stageId,
        vendorEventId,
        segment,
        chatRepository,
        boostRepository,
    } = params;

    if (isTestMode) {
        return simulateChatDataSegments(stageId, vendorEventId, segment);
    } else {
        const chatMessagesSegments = await chatRepository.getChatMessages(
            stageId,
            segment
        );
        const chatReactionsSegments = await chatRepository.getChatReactions(
            stageId,
            segment
        );
        const boostsSegments = await boostRepository.getBoosts(
            stageId,
            segment
        );
        return { chatMessagesSegments, chatReactionsSegments, boostsSegments };
    }
}
