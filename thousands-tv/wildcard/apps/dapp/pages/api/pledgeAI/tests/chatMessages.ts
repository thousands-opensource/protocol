import { ChatMessage, IChatMessagesSegments } from "@repo/interfaces";
import { getRandomObjectId, getRandomUserId } from "../util/util";
import IChatRepository from "@/repositories/interfaces/iChatRepository";

/**
 * Generate a random timestamp within the past specified number of hours.
 *
 * @param hoursBack - Number of hours back to generate a timestamp (default is 24).
 * @returns A Date object.
 */
function getRandomTimestamp(hoursBack: number = 24): Date {
    const now = Date.now();
    const msInHour = 3600000;
    const offset = Math.floor(Math.random() * hoursBack * msInHour);
    return new Date(now - offset);
}

/**
 * Generate an array of random ChatMessage objects.
 *
 * @param count - Number of chat messages to generate.
 * @param options - Optional configuration:
 *   - stageId: string (defaults to a random ObjectId)
 *   - vendorEventId: string (defaults to a fixed string)
 *   - userPool: string[] (array of userIds to choose from; if empty, new ones are generated)
 *   - hoursBack: number (time window in hours for timestamps)
 *
 * @returns An array of ChatMessage objects.
 */
export function generateRandomChatMessages(
    count: number,
    options?: {
        stageId?: string;
        vendorEventId?: string;
        userPool?: string[];
        hoursBack?: number;
    }
): ChatMessage[] {
    const {
        stageId = getRandomObjectId(),
        vendorEventId = "events.WildcardPlaytest.1738356060000",
        userPool = [],
        hoursBack = 24,
    } = options || {};

    const SAMPLE_MESSAGES: string[] = [
        "Hello!",
        "How's it going?",
        "Wow, that was amazing!",
        "GG WP",
        "Let's go!",
        "Nice play!",
        "I'm impressed!",
        "What a match!",
        "This is epic!",
        "Good job!",
    ];

    const messages: ChatMessage[] = [];

    for (let i = 0; i < count; i++) {
        const userId = getRandomUserId(userPool);
        const message =
            SAMPLE_MESSAGES[Math.floor(Math.random() * SAMPLE_MESSAGES.length)];
        const timestamp = getRandomTimestamp(hoursBack);

        messages.push({
            vendorEventId,
            stageId,
            userId,
            message,
            timestamp,
        } as ChatMessage);
    }

    return messages;
}

/**
 * Generate a full ChatMessagesSegment object.
 *
 * @param count - Number of chat messages to generate.
 * @param segment - The segment number.
 * @param options - Additional options passed to generateRandomChatMessages.
 * @returns A ChatMessagesSegment object.
 */
export function generateChatMessagesSegment(
    count: number,
    segment: number,
    options?: {
        stageId?: string;
        vendorEventId?: string;
        userPool?: string[];
        hoursBack?: number;
    }
): IChatMessagesSegments {
    return {
        stageId: options?.stageId || getRandomObjectId(),
        segment,
        chatMessages: generateRandomChatMessages(
            count,
            options
        ) as ChatMessage[],
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}

/**
 * Test creating a chat messages segment - write to DB.
 */
export async function testCreateChatMessagesSegment(
    chatRepository: IChatRepository,
    stageId: string,
    vendorEventId: string,
    segment: number,
    userPool: string[]
) {
    try {
        const messageCount = 10000;
        const hoursBack = 48;
        const createdSegment = await chatRepository.createChatMessagesSegment(
            stageId,
            vendorEventId,
            segment,
            messageCount,
            hoursBack,
            userPool
        );
        console.log("Created chat messages segment:", createdSegment);
    } catch (error) {
        console.error("Error creating chat messages segment:", error);
    }
}

export async function testCreateChatReactionsSegment(
    chatRepository: IChatRepository,
    stageId: string,
    vendorEventId: string,
    segment: number,
    userPool: string[]
) {
    try {
        const reactionCount = 2000;
        const hoursBack = 48;

        const createdSegment = await chatRepository.createChatReactionsSegment(
            stageId,
            vendorEventId,
            segment,
            reactionCount,
            hoursBack,
            userPool
        );
        console.log("Created chat reactions segment:", createdSegment);
    } catch (error) {
        console.error("Error creating chat reactions segment:", error);
    }
}

/**
 * Chat Simulation Setup (for stress testing)
 */

// const userPool = generateUserIdPool(500); // Generate a pool of 1000 users

//  const vendorEventId = "event-alpha";
//  const stageId = "stage-alpha";
//  const segment = 1;

/**
 * User ids based on live previous playtests
 */
// const userPool = [
//     "66db52dc0628a396f0068bae",
//     "66e0a55ef679e99a10472dd3",
//     "67005d02e9a1f407e02cc7a3",
//     "679d40aaa69e7eb144d1297e",
//     "6737976048afac77ace05615",
//     "679d3ae1736ad54ce5edc297",
//     "66e0a6abb2ff66b41a03bfb7",
//     "6721a74f5779cbb6411e6d61",
//     "679d3f07883916081dfb27ca",
//     "66a3aa65bc538282253c18ac",
// ];

// await testCreateChatMessagesSegment(
//     chatRepository,
//     stageId,
//     vendorEventId,
//     segmentNum,
//     userPool
// );
// await testCreateChatReactionsSegment(
//     chatRepository,
//     stageId,
//     vendorEventId,
//     segmentNum,
//     userPool
// );
// await testCreateBoostsSegment(
//     boostRepository,
//     stageId,
//     vendorEventId,
//     segmentNum,
//     userPool
// );
