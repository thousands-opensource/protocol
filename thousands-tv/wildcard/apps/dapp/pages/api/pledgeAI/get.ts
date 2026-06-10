import { NextApiRequest, NextApiResponse } from "next";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import { validateEnhancedDistribution, parseFlexibleJSON } from "./llmLogic";
import { callAnthropicLLM } from "./lib/anthropicClient";
import { diContainer } from "@/inversify.config";
import IChatRepository from "@/repositories/interfaces/iChatRepository";
import { IChatMessage, IReaction } from "@repo/interfaces";
import { COOKIES_ACCESS_TOKEN_WILDCARD } from "@/utils/accountAPIUtil";
import IBoostRepository from "@/repositories/interfaces/iBoostRepository";
import { DistributionCompositeData, FanDetailObject, Insight } from "./types";
import { calculateUserCompositeScores } from "./calculateUserCompositeScore";
import {
    computeBoostScores,
    computeMessageScores,
    computeWildpassHoldingsScore,
    computeReactionScores,
    distributeTokensLocallyWithMinThreshold,
    enhanceDistributionLocally,
    mapChatReactions,
} from "./localDataProcessing";
import { getChatDataSegments } from "./util/chatDataUtil";
import {
    getFanDetails,
    logDataSources,
    logDistributionQueryParameters,
} from "./util/util";
import {
    buildInsightsPromptArray,
    enrichInsights,
    generateFallbackInsights,
    getTopInsightsArray,
} from "./util/topInsightsUtil";
import {
    getDistributableTokensWalletRecipientsJson,
    logTokenDistributionCSV,
} from "./util/tokenDistributionUtil";

/**
 * NextJS API Route Handler - GET Request only
 * @param req: request data via API Route
 * @param res: response data via API Route
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { method } = req;
        if (method !== "GET") {
            return sendApiResponse(res, {
                success: false,
                err: `Method ${method} Not Allowed`,
            });
        }

        const vendorEventId = req.query.vendorEventId as string | undefined;
        const stageId = req.query.stageId as string | undefined;
        const segment = req.query.segment as string | undefined;

        // Read distribution parameters from query (if provided)
        const totalTokensQuery = req.query.totalTokens as string | undefined;
        const maxTokensPerUserQuery = req.query.maxTokensPerUser as
            | string
            | undefined;
        const numberOfUsersDistributedQuery = req.query
            .numberOfUsersDistributed as string | undefined;

        // minimum threshold for a user to be eligible for tokens (based on the token distribution to be calculated)
        const minimumTokenEligibilityThresholdQuery = req.query
            .minimumTokenEligibilityThreshold as string | undefined;
        const MINIMUM_TOKEN_ELIGIBILITY_THRESHOLD =
            minimumTokenEligibilityThresholdQuery
                ? Number(minimumTokenEligibilityThresholdQuery)
                : 5;

        // Fallback to default values if not provided.
        const TOTAL_TOKENS = totalTokensQuery ? Number(totalTokensQuery) : 100;
        const MAX_TOKENS_PER_USER = maxTokensPerUserQuery
            ? Number(maxTokensPerUserQuery)
            : 50;
        const NUMBER_OF_USERS_DISTRIBUTED_MAX = 1000; // capped at 1000 users
        const NUMBER_OF_INSIGHT_USERS_MAX = 5;

        logDistributionQueryParameters({
            vendorEventId,
            stageId,
            segment,
            totalTokens: TOTAL_TOKENS,
            maxTokensPerUser: MAX_TOKENS_PER_USER,
            minimumTokenEligibilityThreshold:
                MINIMUM_TOKEN_ELIGIBILITY_THRESHOLD,
        });

        if (!stageId || !segment || !vendorEventId) {
            console.error("Invalid request payload");
            return sendApiResponse(res, {
                success: false,
                err: "Invalid request payload",
            });
        }

        // Get repositories from DI container.
        const chatRepository: IChatRepository =
            diContainer.get("IChatRepository");
        const boostRepository: IBoostRepository =
            diContainer.get("IBoostRepository");

        const segmentNum = Number(segment);
        const isTestMode = false; // Toggle test mode for stress testing if needed

        const segments = await getChatDataSegments({
            isTestMode,
            stageId,
            vendorEventId,
            segment: segmentNum,
            chatRepository,
            boostRepository,
        });

        // Instead of throwing an error, log warnings and substitute empty arrays
        //const chatMessagesSegments = segments.chatMessagesSegments;
        const chatReactionsSegment = segments.chatReactionsSegments;
        const boostsSegment = segments.boostsSegments;

        /*
        if (!chatMessagesSegments) {
            console.warn(
                "Chat message segment is missing; defaulting to empty array."
            );
        }
        */
        if (!chatReactionsSegment) {
            console.warn(
                "Chat reaction segment is missing; defaulting to empty array."
            );
        }
        if (!boostsSegment) {
            console.warn(
                "Boosts segment is missing; defaulting to empty array."
            );
        }

        /*
        const chatMessages: IChatMessage[] = chatMessagesSegments
            ? chatMessagesSegments.chatMessages.map((chatMessage) => ({
                  eventId: chatMessage.stageId,
                  userId: chatMessage.userId,
                  content: chatMessage.message,
                  timestamp: chatMessage.timestamp,
              }))
            : [];
        */
        /**
         * local utility functions to calculate scores (off boarded from LLM)
         * @dev - view the local utility functions in the `localDataProcessing.ts` on how the scores are calculated
         */
        /*
        const computedMessageScores = computeMessageScores(chatMessages);
        const messageAgentResponse = {
            scores: computedMessageScores.map((score) => ({
                userId: score.userId,
                meaningfulMessageCount: score.meaningfulMessageCount,
                averageMessageLength: score.averageMessageLength,
                spamCount: score.spamCount,
                messageScore: score.messageScore,
            })),
        };
        */

        const mappedReactions: IReaction[] = chatReactionsSegment
            ? mapChatReactions(chatReactionsSegment.chatReactions)
            : [];
        const computedReactionScores = computeReactionScores(mappedReactions);
        const computedBoostScores = boostsSegment
            ? computeBoostScores(boostsSegment.boosts)
            : [];

        //const messageScores = messageAgentResponse.scores;
        const reactionScores = computedReactionScores;
        const boostsScores = computedBoostScores;

        let fanDetails: FanDetailObject[] = [];
        const wildcardAccessToken =
            req.cookies[COOKIES_ACCESS_TOKEN_WILDCARD] || "";

        // get fan details
        fanDetails = await getFanDetails(vendorEventId, wildcardAccessToken);

        // @dev - current usee case of nft holdings is calculated via local utility function
        const { normalizedNftsHoldingScores } =
            computeWildpassHoldingsScore(fanDetails);

        // 4. Response from the LLM / Data source agent
        const allNftHoldingScores = normalizedNftsHoldingScores.scores;

        // Optional: If no scores were computed at all, you might return an empty response.
        if (
            (!reactionScores || reactionScores.length === 0) &&
            //(!messageScores || messageScores.length === 0) &&
            (!boostsScores || boostsScores.length === 0)
        ) {
            console.warn("No scores computed from available data.");
            return sendApiResponse(res, {
                success: true,
                data: {
                    insights: [],
                    distributionResult: {},
                    totalTokens: TOTAL_TOKENS,
                    maxTokensPerUser: MAX_TOKENS_PER_USER,
                    noOfUsersDistributed: NUMBER_OF_USERS_DISTRIBUTED_MAX,
                    message: "No data available to compute insights.",
                },
            });
        }

        //==============================| DISTRIBUTION AGENT |==================================

        logDataSources({
            //messageScores,
            reactionScores,
            nftHoldingScores: allNftHoldingScores,
            boostScores: boostsScores,
        });

        // Compute composite scores deterministically using your local function:
        const compositeScores = calculateUserCompositeScores(
            //messageScores,
            reactionScores,
            allNftHoldingScores,
            boostsScores
        );

        // Filter composite scores to only include users whose fan details indicate they have a valid wallet address.
        const whiteListedUserCompositeScores = compositeScores.filter(
            (score) => {
                const fan = fanDetails.find((f) => f.FanId === score.userId);
                return fan ? fan.HasWalletAddress : false;
            }
        );

        console.log(
            "Filtered composite scores (eligible users):",
            whiteListedUserCompositeScores
        );

        // console.log("compositeScores 🏁", compositeScores);

        const distributionResult = distributeTokensLocallyWithMinThreshold(
            whiteListedUserCompositeScores,
            TOTAL_TOKENS,
            MAX_TOKENS_PER_USER,
            MINIMUM_TOKEN_ELIGIBILITY_THRESHOLD
        );

        // Server logs for debugging
        console.log(
            `***EventId: ${vendorEventId} | StageId: ${stageId}: identified ${
                distributionResult?.topUsers?.length || 0
            } users for token distribution***`
        );
        /*
        console.log(
            "message score:",
            messageScores,
            "processed raw messages",
            chatMessages.length
        );
        */
        console.log("reaction score:", reactionScores);
        console.log("boosts score:", boostsScores);
        console.log("Total number of users:", boostsScores.length);
        console.log("fan details:", normalizedNftsHoldingScores.scores);

        // Calculate basic insights from the distribution result.
        const topInsightsArray = getTopInsightsArray(
            distributionResult,
            mappedReactions,
            NUMBER_OF_INSIGHT_USERS_MAX
        );

        // console.log("Top insights array:", topInsightsArray);

        // Build prompt for generating witty insights.
        const insightsPrompt = buildInsightsPromptArray(topInsightsArray);
        // console.log("Insights prompt:", insightsPrompt);

        // Call the LLM to generate insights.
        const insightsLLMResponse = await callAnthropicLLM(insightsPrompt);
        const insightsRawText = insightsLLMResponse.content[0]?.text?.trim();
        // console.log("LLM insights response:", insightsRawText);
        let insights: Insight[];
        try {
            insights = parseFlexibleJSON(insightsRawText);
            if (!Array.isArray(insights) || insights.length === 0) {
                console.warn(
                    "LLM insights are empty; using fallback insights."
                );
                insights = generateFallbackInsights(topInsightsArray);
            }
        } catch (err) {
            console.error(
                "Failed to parse insights JSON output:",
                insightsRawText
            );
            console.log(`Generating fallback insights...`);
            insights = generateFallbackInsights(topInsightsArray);
        }

        // ===== ENHANCEMENT: Distribute tokens to users including FanId, FanName and Wallet Address  =====
        const enrichedInsights = enrichInsights(
            insights,
            distributionResult,
            fanDetails
        );

        // ===== ENHANCEMENT: Enhance distribution result locally with FanId, FanName, and Wallet Address =====
        const enhancedDistributionResult = enhanceDistributionLocally(
            distributionResult,
            fanDetails
        );

        // Validate the enhanced result (token distribution) using the local result.
        const isValidEnhancedDistribution = validateEnhancedDistribution(
            enhancedDistributionResult,
            distributionResult
        );

        // Validate the enhanced result (token distribution)
        if (!isValidEnhancedDistribution) {
            throw new Error(
                "Enhanced distribution data type failed to validate against the original distribution data."
            );
        }

        // Get wallet recipients from distribution data
        const walletRecipients = getDistributableTokensWalletRecipientsJson(
            enhancedDistributionResult
        );

        // Log the token distribution data to MongoDB
        await logTokenDistributionCSV(
            vendorEventId,
            enhancedDistributionResult
        );

        const distributionResponse: DistributionCompositeData = {
            insights: enrichedInsights,
            distributionResult: enhancedDistributionResult,
            totalTokens: TOTAL_TOKENS,
            maxTokensPerUser: MAX_TOKENS_PER_USER,
            noOfUsersDistributed: NUMBER_OF_USERS_DISTRIBUTED_MAX,
            walletRecipients: walletRecipients || [],
        };

        console.log(
            `EventId: ${vendorEventId} | StageId: ${stageId}: AI Referee successfully computed insights and distribution token data`
        );

        return sendApiResponse(res, {
            success: true,
            data: distributionResponse,
        });
    } catch (error: any) {
        sendApiResponse(res, {
            success: false,
            data: {},
            err: error.message || "Unknown error",
        });
    }
}

export default handler;
