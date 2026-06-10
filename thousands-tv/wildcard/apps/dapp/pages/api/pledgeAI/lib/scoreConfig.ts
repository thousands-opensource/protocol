/**
 * Standardized score types
 */

// Define an interface for a basic signal configuration
interface BaseSignalConfig {
    scale: number;
    threshold?: number;
    maxScore: number;
    minScore?: number;
    readonly description: string; // readonly as prompts are not expected to change
}

// Boost configuration interface
interface BoostConfig extends BaseSignalConfig {
    threshold: number; // Boost must have a threshold
}

// Message signals configuration interface
interface MessageSignalsConfig {
    meaningful: BaseSignalConfig;
    length: BaseSignalConfig;
    spam: BaseSignalConfig;
}

// Reaction signals configuration interface
interface ReactionSignalsConfig {
    uniqueReactors: BaseSignalConfig;
}

// NFT holdings configuration interface – note that here we have different properties.
interface NftHoldingsTotalConfig {
    scaleWildpass: number;
    thresholdWildpass: number;
    maxScore: number;
    // description: string;
}

// Ranking priorities interface
interface RankingPriority {
    boost: number;
    nftHoldings: number;
    reactions: number;
    messages: number;
}

// The overall scoring configuration interface
interface ScoringConfig {
    boost: BoostConfig;
    message: MessageSignalsConfig;
    reaction: ReactionSignalsConfig;
    nftHoldings: {
        totalHoldings: NftHoldingsTotalConfig;
    };
    rankingPriority: RankingPriority;
}

/**
 * Configuration for the AI referee scoring system.
 * @dev - the max score for each signal is used to normalize the raw score to a percentage.
 * The raw score is capped at the max score (being the highest score based on the data). All scores are a percentage of the max score.
 */
export const scoringConfig: ScoringConfig = {
    boost: {
        // i.e Perfect threshold: 10 boosts yields 100 raw points.
        scale: 1, // Each boost counts as X raw points.
        threshold: 1, // If a user has 10 or more boosts, their raw boost score is capped at 100.
        maxScore: 100, // @note - Maximum raw score. - based on the max score on the boost signal.
        get description(): string {
            return `For each user, sum all boost amounts. Each boost counts as ${this.scale} point(s). If a user has ${this.threshold} or more boosts, cap the raw boost score at ${this.maxScore}. Then, convert this raw score to a percentage by calculating (raw score / ${this.maxScore}) × 100.`;
        },
    },
    message: {
        meaningful: {
            scale: 1,
            threshold: 1,
            maxScore: 100,
            get description(): string {
                return `Count the number of messages that are considered meaningful. Each meaningful message counts as ${this.scale} point(s). If a user has ${this.threshold} or more, cap the raw score at ${this.maxScore}. Then convert to a percentage: (raw score / ${this.maxScore}) × 100.`;
            },
        },
        length: {
            scale: 1,
            maxScore: 100,
            get description(): string {
                return `Calculate the average length (in characters) of the user's messages. Multiply the average by ${this.scale} to obtain a raw score, and cap the result at ${this.maxScore}. Then, convert to a percentage: (raw score / ${this.maxScore}) × 100.`;
            },
        },
        spam: {
            scale: -1,
            minScore: 0,
            maxScore: 0,
            get description(): string {
                return `Count the number of times a user's messages triggered a spam filter. Multiply the raw count by ${this.scale} (penalty) and ensure the final score does not fall below ${this.minScore}. Then, treat this value as a percentage relative to 0 (i.e. the penalty is applied directly).`;
            },
        },
    },
    reaction: {
        uniqueReactors: {
            scale: 1,
            threshold: 1,
            maxScore: 100,
            get description(): string {
                return `Count the number of unique reactorUserIds. Each unique reactor counts as ${this.scale} point(s). If a user has ${this.threshold} or more, cap the raw reaction score at ${this.maxScore}. Then convert this to a percentage: (raw score / ${this.maxScore}) × 100.`;
            },
        },
    },
    nftHoldings: {
        totalHoldings: {
            scaleWildpass: 1,
            thresholdWildpass: 1,
            maxScore: 100,
        },
    },
    // Ranking priorities (global weights) for token distribution.
    // For example, boosts are given 60% of the overall weight. (calculated as part of the composite score)
    rankingPriority: {
        boost: 0.55,
        nftHoldings: 0.40,
        reactions: 0.05,
        messages: 0.0,
    },
};

/**
 * Enum representing the types of scores that can be preprocessed.
 */
export enum PreprocessorType {
    BOOST = "boost",
    NFT_HOLDINGS = "nftHoldings",
    REACTIONS = "reactions",
    MESSAGES = "messages",
}

/**
 * As part of the distribution logic: applies a random scaling factor to the raw score based on the preprocessor type for intended algo. obfuscation.
 * The algorithm is: scaledScore = rawScore^(randomFactor)
 * where randomFactor is a random number between the configured minimum and maximum:
 *
 * - For BOOST: randomFactor in [1.05, 1.08]
 * - For NFT_HOLDINGS: randomFactor in [1.08, 1.09]
 * - For REACTIONS: randomFactor in [1.05, 1.08]
 * - For MESSAGES: randomFactor in [1.05, 1.08]
 *
 * @param preprocessorType - The type of score being processed.
 * @param rawScore - The raw score to scale.
 * @returns The scaled score.
 */
export function applyRandomScaling(
    preprocessorType: PreprocessorType,
    rawScore: number
): number {
    let minFactor: number;
    let maxFactor: number;

    switch (preprocessorType) {
        case PreprocessorType.BOOST:
            minFactor = 1.05;
            maxFactor = 1.08;
            break;
        case PreprocessorType.NFT_HOLDINGS:
            minFactor = 1.08;
            maxFactor = 1.09;
            break;
        case PreprocessorType.REACTIONS:
            minFactor = 1.05;
            maxFactor = 1.08;
            break;
        case PreprocessorType.MESSAGES:
            minFactor = 1.05;
            maxFactor = 1.08;
            break;
        default:
            console.warn(
                "Unknown preprocessor type, defaulting to no scaling."
            );
            minFactor = 1.0;
            maxFactor = 1.0;
            break;
    }

    const randomFactor = Math.random() * (maxFactor - minFactor) + minFactor;
    return Math.pow(rawScore, randomFactor);
}
