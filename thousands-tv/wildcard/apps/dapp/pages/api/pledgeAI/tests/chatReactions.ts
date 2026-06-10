import { ChatReaction, IChatReactionsSegments } from "@repo/interfaces";
import { getRandomObjectId } from "../util/util";

/**
 * Returns a random element from an array.
 */
function getRandomItem<T>(array: T[]): T {
    const index = Math.floor(Math.random() * array.length);
    return array[index];
}

/**
 * Generate a random timestamp within the past specified number of hours.
 * @param hoursBack - Number of hours back to generate a timestamp (default: 24)
 * @returns A Date object.
 */
function getRandomTimestamp(hoursBack: number = 24): Date {
    const now = Date.now();
    const msInHour = 3600000;
    const offset = Math.floor(Math.random() * hoursBack * msInHour);
    return new Date(now - offset);
}

/**
 * Returns a random userId from the provided pool.
 * If the pool is empty, returns a new ObjectId.
 * @param userPool - Array of userId strings.
 * @returns A userId string.
 */
function getRandomUserId(userPool: string[]): string {
    if (userPool.length === 0) return getRandomObjectId();
    return getRandomItem(userPool);
}

// Sample arrays for original messages and emojis
const SAMPLE_ORIGINAL_MESSAGES: string[] = [
    "Great job!",
    "Well done!",
    "Nice!",
    "Amazing!",
    "Wow!",
    "Keep it up!",
];

const SAMPLE_EMOJIS: string[] = ["👍", "🎉", "💩", "😄", "👏", "❤️"];

/**
 * Generate an array of random ChatReaction objects.
 *
 * @param count - Number of chat reactions to generate.
 * @param options - Optional configuration:
 *   - stageId: string (defaults to a random ObjectId)
 *   - vendorEventId: string (defaults to a fixed string)
 *   - userPool: string[] (an array of user IDs for 'userId'; if empty, new IDs are generated)
 *   - originalUserPool: string[] (an array of user IDs for 'originalMessageUserId'; if empty, uses userPool)
 *   - hoursBack: number (time window in hours for timestamps; default is 24)
 *
 * @returns An array of ChatReaction objects.
 */
export function generateRandomChatReactions(
    count: number,
    options?: {
        stageId?: string;
        vendorEventId?: string;
        userPool?: string[];
        originalUserPool?: string[];
        hoursBack?: number;
    }
): ChatReaction[] {
    const {
        stageId = getRandomObjectId(),
        vendorEventId = "events.WildcardPlaytest.1738356060000",
        userPool = [],
        originalUserPool = [],
        hoursBack = 24,
    } = options || {};

    const reactions: ChatReaction[] = [];

    for (let i = 0; i < count; i++) {
        const userId = getRandomUserId(userPool);
        const originalMessageUserId =
            originalUserPool.length > 0
                ? getRandomUserId(originalUserPool)
                : getRandomUserId(userPool);
        const reaction: ChatReaction = {
            vendorEventId,
            stageId,
            userId,
            originalMessage: getRandomItem(SAMPLE_ORIGINAL_MESSAGES),
            originalMessageUserId,
            emoji: getRandomItem(SAMPLE_EMOJIS),
            emojiAddedOrRemoved: Math.random() < 0.5,
            message: getRandomItem(SAMPLE_ORIGINAL_MESSAGES),
            timestamp: getRandomTimestamp(hoursBack),
        };
        reactions.push(reaction as ChatReaction);
    }

    return reactions;
}

/**
 * Generate a Chat Reactions Segment.
 *
 * @param count - Number of chat reactions to generate.
 * @param segment - The segment number.
 * @param options - Additional options passed to generateRandomChatReactions.
 * @returns An IChatReactionsSegments object.
 */
export function generateChatReactionsSegment(
    count: number,
    segment: number,
    options?: {
        stageId?: string;
        vendorEventId?: string;
        userPool?: string[];
        originalUserPool?: string[];
        hoursBack?: number;
    }
): IChatReactionsSegments {
    return {
        stageId: options?.stageId || getRandomObjectId(),
        segment,
        chatReactions: generateRandomChatReactions(
            count,
            options
        ) as ChatReaction[],
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}
