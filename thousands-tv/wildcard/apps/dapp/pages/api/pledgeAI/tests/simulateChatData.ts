import {
    IChatMessagesSegments,
    IChatReactionsSegments,
} from "@repo/interfaces";
import { IBoostsSegment } from "@repo/interfaces";
import { generateChatMessagesSegment } from "../tests/chatMessages";
import { generateChatReactionsSegment } from "../tests/chatReactions";
import { generateBoostsSegment } from "../tests/chatBoosts";
import { generateUserIdPool } from "../util/util";

export interface SimulatedChatData {
    chatMessagesSegments: IChatMessagesSegments;
    chatReactionsSegments: IChatReactionsSegments;
    boostsSegments: IBoostsSegment;
}

// Default simulation values (at max limit)
const NUMBER_OF_MESSAGES_TO_GENERATE = 10000;
const NUMBER_OF_REACTIONS_TO_GENERATE = 2000;
const NUMBER_OF_BOOSTS_TO_GENERATE = 500;
const NUMBER_OF_USERS = 500;
const HOURS_BACK = 48;

/**
 * Generates simulated chat data segments using default simulation values.
 *
 * @param stageId - The stage ID.
 * @param vendorEventId - The vendor event ID.
 * @param segment - The segment number.
 * @returns An object containing simulated chat messages, reactions, and boosts segments.
 */
export function simulateChatDataSegments(
    stageId: string,
    vendorEventId: string,
    segment: number
): SimulatedChatData {
    const userPool = generateUserIdPool(NUMBER_OF_USERS);

    const chatMessagesSegments = generateChatMessagesSegment(
        NUMBER_OF_MESSAGES_TO_GENERATE,
        segment,
        {
            stageId,
            vendorEventId,
            userPool,
            hoursBack: HOURS_BACK,
        }
    );

    const chatReactionsSegments = generateChatReactionsSegment(
        NUMBER_OF_REACTIONS_TO_GENERATE,
        segment,
        {
            stageId,
            vendorEventId,
            userPool,
            originalUserPool: userPool,
            hoursBack: HOURS_BACK,
        }
    );

    const boostsSegments = generateBoostsSegment(
        NUMBER_OF_BOOSTS_TO_GENERATE,
        segment,
        {
            stageId,
            vendorEventId,
            userPool,
        }
    );

    return { chatMessagesSegments, chatReactionsSegments, boostsSegments };
}
