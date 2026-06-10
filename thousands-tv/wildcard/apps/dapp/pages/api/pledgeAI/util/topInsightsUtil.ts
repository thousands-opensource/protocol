import { IReaction } from "@repo/interfaces";
import {
    FanDetailObject,
    Insight,
    InsightsResponse,
    TokenDistributionResult,
    TopInsight,
} from "../types"; // adjust the import path as needed

export const UNKNOWN_USER_ID = "UNKNOWN"; // user ID placeholder (provided by LLM response)

export interface EnrichedInsight {
    metric: string;
    userId: string;
    summary: string;
    title: string;
    category: string;
    fanName: string;
    fanPfpUrl: string;
    allocatedTokens: number;
    data?: string; // additional field for extra data (e.g., best reaction comment)

    boostScore: number;
    chatScore: number;
    reactionScore: number;
    wildpassScore: number;
    primaryWalletAddress: string;
    creditsSpent: number;
}

/**
 * Enriches the basic insights with additional fan details and token allocation.
 *
 * @param insights - The basic insights array.
 * @param distributionResult - The full token distribution result.
 * @param fanDetails - An array of FanDetailObject containing additional fan information.
 * @returns An array of enriched insight objects.
 */
export function enrichInsights(
    insights: InsightsResponse,
    distributionResult: TokenDistributionResult,
    fanDetails: FanDetailObject[]
): EnrichedInsight[] {
    try {
        if (!Array.isArray(insights)) {
            console.warn(
                "Insights is not an array; returning empty enriched insights."
            );
            return [];
        }

        if (
            !distributionResult ||
            !Array.isArray(distributionResult.topUsers) ||
            distributionResult.topUsers.length === 0
        ) {
            console.warn(
                "Distribution result or its topUsers is missing; returning empty enriched insights."
            );
            return [];
        }

        // Build a lookup map from FanId to fan details.
        const fanMap = new Map<string, FanDetailObject>();
        if (Array.isArray(fanDetails) && fanDetails.length > 0) {
            fanDetails.forEach((fan) => {
                if (fan.FanId) {
                    fanMap.set(fan.FanId, fan);
                }
            });
        } else {
            console.warn(
                "fanDetails is empty; proceeding without fan enrichment."
            );
        }

        // Build a lookup map from userId to user info including scores
        const userMap = new Map<string, any>();
        distributionResult.topUsers.forEach((user) => {
            if (user.userId) {
                // Get primary wallet address
                const fan = fanMap.get(user.userId);
                const primaryWalletAddress = fan ? fan.WalletAddress : "";

                userMap.set(user.userId, {
                    allocatedTokens: user.allocatedTokens,
                    boostScore: user.scoreBreakdown?.boostScore || 0,
                    chatScore: user.scoreBreakdown?.messageScore || 0,
                    reactionScore: user.scoreBreakdown?.reactionScore || 0,
                    wildpassScore:
                        user.scoreBreakdown?.wildpassHoldingsScore || 0,
                    compositeScore: user.scoreBreakdown?.compositeScore || 0,
                    primaryWalletAddress,
                    creditsSpent: user.scoreBreakdown?.creditsSpent || 0,
                });
            }
        });

        // Process each insight and enrich with fan details, allocated tokens, and additional data.
        const enrichedInsights: EnrichedInsight[] = insights
            .filter(
                (insight) =>
                    insight.userId &&
                    insight.userId.trim() !== "" &&
                    insight.userId !== UNKNOWN_USER_ID
            )
            .map((insight: Insight) => {
                const fan = fanMap.get(insight.userId);
                const userInfo = userMap.get(insight.userId) || {};
                return {
                    metric: insight.category || "topInsights", // fallback if missing
                    userId: insight.userId,
                    summary: insight.summary || "",
                    title: insight.title || "",
                    category: insight.category || "topInsights",
                    fanName: fan ? fan.FanName : "",
                    fanPfpUrl: fan ? fan.FanPfpUrl : "",
                    allocatedTokens: userInfo.allocatedTokens || 0,
                    data: insight.data || "",

                    boostScore: userInfo.boostScore || 0,
                    chatScore: userInfo.chatScore || 0,
                    reactionScore: userInfo.reactionScore || 0,
                    wildpassScore: userInfo.wildpassScore || 0,
                    primaryWalletAddress: userInfo.primaryWalletAddress || "",
                    creditsSpent: userInfo.creditsSpent || 0,
                };
            });

        return enrichedInsights;
    } catch (error) {
        console.error("Error enriching insights:", error);
        return [];
    }
}

/**
 * Local processing to return the best reaction comment for the given user.
 * Choose the reaction with the longest content.
 *
 * @param userId - The user ID to search for.
 * @param reactions - An array of IReaction objects.
 * @returns The best reaction comment (or an empty string if none found).
 */
export function getBestReactionCommentForUser(
    userId: string,
    reactions: IReaction[]
): string {
    if (!Array.isArray(reactions)) {
        console.warn(`Expected reactions to be an array for user ${userId}.`);
        return "";
    }

    const userReactions = reactions.filter(
        (reaction) => reaction.reactorUserId === userId
    );
    if (userReactions.length === 0) return "";

    try {
        const bestReaction = userReactions.reduce((prev, curr) => {
            const prevLength = prev.content ? prev.content.length : 0;
            const currLength = curr.content ? curr.content.length : 0;
            return currLength > prevLength ? curr : prev;
        });
        return bestReaction.content || "";
    } catch (error) {
        console.error(
            `Error determining best reaction comment for user ${userId}:`,
            error
        );
        return "";
    }
}

/**
 * Returns an array of top insights for the top 10 users, sorted by composite score.
 * For each user, we include their allocatedTokens, score breakdown and best reaction comment (if available).
 */
export function getTopInsightsArray(
    distributionResult: TokenDistributionResult,
    chatReactions: IReaction[],
    noOfUsersForInsights: number
): TopInsight[] {
    try {
        if (
            !distributionResult ||
            !Array.isArray(distributionResult.topUsers)
        ) {
            console.warn(
                "Invalid distributionResult, returning empty insights array."
            );
            return [];
        }

        // Sort users by composite score descending (using fallback 0 if missing).
        const sortedUsers = distributionResult.topUsers.slice().sort((a, b) => {
            const scoreA = a.scoreBreakdown?.compositeScore || 0;
            const scoreB = b.scoreBreakdown?.compositeScore || 0;
            return scoreB - scoreA;
        });

        const topUsers = sortedUsers.slice(0, noOfUsersForInsights);
        // Compute the maximum reaction score among these top users.
        const maxReactionScore = Math.max(
            ...topUsers.map((u) => u.scoreBreakdown?.reactionScore || 0)
        );

        // Map each user to a TopInsight object.
        const insights: TopInsight[] = topUsers.map((user) => {
            const reactionScore = user.scoreBreakdown?.reactionScore || 0;
            // Only the user(s) with the maximum reaction score get their best reaction comment.
            const bestReaction =
                reactionScore === maxReactionScore
                    ? getBestReactionCommentForUser(user.userId, chatReactions)
                    : "";

            // Build a breakdown string from the score breakdown.
            const breakdown = `Boost: ${user.scoreBreakdown?.boostScore || 0
                }, NFT: ${user.scoreBreakdown?.wildpassHoldingsScore || 0
                }, Composite: ${user.scoreBreakdown?.compositeScore || 0}`;

            // Get wallet address from enhanced distribution if available
            const primaryWalletAddress = (user as any).walletAddress || "";

            return {
                userId: user.userId,
                fanName: (user as any).fanName || "",
                allocatedTokens: user.allocatedTokens,
                compositeScore: user.scoreBreakdown?.compositeScore || 0,
                breakdown,
                data: bestReaction,

                boostScore: user.scoreBreakdown?.boostScore || 0,
                chatScore: user.scoreBreakdown?.messageScore || 0,
                reactionScore: user.scoreBreakdown?.reactionScore || 0,
                wildpassScore: user.scoreBreakdown?.wildpassHoldingsScore || 0,
                primaryWalletAddress,
                creditsSpent: user.scoreBreakdown?.creditsSpent || 0,
            };
        });

        return insights;
    } catch (error) {
        console.error("Error in getTopInsightsArray:", error);
        return [];
    }
}

/**
 * Builds a prompt string for an LLM to generate concise, witty insights for the top 10 users.
 *
 * The LLM should return a JSON array of objects with the following properties:
 *   - "userId": string,
 *   - "summary": string,
 *   - "title": string,
 *   - "category": "topInsights",
 *   - "data": string (this field can contain additional context if needed).
 *
 * Definitions:
 *   - Boost Score: Reflects the user's generosity with donations.
 *   - NFT Holdings Score: Indicates a user's digital wealth.
 *   - Reaction Score: Measures how engaging a user's reactions are.
 *   - Message Score: Measures meaningful chat engagement.
 *   - Composite Score: The overall score combining all signals; the highest composite score identifies the MVP.
 *   - Second/Third/Fourth Composite: Represents the runners-up based on the composite score ranking.
 *   - For the top reaction score, include the user's best reaction comment as the "data" field.
 *
 * @param topInsights - An array of TopInsight objects.
 * @returns A prompt string to be sent to the LLM.
 */
export function buildInsightsPromptArray(topInsights: TopInsight[]): string {
    // Build a block for each top insight.
    const blocks = topInsights.map((insight, index) => {
        return `User ${index + 1}:
  UserId: "${insight.userId}"
  Fan Name: "${insight.fanName}"
  Allocated Tokens: ${insight.allocatedTokens}
  Composite Score: ${insight.compositeScore}
  Score Breakdown: ${insight.breakdown}
  Additional Data: "${insight.data || ""}"
  
Provide a witty remark for this user that reflects their performance as described above, but do NOT repeat the raw numbers in your remark.`;
    });

    const metricsSection = blocks.join("\n\n");

    return `
You are an analytical commentator for a live-stream platform. Based on the token distribution data provided below, please generate concise, witty one-line insights for each top user. Do NOT include any factual numbers or raw score data in the summary—only return a clever remark that reflects their performance.  Don't mention chats messages or reactions.

Definitions:
  - Boost Score: Reflects how much the user supported their team.  Make sure to use the word Rally instead of Boost.
  - NFT Holdings Score: Indicates a user's digital wealth.
  - Composite Score: The overall score combining all signals; the highest composite score identifies the MVP.
  - Second/Third/Fourth Composite: Represents the runners-up based on the composite score ranking.

Here are the top users:
${metricsSection}

Return your output strictly as a JSON array of objects (do not wrap the array in an object). Each object must have the following properties:
  - "userId": string,
  - "summary": string,
  - "title": string,
  - "category": "topInsights",
  - "data": string (this field can contain additional context if needed).

Example:
[
  {
    "userId": "string",
    "summary": "A witty remark!",
    "title": "Top Performer",
    "category": "topInsights",
    "data": "Context from score breakdown"
  },
  ...
]
`;
}

/**
 * Generates fallback insights from an array of TopInsight objects.
 * For each top insight, a default witty remark and title are provided based on the user's ranking.
 *
 * @param topInsights - An array of TopInsight objects.
 * @returns An array of fallback Insight objects.
 */
export function generateFallbackInsights(topInsights: TopInsight[]): Insight[] {
    return topInsights.map((insight, index) => {
        let defaultTitle = "";
        let defaultSummary = "";

        // Use rank-based fallback titles and summaries.
        if (index === 0) {
            defaultTitle = "Top Performer";
            defaultSummary = "Leading the pack with unrivaled excellence!";
        } else if (index === 1) {
            defaultTitle = "Runner Up";
            defaultSummary =
                "Close on the heels of the leader with remarkable impact!";
        } else if (index === 2) {
            defaultTitle = "Consistent Contributor";
            defaultSummary = "Steady and reliable, contributing consistently.";
        } else if (index === 3) {
            defaultTitle = "Strong Contender";
            defaultSummary = "A solid contender showing impressive effort.";
        } else {
            defaultTitle = "Participant";
            defaultSummary = "A notable contributor making their mark.";
        }

        return {
            userId: insight.userId,
            title: defaultTitle,
            summary: defaultSummary,
            category: "topInsights",
            data: insight.data || "",
        };
    });
}
