import { scoringConfig } from "./lib/scoreConfig";
import {
    ComputedMessageScore,
    ComputedReactionScore,
} from "./localDataProcessing";
import { WildpassHoldingsScore, BoostScore } from "./types";

export interface UserCompositeScore {
    userId: string;
    messageScore: number; // Normalized message score (0–100)
    reactionScore: number; // Normalized reaction score (0–100)
    nftHoldingsScore: number; // Normalized NFT holdings score (0–100)
    boostScore: number; // Normalized boost score (0–100)
    compositeScore: number; // Weighted average composite score (0–100)
    creditsSpent: number; // Raw total boost amount without scaling
}

// Define partial weights for messages:
const MESSAGE_WEIGHTS = {
    meaningful: 0.4,
    length: 0.3,
    spam: -0.3,
};

/**
 * Calculate the composite scores for each user deterministically using weighted averages.
 * @dev - The composite score uses weighted avaerages (formula. The below is the algo. equivalent given Claude/ OpenAI calculation are not deterministic and may vary)
 *
 * For each user:
 *   1. Compute raw scores for each signal and normalize them.
 *   2. Compute the composite score as a weighted average using the global priorities:
 *
 *      compositeScore = (messageNorm × P_m + reactionNorm × P_r + nftNorm × P_n + boostNorm × P_b) / (P_m + P_r + P_n + P_b)
 *
 * @param messageScores - Array of computed message scores.
 * @param reactionScores - Array of computed reaction scores.
 * @param nftHoldingScores - Array of computed NFT holdings scores.
 * @param boostScores - Array of computed boost scores.
 * @returns An array of user composite scores.
 */
export function calculateUserCompositeScores(
    //messageScores: ComputedMessageScore[],
    reactionScores: ComputedReactionScore[],
    nftHoldingScores: WildpassHoldingsScore[],
    boostScores: BoostScore[]
): UserCompositeScore[] {
    // Build a map keyed by userId to merge scores
    const userMap = new Map<string, Partial<UserCompositeScore>>();

    // Process message scores
    /*
    for (const messageScore of messageScores) {
        const existing = userMap.get(messageScore.userId) || {};

        existing.messageScore = messageScore.messageScore;
        existing.userId = messageScore.userId;
        userMap.set(messageScore.userId, existing);
    }
    */

    // Process reaction scores
    for (const reactionScore of reactionScores) {
        const existing = userMap.get(reactionScore.userId) || {};

        existing.reactionScore = reactionScore.reactionScore;
        existing.userId = reactionScore.userId;
        userMap.set(reactionScore.userId, existing);
    }

    // Process NFT holdings scores
    // Use the pre-computed normalized nftHoldingsScore
    for (const nftHoldingScore of nftHoldingScores) {
        const existing = userMap.get(nftHoldingScore.userId) || {};
        existing.nftHoldingsScore =
            nftHoldingScore.totalSumWildpassHoldingsAmounts;
        existing.userId = nftHoldingScore.userId;
        userMap.set(nftHoldingScore.userId, existing);
    }

    // Process boost scores
    for (const boostScore of boostScores) {
        const existing = userMap.get(boostScore.userId) || {};
        existing.boostScore = boostScore.boostScore;
        existing.userId = boostScore.userId;
        existing.creditsSpent = boostScore.creditsSpent;
        userMap.set(boostScore.userId, existing);
    }

    // Global priorities from config. (weights)
    //const messagePriority = scoringConfig.rankingPriority.messages;
    const reactionPriority = scoringConfig.rankingPriority.reactions;
    const nftHoldingsPriority = scoringConfig.rankingPriority.nftHoldings;
    const boostPriority = scoringConfig.rankingPriority.boost;
    const sumOfAllPriorities =
        //messagePriority +
        reactionPriority + nftHoldingsPriority + boostPriority;

    const result: UserCompositeScore[] = [];
    for (const [userId, scores] of Array.from(userMap.entries())) {
        const messageScore = scores.messageScore ?? 0;
        const reactionScore = scores.reactionScore ?? 0;
        const nftHoldingsScore = scores.nftHoldingsScore ?? 0;
        const boostScore = scores.boostScore ?? 0;
        const composite =
            /*messageScore * messagePriority +*/
            (reactionScore * reactionPriority +
                nftHoldingsScore * nftHoldingsPriority +
                boostScore * boostPriority) /
            sumOfAllPriorities;

        result.push({
            userId,
            messageScore,
            reactionScore,
            nftHoldingsScore,
            boostScore,
            compositeScore: composite,
            creditsSpent: scores.creditsSpent ?? 0,
        });
    }
    return result;
}
