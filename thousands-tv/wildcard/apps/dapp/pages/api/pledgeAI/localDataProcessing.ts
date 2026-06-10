import { Boost, ChatReaction, IChatMessage, IReaction } from "@repo/interfaces";
import {
    applyRandomScaling,
    PreprocessorType,
    scoringConfig,
} from "./lib/scoreConfig";
import {
    BoostScore,
    EnhancedDistributionResult,
    EnhancedUserDistribution,
    FanDetail,
    FanDetailObject,
    TokenDistributionResult,
    UserTokenDistribution,
    WildpassHoldingsScore,
} from "./types";
import { UserCompositeScore } from "./calculateUserCompositeScore";
import { UNKNOWN_USER_ID } from "./util/topInsightsUtil";

export interface ComputedMessageScore {
    userId: string;
    meaningfulMessageCount: number;
    averageMessageLength: number;
    spamCount: number;
    messageScore: number; // Normalized score (0-100) after applying the config (e.g., based on message length)
}

/**
 * Represents the computed reaction score for a user.
 */
export interface ComputedReactionScore {
    userId: string;
    uniqueReactorsCount: number;
    reactionScore: number; // normalized score (percentage)
}

/**
 * Processes an array of chat messages and computes per-user scores.
 *
 * For each user:
 *  - Counts the number of meaningful messages.
 *  - Computes the average message length.
 *  - Counts the number of spam messages.
 *  - Then calculates a raw message score using:
 *       rawMessageScore = (meaningfulMessageCount × 0.4) + (averageMessageLength × 0.3) - (spamCount × 0.3)
 *  - Determine the maximum raw message score **before applying scaling**.
 *  - A random scaling factor (in [1.05, 1.08]) is applied:
 *       scaledScore = rawScore^(randomFactor)
 *  - Determine the maximum **scaled** message score across all users.
 *  - Normalize each user's scaled message score as a percentage of this maximum.
 *
 * @param messages - The array of chat messages.
 * @returns An array of computed message scores per user.
 */
export function computeMessageScores(
    messages: IChatMessage[]
): ComputedMessageScore[] {
    // Aggregate raw data per user.
    const userData: Record<
        string,
        { count: number; totalLength: number; spam: number }
    > = {};

    messages.forEach((msg) => {
        const userId = msg.userId;
        if (!userData[userId]) {
            userData[userId] = { count: 0, totalLength: 0, spam: 0 };
        }
        userData[userId].count += 1;
        userData[userId].totalLength += msg.content.length;
        if (msg.content.length < 5) {
            userData[userId].spam += 1;
        }
    });

    // Compute raw message scores and find the max **before scaling**.
    const rawScores: Record<string, number> = {};
    let maxRawMessageScore = 0;

    for (const userId in userData) {
        const { count, totalLength, spam } = userData[userId];
        const averageLength = count > 0 ? totalLength / count : 0;
        let rawScore = count * 0.4 + averageLength * 0.3 - spam * 0.3;
        rawScore = Math.min(
            rawScore,
            scoringConfig.message.meaningful.maxScore
        );
        rawScores[userId] = rawScore;
        if (rawScore > maxRawMessageScore) {
            maxRawMessageScore = rawScore;
        }
    }

    // Step 3: Apply scaling AFTER knowing the max raw message score.
    const scaledScores: Record<string, number> = {};
    for (const userId in rawScores) {
        scaledScores[userId] = applyRandomScaling(
            PreprocessorType.MESSAGES,
            rawScores[userId]
        );
    }

    // Step 4: Find the max scaled score.
    const maxScaledScore = Math.max(...Object.values(scaledScores), 0);
    console.log(`Max scaled message score: ${maxScaledScore}`);

    // Step 5: Normalize each user's scaled message score as a percentage of max scaled score.
    const result: ComputedMessageScore[] = [];
    for (const userId in userData) {
        const { count, totalLength, spam } = userData[userId];
        const averageLength = count > 0 ? totalLength / count : 0;
        const normalized =
            maxScaledScore > 0
                ? (scaledScores[userId] / maxScaledScore) * 100
                : 0;
        result.push({
            userId,
            meaningfulMessageCount: count,
            averageMessageLength: averageLength,
            spamCount: spam,
            messageScore: normalized,
        });
    }

    console.log(`Total users messages: ${result.length}`);
    return result;
}

// ============  Reactions ============

/**
 * Computes per-user reaction scores from an array of reactions using dynamic normalization.
 *
 * For each reaction:
 *  - Count each unique reaction from a user.
 *  - Determine the maximum raw reaction score **before applying scaling**.
 *  - Compute each user's scaled reaction score using:
 *      scaledScore = rawScore^(randomFactor)
 *    where randomFactor is randomly chosen in [1.05, 1.08] for reactions.
 *  - Determine the maximum **scaled** reaction score across all users.
 *  - Normalize each user's scaled reaction score as a percentage of this maximum.
 *
 * @param reactions - Array of IReaction objects.
 * @returns An array of computed reaction scores.
 */
export function computeReactionScores(
    reactions: IReaction[]
): ComputedReactionScore[] {
    if (!reactions || reactions.length === 0) {
        console.log(
            "No reactions found, returning empty reaction scores array"
        );
        return [];
    }

    // Aggregate unique reactor counts per user.
    const userData: Record<string, number> = {};
    reactions.forEach((reaction) => {
        const userId = reaction.reactorUserId;
        if (!userId) {
            return;
        }
        if (!userData[userId]) {
            userData[userId] = 0;
        }
        userData[userId] += 1;
    });

    if (Object.keys(userData).length === 0) {
        console.log("No valid user reactions found, returning empty array");
        return [];
    }

    // Find the maximum raw reaction score BEFORE applying scaling.
    const maxRawReactionScore = Math.max(...Object.values(userData), 0);
    console.log(`Max raw reaction score: ${maxRawReactionScore}`);

    // Apply scaling after knowing the max raw reaction score.
    const scaledScores: Record<string, number> = {};
    for (const userId in userData) {
        const rawReaction =
            userData[userId] * scoringConfig.reaction.uniqueReactors.scale;
        const scaledScore = rawReaction;
        scaledScores[userId] = scaledScore;
    }

    // Find the total scaled reaction score after applying scaling.
    const totalScaledReactionScore = Object.values(scaledScores).reduce(
        (accumulator, currentvalue) => accumulator + currentvalue
    ); //Math.max(...Object.values(scaledScores), 0);
    console.log(`Total scaled reaction score: ${totalScaledReactionScore}`);

    // Normalize each user's scaled reaction score as a percentage of the total scaled reaction score.
    const result: ComputedReactionScore[] = [];
    for (const userId in scaledScores) {
        const normalizedScore =
            totalScaledReactionScore > 0
                ? (scaledScores[userId] / totalScaledReactionScore) * 100
                : 0;

        result.push({
            userId,
            uniqueReactorsCount: userData[userId],
            reactionScore: normalizedScore,
        });
    }

    console.log(
        `Total users who made reactions: ${result.length}. Total reactions: ${reactions.length}`
    );
    return result;
}

/**
 * Converts a ChatReaction object to an IReaction object.
 *
 * Since ChatReaction lacks targetMessageId, content, and reactorUserId,
 * we map them as follows:
 * - targetMessageId: set to an empty string (or derive it if possible)
 * - content: use originalMessage
 * - reactorUserId: use userId
 *
 * @param reaction A ChatReaction object.
 * @returns An IReaction object.
 */
export function mapChatReactionToIReaction(reaction: ChatReaction): IReaction {
    return {
        eventId: reaction.stageId,
        targetMessageId: "", // default empty string,
        content: reaction.originalMessage, // use originalMessage as content
        originalMessageUserId: reaction.originalMessageUserId,
        reactorUserId: reaction.userId, // use userId as reactorUserId
        emoji: reaction.emoji,
        reactionTimestamp: reaction.timestamp,
    };
}

/**
 * Converts an array of ChatReaction objects to an array of IReaction objects.
 *
 * @param reactions An array of ChatReaction objects.
 * @returns An array of IReaction objects.
 */
export function mapChatReactions(reactions: ChatReaction[]): IReaction[] {
    return reactions.map(mapChatReactionToIReaction);
}

//====== Calculate Boost Score ======

/**
 * Compute per-user boost scores deterministically with random scaling and dynamic normalization.
 *
 * For each user:
 *  - Sum all boostAmount values (each multiplied by scoringConfig.boost.scale).
 *  - Determine the maximum raw boost score **before applying scaling**.
 *  - Compute each user's scaled boost using:
 *      scaledBoost = rawBoost^(randomFactor)
 *    where randomFactor is randomly chosen in [1.05, 1.08] for boosts.
 *  - Determine the maximum **scaled** boost score across all users.
 *  - Normalize each user's scaled boost as a percentage of this maximum.
 *
 * @param boosts - An array of Boost objects.
 * @returns An array of computed boost scores per user.
 */
export function computeBoostScores(boosts: Boost[]): BoostScore[] {
    // Early return if there are no boosts
    if (!boosts || boosts.length === 0) {
        console.log("No boosts found, returning empty boost scores array");
        return [];
    }

    const userData: Record<string, number> = {};

    // Calculate raw credits spent (without scaling)
    const userCreditsSpent = calculateTotalCreditsSpent(boosts);

    // Sum raw boost amounts per user with scaling for boost score calculation
    boosts.forEach((boost) => {
        const userId = boost.userId;
        if (!userId) {
            return;
        }
        if (!userData[userId]) {
            userData[userId] = 0;
        }
        userData[userId] += boost.boostAmount * scoringConfig.boost.scale;
    });

    if (Object.keys(userData).length === 0) {
        console.log("No valid user boosts found, returning empty array");
        return [];
    }

    // Find the maximum raw boost score BEFORE applying scaling.
    const maxRawBoostScore = Math.max(...Object.values(userData), 0);
    console.log(`Max raw boost score: ${maxRawBoostScore}`);

    // Apply scaling after knowing the max raw boost score.
    const scaledBoosts: Record<string, number> = {};
    for (const userId in userData) {
        const rawBoost = userData[userId];
        // Apply random scaling for boost type.
        /*
        const scaledBoost = applyRandomScaling(
            PreprocessorType.BOOST,
            rawBoost
        );
        */
        const scaledBoost = rawBoost;
        scaledBoosts[userId] = scaledBoost;
    }

    // Find the total of scaled boost score after applying scaling.
    const totalScaledBoostScore = Object.values(scaledBoosts).reduce(
        (accumulator, currentvalue) => accumulator + currentvalue
    );

    console.log(`Total scaled boost score: ${totalScaledBoostScore}`);

    // Normalize each user's scaled boost as a percentage of the max scaled boost.
    const result: BoostScore[] = [];
    for (const userId in scaledBoosts) {
        const normalizedBoost =
            totalScaledBoostScore > 0
                ? (scaledBoosts[userId] / totalScaledBoostScore) * 100
                : 0;
        result.push({
            userId,
            totalSumBoostAmounts: userData[userId],
            boostScore: normalizedBoost,
            creditsSpent: userCreditsSpent[userId] || 0,
        });
    }

    console.log(
        `Total users with boosts: ${result.length}. Total boosts: ${boosts.length}`
    );
    return result;
}

/**
 * Calculates the total raw credits spent (total boost amounts) per user.
 *
 * This function simply sums up all boost amounts for each user without
 * any scaling or normalization, giving the raw total credits spent.
 *
 * @param boosts - An array of Boost objects.
 * @returns A record mapping userId to total raw credits spent.
 */
export function calculateTotalCreditsSpent(
    boosts: Boost[]
): Record<string, number> {
    const userCredits: Record<string, number> = {};

    // Sum raw boost amounts per user without scaling
    boosts.forEach((boost) => {
        const userId = boost.userId;
        if (!userCredits[userId]) {
            userCredits[userId] = 0;
        }
        userCredits[userId] += boost.boostAmount;
    });

    return userCredits;
}

/**
 * Computes per-user NFT holdings scores using fan details.
 *
 * For each fan:
 *  - Calculate the raw NFT holdings count as the sum of the number of Wildpasses.
 *  - Determine the **maximum raw NFT holdings count before applying scaling**.
 *  - Apply random scaling to the raw count using:
 *      scaledScore = rawScore^(randomFactor)
 *    where randomFactor is randomly chosen in [1.08, 1.09] for NFT holdings.
 *  - Determine the maximum scaled NFT score across all fans.
 *  - Normalize each user's scaled score as a percentage of this maximum.
 *
 * @param fanDetails - An array of FanDetailObject containing NFT holdings data.
 * @dev - primarily focuses on the Wildpass holdings.
 * @returns An object with the computed NFT holdings scores, in the format:
 *          { normalizedNftsHoldingScores: { scores: WildpassHoldingsScore[] } }
 */
export function computeWildpassHoldingsScore(fanDetails: FanDetailObject[]): {
    normalizedNftsHoldingScores: { scores: WildpassHoldingsScore[] };
} {
    // Step 1: Aggregate raw NFT holdings count per user.
    const userData: Record<string, number> = {};
    let maxRawScore = 0;
    let maxRawScoreFanId = ""; // @dev- Track the FanId with the highest raw score (for logging/ verification)
    fanDetails.forEach((fan) => {
        if (!fan.FanId) return;
        const wildpassesCount = Array.isArray(fan.Wildpasses)
            ? fan.Wildpasses.length
            : 0;
        const rawCount = wildpassesCount;
        if (rawCount > 0) {
            if (rawCount > maxRawScore) {
                maxRawScore = rawCount;
                maxRawScoreFanId = fan.FanId;
            }
        }
        userData[fan.FanId] = rawCount;
    });
    // Apply random scaling **after knowing maxRawScore**.
    const scaledScores: Record<string, number> = {};
    for (const userId in userData) {
        /*
        scaledScores[userId] = applyRandomScaling(
            PreprocessorType.NFT_HOLDINGS,
            userData[userId]
        );
        */
        scaledScores[userId] = userData[userId];
    }
    // Find the total **scaled** NFT holdings score.
    const totalScaledScore = Object.values(scaledScores).reduce(
        (accumulator, currentvalue) => accumulator + currentvalue
    ); //Math.max(...Object.values(scaledScores), 0);
    console.log(`Total scaled NFT score: ${totalScaledScore}`);
    console.log(
        `Highest NFT score: ${maxRawScore} from userId: ${maxRawScoreFanId}`
    );

    // Normalize each user's scaled NFT holdings score as a percentage.
    const scores: WildpassHoldingsScore[] = [];
    for (const userId in scaledScores) {
        const normalizedScore =
            totalScaledScore > 0
                ? (scaledScores[userId] / totalScaledScore) * 100
                : 0;
        scores.push({
            userId,
            totalSumWildpassHoldingsAmounts: normalizedScore, // This is the normalized score
        });
    }

    return { normalizedNftsHoldingScores: { scores } };
}

/**
 * Distributes tokens among users using the Hamilton method for proportional allocation.
 * @dev - AI distribution logic - reverse engineered for local data processing (allowing for deterministic results)
 * but only includes users whose exact (proportional) allocation meets or exceeds a given minimum threshold.
 * @url - https://en.wikipedia.org/wiki/Hamilton_method
 *
 * The AI Referee Dist. logic algorithm works as follows:
 * 1. Optionally, limit the number of users to a maximum (e.g., 500).
 * 2. Compute the sum of composite scores for all eligible users.
 * 3. For each user, compute the exact proportional allocation:
 *      exactAllocation = (user.compositeScore / totalComposite) * totalTokens
 * 4. Filter out any user whose exact allocation is below minTokensThreshold.
 * 5. Recompute the total composite score for the remaining users and recalculate exact allocations.
 * 6. For each remaining user, assign an initial allocation as the floor of the exact allocation,
 *    capped at maxTokensPerUser.
 * 7. Compute the leftover tokens and distribute them one-by-one in order of largest fractional remainder,
 *    provided the user has not reached maxTokensPerUser.
 *
 * @param compositeScores - Array of composite scores for each user.
 * @param totalTokens - Total tokens available for distribution.
 * @param maxTokensPerUser - Maximum tokens any user can receive.
 * @param minTokensThreshold - Minimum tokens a user must receive to be considered.
 * @param maxUsers - Maximum number of users to consider (default 500).
 * @returns A TokenDistributionResult object with token allocations.
 */
export function distributeTokensLocallyWithMinThreshold(
    compositeScores: UserCompositeScore[],
    totalTokens: number,
    maxTokensPerUser: number,
    minTokensThreshold: number,
    maxUsers: number = 500
): TokenDistributionResult {
    // 1. Limit users to maxUsers (sorted descending by composite score).
    let eligibleUsers = compositeScores
        .slice()
        .sort((a, b) => b.compositeScore - a.compositeScore)
        .slice(0, maxUsers);

    // 2. Compute the total composite score.
    let totalComposite = eligibleUsers.reduce(
        (sum, user) => sum + user.compositeScore,
        0
    );

    // 3. Compute each user's exact allocation.
    const computeExactAllocations = (
        users: UserCompositeScore[],
        totalComp: number
    ) => {
        return users.map((user) => ({
            user,
            exact: (user.compositeScore / totalComp) * totalTokens,
        }));
    };

    let allocations = computeExactAllocations(eligibleUsers, totalComposite);

    // 4. Filter out users who would receive less than the minimum tokens threshold.
    //    If any users are removed, recalc the total composite score and exact allocations.
    const filteredAllocations = allocations.filter(
        (a) => a.exact >= minTokensThreshold
    );

    if (filteredAllocations.length !== allocations.length) {
        eligibleUsers = filteredAllocations.map((a) => a.user);
        totalComposite = eligibleUsers.reduce(
            (sum, user) => sum + user.compositeScore,
            0
        );
        allocations = computeExactAllocations(eligibleUsers, totalComposite);
    }

    // 5. For each remaining user, assign the initial allocation as the floor of the exact allocation (capped).
    interface Allocation {
        user: UserCompositeScore;
        exact: number;
        floorAlloc: number;
        remainder: number;
    }
    const finalAllocations: Allocation[] = allocations.map((a) => {
        const floorAlloc = Math.min(Math.floor(a.exact), maxTokensPerUser);
        return {
            user: a.user,
            exact: a.exact,
            floorAlloc,
            remainder: a.exact - Math.floor(a.exact),
        };
    });

    // 6. Sum the initial allocations.
    let allocatedSum = finalAllocations.reduce(
        (sum, a) => sum + a.floorAlloc,
        0
    );
    let leftover = totalTokens - allocatedSum;

    // 7. Distribute leftover tokens based on the highest fractional remainders.
    while (leftover > 0) {
        // Sort allocations descending by remainder.
        finalAllocations.sort((a, b) => b.remainder - a.remainder);
        let allocatedThisRound = false;
        for (const alloc of finalAllocations) {
            if (alloc.floorAlloc < maxTokensPerUser) {
                alloc.floorAlloc += 1;
                leftover -= 1;
                allocatedThisRound = true;
                if (leftover === 0) break;
            }
        }
        // If no allocation was possible (all users reached maxTokensPerUser), break out.
        if (!allocatedThisRound) break;
    }

    // 8. Build the final result array.
    const resultUsers: UserTokenDistribution[] = finalAllocations.map(
        (alloc) => ({
            userId: alloc.user.userId,
            allocatedTokens: alloc.floorAlloc,
            scoreBreakdown: {
                boostScore: alloc.user.boostScore,
                // Map our computed nftHoldingsScore to the expected field wildpassHoldingsScore.
                wildpassHoldingsScore: alloc.user.nftHoldingsScore,
                reactionScore: alloc.user.reactionScore,
                messageScore: alloc.user.messageScore,
                compositeScore: alloc.user.compositeScore,
                // For totalScore, you could simply copy compositeScore (or compute a different aggregate if needed).
                totalScore: alloc.user.compositeScore,
                creditsSpent: alloc.user.creditsSpent || 0,
            },
        })
    );

    return {
        topUsers: resultUsers,
        totalTokensDistributed: totalTokens,
    };
}

/**
 * Enhances the distribution result by mapping fan details to each user.
 *
 * For each user in the distributionResult.topUsers, this function looks up a matching fan
 * in the provided fanDetails (using a case-insensitive comparison on FanId/userId). If a match is found,
 * it copies the fanId, fanName, and walletAddress from the fan detail; otherwise, it sets these fields to "UNKNOWN".
 *
 * @param distributionResult - The original token distribution result.
 * @param fanDetails - An array of fan details.
 * @returns An EnhancedDistributionResult with fan details merged in.
 */
export function enhanceDistributionLocally(
    distributionResult: TokenDistributionResult,
    fanDetails: FanDetail[]
): EnhancedDistributionResult {
    // Create a lookup map from normalized FanId to fan detail.
    const fanDetailsMap = new Map<
        string,
        { fanId: string; fanName: string; walletAddress: string }
    >(
        fanDetails.map((fan) => [
            fan.FanId.trim().toLowerCase(),
            {
                fanId: fan.FanId,
                fanName: fan.FanName,
                walletAddress: fan.WalletAddress,
            },
        ])
    );

    // Enhance each distribution user by matching the normalized userId with the fan details.
    const enhancedTopUsers: EnhancedUserDistribution[] =
        distributionResult.topUsers.map((distUser) => {
            const normalizedUserId = distUser.userId.trim().toLowerCase();
            const fanDetail = fanDetailsMap.get(normalizedUserId);
            return {
                ...distUser,
                fanId: fanDetail ? fanDetail.fanId : UNKNOWN_USER_ID,
                fanName: fanDetail ? fanDetail.fanName : UNKNOWN_USER_ID,
                walletAddress: fanDetail
                    ? fanDetail.walletAddress
                    : UNKNOWN_USER_ID,
            };
        });

    return {
        topUsers: enhancedTopUsers,
        totalTokensDistributed: distributionResult.totalTokensDistributed,
    };
}
