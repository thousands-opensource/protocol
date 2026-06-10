import { EnrichedInsight } from "./util/topInsightsUtil";

export interface SignalConfigItem<K> {
    /**
     * The specific signal key from your enum.
     */
    key: K;

    /**
     * A short, human-readable label.
     */
    label: string;

    /**
     * A textual description or "prompt" to help the AI (or other consumers)
     * understand how this signal is used or interpreted.
     */
    prompt: string;

    /**
     * The numeric weight applied during scoring or AI decision-making.
     */
    weight: number;

    /**
     * Whether this signal is currently active (used in calculations)
     * or disabled (ignored).
     */
    active: boolean;
}

/**
 * Generated message for reaction analysis.
 */
export interface IGeneratedMessage {
    messageId: string;
    content: string;
    originalMessageUserId: string;
}
/**
 * =================|Data Source Scores |=================
 */

/**
 * Represents a user's engagement through message metrics
 */
export interface MessageScore {
    userId: string;
    meaningfulMessageCount: number;
    messageLengthScore: number;
    spamFilterHit: number;
}

/**
 * Represents a user's engagement through reactions
 */
export interface ReactionScore {
    userId: string;
    uniqueReactorsCount: number;
}

export interface WildpassHoldingsScore {
    userId: string;
    totalSumWildpassHoldingsAmounts: number;
}

// Result interface for AI processing
export interface NftHoldingsScoreResult {
    scores: WildpassHoldingsScore[];
}

export interface BoostScore {
    userId: string;
    totalSumBoostAmounts: number;
    boostScore: number; // Normalized score (0-100)
    creditsSpent: number; // Raw total boost amount (without scaling)
}
/**
 *  =================| End Data Source Scores | =================
 */

/**
 * Score breakdown for token distribution
 */
export interface ScoreBreakdown {
    boostScore: number;
    messageScore: number;
    reactionScore: number;
    wildpassHoldingsScore: number;
    compositeScore: number;
    totalScore: number;
    creditsSpent?: number;
}

/**
 * Result of token distribution for a single user
 */
export interface UserTokenDistribution {
    userId: string;
    allocatedTokens: number;
    scoreBreakdown: ScoreBreakdown;
}

/**
 * Final distribution result
 */
export interface TokenDistributionResult {
    topUsers: UserTokenDistribution[];
    totalTokensDistributed: number;
}

/**
 * Configuration for distribution weights
 */
export interface DistributionWeights {
    messages: {
        meaningfulMessageCount: number;
        messageLengthScore: number;
        spamFilterHit: number;
    };
    reactions: {
        uniqueReactorsCount: number;
    };
    nftHoldings: {
        totalSumWildpassHoldingsAmounts: number;
    };
    boosts: {
        totalSumBoostAmounts: number;
    };
    //@dev - add more weights i.e for other signal sources
}

/**
 * Combined data structure for all signal sources
 * @remarks This interface can be extended to include additional data sources
 */
export interface SignalSourceData {
    messages: {
        scores: MessageScore[];
        weights: DistributionWeights["messages"];
    };
    reactions: {
        scores: ReactionScore[];
        weights: DistributionWeights["reactions"];
    };
    nftHoldings: {
        scores: WildpassHoldingsScore[];
        weights: DistributionWeights["nftHoldings"];
    };
    boosts: {
        scores: BoostScore[];
        weights: DistributionWeights["boosts"];
    };
}

/**
 * Configuration for token distribution
 */
export interface DistributionConfig {
    totalTokens: number;
    maxTokensPerUser: number;
    topUsersCount: number;
}

/**
 * Complete data structure for distribution processing
 * @remarks Additional signal sources can be added to SignalSourceData
 */
export interface DistributionData {
    signalSources: SignalSourceData;
    distributionConfig: DistributionConfig;
}

//==== Enhanced User Distribution Data ====
export interface FanDetail {
    FanId: string;
    FanName: string;
    WalletAddress: string;
}
export interface EnhancedUserDistribution extends UserTokenDistribution {
    fanId: string;
    fanName: string;
    walletAddress: string;
}

export interface EnhancedDistributionResult {
    topUsers: EnhancedUserDistribution[];
    totalTokensDistributed: number;
}
//=========================================

export interface FanDetailObject {
    FanId: string;
    FanName: string;
    FanPfpUrl: string;
    HasWildFile: boolean;
    HasWildfilePfp: boolean;
    HasWalletAddress: boolean;
    WalletAddress: string;
    AdditionalWalletAddresses: string[];
    WildfileAgeDays: number;
    Timestamp: number;
    SeatSectionNumber: number;
    SeatScore: number;
    Wildpasses: WildPass[];
    SwagPins: SwagPin[];
}

interface SwagPin {
    title: string;
    description: string;
    imageUrl: string;
    balance: number;
    contractAddress: string;
}

interface WildPass {
    title: string;
    description: string;
    imageUrl: string;
    balance: number;
    contractAddress: string;
}

export interface TopInsight {
    userId: string;
    fanName: string;
    allocatedTokens: number;
    compositeScore: number;
    breakdown: string;
    data?: string;
}

export interface TopInsights {
    topBoostScore: TopInsight;
    topNftHoldingsScore: TopInsight;
    topReactionScore: TopInsight;
    topMessageScore: TopInsight;
    topCompositeScore: TopInsight;
}

/**
 * Represents an insight generated by the AI
 * @dev - extra field for arbitrary data (e.g. best reaction comment)
 */
export interface Insight {
    userId: string;
    summary: string;
    title: string;
    category: string;
    data?: string;
}

export type InsightsResponse = Insight[];

export interface ExtendedTopInsights {
    topBoostScore: TopInsight;
    topNftHoldingsScore: TopInsight;
    topReactionScore: TopInsight;
    topMessageScore: TopInsight;
    topCompositeScore: TopInsight;
    secondCompositeScore: TopInsight;
    thirdCompositeScore: TopInsight;
    fourthCompositeScore: TopInsight;
}

/**
 * Represents a wallet recipient with a wallet address and allocated tokens.
 */
export interface WalletRecipient {
    walletAddress: string;
    allocatedTokens: number;
}

/**
 * Represents the complete response data for the distribution endpoint.
 */
export interface DistributionCompositeData {
    insights: EnrichedInsight[] | any;
    distributionResult: EnhancedDistributionResult;
    totalTokens: number;
    maxTokensPerUser: number;
    noOfUsersDistributed: number;
    walletRecipients: WalletRecipient[];
}

export interface DistributionDataAPIResponse {
    success: boolean;
    data?: DistributionCompositeData | null;
    err?: any;
}

/**
 * Represents the computed NFT holdings score for a user.
 */
export interface NftHoldingsScore {
    userId: string;
    totalSumWildpassHoldingsAmounts: number;
    nftHoldingsScore: number; // normalized percentage score
}
