import { Types } from "mongoose";
import { IChatMessage } from "../../../../../../packages/interfaces/src/db/interfaces/dataSources/chatMessage";
import { IReaction } from "@repo/interfaces";
import { getFanDetailsUrl } from "@/utils/environmentUtilWCA";
import axios from "axios";
import { EnhancedDistributionResult, FanDetailObject } from "../types";
import { UNKNOWN_USER_ID } from "./topInsightsUtil";

/**
 * 100 sample messages for Twitch-like randomness and emojis.
 */
const SAMPLE_MESSAGES: string[] = [
    "What a game! 🤯",
    "So close! 😮",
    "No way they pulled that off...",
    "GG WP everyone",
    "Hahaha, that was epic! 😆",
    "Wait, how did they do that?",
    "So hype right now!!! 🔥",
    "lol",
    "Anyone else lagging? 🤔",
    "That champion is OP! 💪",
    "Let's gooooo! 🎉",
    "Nice strategy!",
    "This match is pure chaos 😈",
    "Sheeesh!",
    "That was a clutch save 🛡️",
    "Told you they'd do that move 🤷",
    "I love this community! ❤️",
    "Where's the next match?!",
    "One more game, let's go!",
    "Could this get any crazier?!",
    "Noob team? 🤪",
    "EZ clap 🤭",
    "We need a comeback!",
    "I can't watch... 😵",
    "Ban that champion next time 🤨",
    "PogChamp! 💯",
    "BRB grabbing snacks 🍿",
    "Everybody drop a follow!",
    "Is this ranked or casual?",
    "Wow, did you see that play?!",
    "Pro moves right there.",
    "Wait, wasn't that a bug? 🐞",
    "What is the chat spamming now? 🤔",
    "Stream quality is top-notch.",
    "MVP of this match? 🤔",
    "We got outplayed big time 😂",
    "This match is fire! 🔥",
    "Can't believe that worked...",
    "Are we getting a rematch?",
    "Queue times too long. 😑",
    "Haha, that was epic!",
    "Where's the mod squad?",
    "Nerf that champion, devs! 😡",
    "Sheeesh indeed!",
    "This is so hype! 🚀",
    "What rank are they???",
    "Legendary!",
    "Stop feeding! 😭",
    "They juke so hard, LMAO 🤣",
    "That was insane. 🤯",
    "I love the synergy here.",
    "Ayy, let's go team!",
    "CLUTCH or KICK!",
    "NGL, I'm impressed.",
    "ANY SMURFS HERE? 🤔",
    "That was a 200 IQ play 🧠",
    "lol there's no way",
    "Better nerf Irelia 💀",
    "Nice tries guys.",
    "We need more healing!",
    "This caster is hilarious 😂",
    "GG ez",
    "C'mon, it ain't over yet...",
    "Stop complaining, just have fun.",
    "That reaction time though!",
    "I can't take this hype!",
    "When does the new patch drop?",
    "Double kill, let's go!",
    "Rage quit incoming 🏃",
    "RIP headphone users 💥",
    "Ayy, so proud of this chat!",
    "Any codes for freebies??",
    "We need a highlight reel!",
    "Time to tilt the enemy. 😈",
    "Incoming gank, watch out!",
    "What's the meta now?",
    "Support main checking in!",
    "Shots fired! Pew pew 🔫",
    "Where's the face cam?",
    "This chat is wild! 🦁",
    "This must be smurf queue 🤣",
    "No misplays allowed!",
    "That glitch was crazy!",
    "Emotes spamming time 🥳",
    "Nice job devs, keep it up.",
    "Any legends in the chat?",
    "Console or PC gamer? 🤔",
    "One day I'll be as good...",
    "Stop backseat gaming.",
    "Got popcorn for this 🍿",
    "What was that? Lol",
    "Team synergy on point!",
    "Is that a pro player?",
    "Wait, a wild bug appeared!",
    "Thanks for the carry guys.",
    "Tune in tomorrow for more!",
    "Join the discord!",
    "RNG was on their side. 🍀",
    "We hit the sub goal!",
    "Sweet victory!",
    "Time for a victory lap. 🏆",
    "No hype? Where's the hype?!",
    "I blame lag. 🤡",
    "All skill, no luck.",
];

/**
 * Utility function to get a random element from an array.
 */
function getRandomItem<T>(arr: T[]): T {
    const index = Math.floor(Math.random() * arr.length);
    return arr[index];
}

/**
 * Generates a random timestamp within the last `hoursBack` hours.
 */
function getRandomTimestamp(hoursBack: number = 24): Date {
    const now = Date.now();
    // pick a random offset from 0 up to hoursBack in milliseconds
    const offset = Math.floor(Math.random() * hoursBack * 60 * 60 * 1000);
    return new Date(now - offset);
}

/**
 * (Optional) Generates a pseudo-random string for eventId
 * if you want to mimic an objectID or some other ID.
 * Otherwise, you can remove this or rely on a fixed eventId.
 */
function getRandomEventId(): string {
    return new Types.ObjectId().toHexString();
}

/**
 * Generate random chat messages, optionally using a shared userId pool.
 */
export function generateRandomChatMessages(
    count: number,
    useRandomEventId = false,
    fixedEventId?: string,
    userIds?: string[] // new optional param
): IChatMessage[] {
    const messages: IChatMessage[] = [];

    for (let i = 0; i < count; i++) {
        // If we have a userIds array, pick from it.
        // Otherwise, generate a new random userId for each message.
        const userId =
            userIds && userIds.length > 0
                ? getRandomItem(userIds)
                : new Types.ObjectId().toHexString();

        const content = getRandomItem(SAMPLE_MESSAGES);
        const timestamp = getRandomTimestamp();

        let eventId: string | undefined;
        if (fixedEventId) {
            eventId = fixedEventId;
        } else if (useRandomEventId) {
            eventId = getRandomEventId();
        }

        messages.push({
            userId,
            content,
            timestamp,
            eventId,
        });
    }

    return messages;
}

//==============================================================================

/**
 * A small set of sample emojis for reactions.
 * Feel free to expand or modify.
 */
const SAMPLE_EMOJIS = [
    "🔥",
    "👍",
    "😂",
    "👏",
    "😍",
    "💯",
    "😆",
    "🤔",
    "😮",
    "🐱‍👤",
];

/**
 * Generates a random ObjectId (hex string) for eventId or targetMessageId
 * if needed.
 */
export function getRandomObjectId(): string {
    return new Types.ObjectId().toHexString();
}

/**
 * Generates an array of user IDs (20 by default) so we can reuse them
 * across multiple reactions.
 */
export function generateUserIdPool(count = 20): string[] {
    const userIds: string[] = [];
    for (let i = 0; i < count; i++) {
        userIds.push(getRandomObjectId());
    }
    return userIds;
}

/**
 * Returns a random userId from the provided pool. If none are available, returns a new ObjectId.
 *
 * @param userPool - Array of userId strings.
 * @returns A userId string.
 */
export function getRandomUserId(userPool: string[]): string {
    if (userPool.length === 0) return getRandomObjectId();
    const index = Math.floor(Math.random() * userPool.length);
    return userPool[index];
}

/**
 * Generates random reactions, optionally using shared userIds & messageIds.
 */
export function generateRandomReactions(
    count: number,
    messageIds: string[] = [],
    reactorUserIds: string[] = [],
    useRandomEventId = false,
    fixedEventId?: string
): IReaction[] {
    const reactions: IReaction[] = [];

    for (let i = 0; i < count; i++) {
        let targetMessageId: string;
        let content: string;
        let originalMessageUserId: string;

        if (messageIds.length > 0) {
            // pick a random existing message ID
            targetMessageId = getRandomItem(messageIds);
            // pick random content from the 100-sample list
            content = getRandomItem(SAMPLE_MESSAGES);
            // generate a random user for the original message
            originalMessageUserId = getRandomObjectId();
        } else {
            // fallback: no messageIds => fully synthetic
            targetMessageId = getRandomObjectId();
            content = getRandomItem(SAMPLE_MESSAGES);
            originalMessageUserId = getRandomObjectId();
        }

        // pick a reactor
        const reactorUserId =
            reactorUserIds.length > 0
                ? getRandomItem(reactorUserIds)
                : getRandomObjectId();

        // random emoji + timestamp
        const emoji = getRandomItem(SAMPLE_EMOJIS);
        const reactionTimestamp = getRandomTimestamp();

        let eventId: string | undefined;
        if (fixedEventId) {
            eventId = fixedEventId;
        } else if (useRandomEventId) {
            eventId = getRandomObjectId();
        }

        // build the final reaction
        reactions.push({
            eventId,
            targetMessageId,
            reactorUserId,
            emoji,
            reactionTimestamp,
            content,
            originalMessageUserId,
        });
    }

    return reactions;
}

/**
 * Fetches fan details from the configured endpoint.
 *
 * @param vendorEventId - The vendor event ID to use in the query string.
 * @param cookies - An object representing request cookies (to extract the access token).
 * @returns A Promise resolving to an array of FanDetailObject.
 *          If the fetch fails, it returns an empty array.
 */
export async function getFanDetails(
    vendorEventId: string | null,
    wildcardsAccessToken: string
): Promise<FanDetailObject[]> {
    try {
        if (!vendorEventId) {
            console.error("Error: Missing vendorEventId");
            return [];
        }
        const fanDetailsUrl = getFanDetailsUrl();
        const response = await axios.get(
            `${fanDetailsUrl}?VendorEventId=${vendorEventId}`,
            {
                headers: {
                    // Uncomment and use the token if needed:
                    Authorization: `Bearer ${wildcardsAccessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );
        const data = response.data;
        return data.FanInTheStandsDetail || [];
    } catch (error: any) {
        console.error("Error failed to fetch fan details:", error);
        return [];
    }
}

interface QueryParameters {
    vendorEventId?: string;
    stageId?: string;
    segment?: string;
    totalTokens: number;
    maxTokensPerUser: number;
    minimumTokenEligibilityThreshold: number;
}

export const logDistributionQueryParameters = (
    params: QueryParameters
): void => {
    const parameters = {
        "Vendor Event ID": params.vendorEventId || "Not provided",
        "Stage ID": params.stageId || "Not provided",
        Segment: params.segment || "Not provided",
        "Total Tokens": params.totalTokens,
        "Max Tokens Per User": params.maxTokensPerUser,
        "Minimum Token Eligibility Threshold":
            params.minimumTokenEligibilityThreshold,
    };

    console.log("\n=== Distribution Parameters ===");
    console.table(parameters);
    console.log("============================\n");
};

interface DataSources {
    messageScores?: any[];
    reactionScores?: any[];
    nftHoldingScores?: any[];
    boostScores?: any[];
}

/**
 * Logs data source availability and counts in a three-column table format.
 * @param dataSources Object containing arrays of different data sources
 */
export const logDataSources = (dataSources: DataSources): void => {
    const dataSourceStatus = {
        "Message Scores ": {
            Available: dataSources.messageScores?.length ? "✅" : "❌",
            Length: dataSources.messageScores?.length || 0,
        },
        "Reaction Scores": {
            Available: dataSources.reactionScores?.length ? "✅" : "❌",
            Length: dataSources.reactionScores?.length || 0,
        },
        "NFT Holdings   ": {
            Available: dataSources.nftHoldingScores?.length ? "✅" : "❌",
            Length: dataSources.nftHoldingScores?.length || 0,
        },
        "Boost Scores   ": {
            Available: dataSources.boostScores?.length ? "✅" : "❌",
            Length: dataSources.boostScores?.length || 0,
        },
    };

    console.log("\n=== Data Sources Status ===");
    console.table(dataSourceStatus);
    console.log("===========================\n");
};
