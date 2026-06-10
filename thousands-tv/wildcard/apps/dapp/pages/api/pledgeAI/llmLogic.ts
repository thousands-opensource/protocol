import { Boost, IChatMessage, IReaction } from "@repo/interfaces";
import {
    EnhancedDistributionResult,
    FanDetail,
    FanDetailObject,
    NftHoldingsScoreResult,
    WildpassHoldingsScore,
    SignalConfigItem,
    TokenDistributionResult,
} from "./types";
import { scoringConfig } from "./lib/scoreConfig";
import { UserCompositeScore } from "./calculateUserCompositeScore";
import JSON5 from "json5";
import { UNKNOWN_USER_ID } from "./util/topInsightsUtil";

/**
 * Data Source Signals (the signal the AI is looking for i.e unique reactors count)
 */
export enum CHAT_REACTION_SIGNALS {
    UNIQUE_REACTORS_COUNT = "uniqueReactorsCount",
}

//----------------------------------------------

export enum MESSAGE_SIGNALS {
    MESSAGE_LENGTH_SCORE = "messageLengthScore",
}

export enum BOOSTS_SIGNALS {
    TOTAL_SUM_BOOST_AMOUNT = "totalSumBoostAmount",
}

export enum NFT_HOLDINGS_SIGNALS {
    TOTAL_WILDPASS_HOLDINGS = "totalSumWildpassHoldings",
}

//----------------------------------------------

// You can define a specialized type for an array of these signals:
type ChatReactionSignalConfig = {
    signals: Array<SignalConfigItem<CHAT_REACTION_SIGNALS>>;
};

type MessageSignalConfig = {
    signals: Array<SignalConfigItem<MESSAGE_SIGNALS>>;
};

//----------------------------------------------

export const messageSignalsConfig: MessageSignalConfig = {
    signals: [
        {
            key: MESSAGE_SIGNALS.MESSAGE_LENGTH_SCORE,
            label: "Message Length Score",
            prompt: "Scores messages based on length (e.g., avoiding spammy one-liners vs. excessively long posts).",
            weight: 1.0,
            active: true,
        },
    ],
};

//----------------------------------------------

export function getComputationInstructionsForMessageSignal(
    signal: SignalConfigItem<MESSAGE_SIGNALS>,
    chatResponseData: string // or some stringified JSON data
): string {
    switch (signal.key) {
        case MESSAGE_SIGNALS.MESSAGE_LENGTH_SCORE:
            return `
You are a scoring assistant. Compute the following signals for each user:

1. Meaningful Msg Count  
2. Message Length Score  
3. Spam Filter Hit

Use the following logic for each signal:

- **Meaningful Msg Count:**  
  - A message is considered "meaningful" if it meets a defined reaction threshold or quality standard.  
  - For each user, count the number of messages that qualify as meaningful.  
  - **Standardization:** Multiply the raw count by ${scoringConfig.message.meaningful.scale} and cap the result at ${scoringConfig.message.meaningful.maxScore}.  
  - _Rule:_ ${scoringConfig.message.meaningful.description}

- **Message Length Score:**  
  - For each user, calculate the average length (in characters) of their messages (i.e., sum of message lengths divided by the number of messages).  
  - Optionally, apply penalties for extremely short (e.g., below 5 characters) or extremely long (e.g., above 100 characters) averages.  
  - **Standardization:** Multiply the computed average by ${scoringConfig.message.length.scale} and cap the result at ${scoringConfig.message.length.maxScore}.  
  - _Rule:_ ${scoringConfig.message.length.description}

- **Spam Filter Hit:**  
  - Count how many times a user's messages triggered a spam filter (e.g., due to repetitive content or known spam keywords).  
  - **Standardization:** Multiply the raw count by ${scoringConfig.message.spam.scale} (applying a penalty) and ensure the final score does not drop below ${scoringConfig.message.spam.minScore}.  
  - _Rule:_ ${scoringConfig.message.spam.description}

Finally, return your result in **pure JSON** using the exact format below (with no additional keys or commentary):

{
  "scores": [
    {
      "userId": "someUserId",
      "meaningfulMessageCount": <number>,
      "messageLengthScore": <number>,
      "spamFilterHit": <number>
    },
    ...
  ]
}

Here is the user data to process (as JSON):
${chatResponseData}

Please output only the JSON object as your final answer.
`;

        default:
            return `- Unknown signal: "${signal.key}". Prompt: "${signal.prompt}"`;
    }
}

export function getComputationInstructionsForBoostSignal(
    signal: SignalConfigItem<BOOSTS_SIGNALS>,
    boostResponseData: string // or some stringified JSON data
): string {
    switch (signal.key) {
        case BOOSTS_SIGNALS.TOTAL_SUM_BOOST_AMOUNT:
            return `
You are a scoring assistant. Compute the following signal for each user:

1. Total Sum of Boost Amounts:
   - For each user, sum all the boostAmount values from the provided data.
   - ${scoringConfig.boost.description}
   - This means that each boost contributes ${scoringConfig.boost.scale} point(s) per unit, and if the total exceeds ${scoringConfig.boost.maxScore}, cap it at ${scoringConfig.boost.maxScore}.

Return your final result in **pure JSON** using the exact format below (no additional keys or commentary):

{
  "scores": [
    {
      "userId": "someUserId",
      "totalSumBoostAmounts": <number>
    },
    ...
  ]
}

Here is the user data to process (as JSON):
${boostResponseData}

Please provide only the JSON object as your final answer.
`;
        default:
            return `- Unknown signal: "${signal.key}". Prompt: "${signal.prompt}"`;
    }
}

//-----------------LOGIC-----------------

/**
 * Returns a prompt string for the AI that describes how to compute each
 * reaction-based signal, substituting in your reaction data (JSON) if desired.
 */
export function getComputationInstructionsForReactionSignal(
    signal: SignalConfigItem<CHAT_REACTION_SIGNALS>,
    reactionResponseData: string
): string {
    switch (signal.key) {
        case CHAT_REACTION_SIGNALS.UNIQUE_REACTORS_COUNT:
            return `
You are a scoring assistant. For each user, determine the number of unique reactorUserIds who engaged with that user's messages.

Please use the following configuration instructions to standardize the raw count into a normalized percentage:

${scoringConfig.reaction.uniqueReactors.description}

Output your final result in pure JSON, using the exact format below (no additional commentary):

{
  "scores": [
    {
      "userId": "someUserId",
      "uniqueReactorsCount": <number>
    },
    ...
  ]
}

Here is the reaction data to process (as JSON):
${reactionResponseData}

Please provide only the JSON object as your final answer.
            `;
        default:
            return `- Unknown reaction signal: "${signal.key}". Prompt: "${signal.prompt}"`;
    }
}

export function getReactionAiRecommendation(
    chatReactions: IReaction[]
    // count: number,
    // useRandomEventId: boolean,
    // fixedEventId?: string,
    // messageIds?: string[], // new param
    // userIds?: string[] // new param
) {
    // // 1. Generate random reactions, referencing the provided messageIds and userIds if given
    // const reactions = generateRandomReactions(
    //     count,
    //     messageIds ?? [], // If none provided, pass empty array => internally generate random
    //     userIds ?? [], // Same logic for user IDs
    //     useRandomEventId,
    //     fixedEventId
    // );
    const reactions = chatReactions;

    // 2. Convert the reaction data into JSON for the AI
    const reactionResponseData = JSON.stringify({ reactions }, null, 2);

    // 3. Build a signal config item for UNIQUE_REACTORS_COUNT
    const uniqueReactorsConfig: SignalConfigItem<CHAT_REACTION_SIGNALS> = {
        key: CHAT_REACTION_SIGNALS.UNIQUE_REACTORS_COUNT,
        label: "Unique Reactors Count",
        prompt: "Counts how many distinct reactorUserIds engaged with a user's messages.",
        weight: 2.0,
        active: true,
    };

    // 4. Build the AI prompt based on the new UNIQUE_REACTORS_COUNT signal
    const prompt = getComputationInstructionsForReactionSignal(
        uniqueReactorsConfig,
        reactionResponseData
    );

    // Return the reaction data + prompt
    return { reactions, prompt };
}
//====================================================================================================

/**
 * Creates an AI prompt for a given message signal (e.g., MESSAGE_LENGTH_SCORE)
 * based on randomly generated chat messages, optionally using a shared userId pool.
 *
 * @param count number of messages to generate
 * @param useRandomEventId if true, each message gets a random eventId
 * @param fixedEventId if provided, all messages share the same eventId
 * @param userIds optional array of user IDs to reuse for these messages
 * @returns an object containing:
 *   - messages: the array of generated chat messages
 *   - prompt: the string prompt that can be passed to an LLM
 */
export function getPledgeAiRecommendation(
    chatMessages: IChatMessage[]
    // count: number,
    // useRandomEventId: boolean,
    // fixedEventId?: string,
    // userIds?: string[] // NEW optional param
) {
    // // 1. Generate random chat messages using the shared userIds if provided
    // const messages = generateRandomChatMessages(
    //     count,
    //     useRandomEventId,
    //     fixedEventId,
    //     userIds
    // );

    // const messages = chatMessages.slice(0, 20);
    // Let's limit the number od message to 20 for now
    // const limitedMessages = messages.slice(0, 20);

    const messages = chatMessages;

    // 2. Convert them into a JSON string that the LLM can parse.
    //    We'll nest them under "users" to match the prompt's expectation:
    const chatResponseData = JSON.stringify({ users: messages }, null, 2);

    // 3. Build a signal config item for MESSAGE_LENGTH_SCORE (or any other signal).
    //    If you have a real config, you'd fetch it from your config file instead.
    const messageLengthSignalConfig: SignalConfigItem<MESSAGE_SIGNALS> = {
        key: MESSAGE_SIGNALS.MESSAGE_LENGTH_SCORE,
        label: "Message Length Score",
        prompt: "Scores messages based on length (e.g., avoiding spammy one-liners vs. excessively long posts).",
        weight: 1.0,
        active: true,
    };

    // 4. Get the AI computation instructions (prompt) for that signal
    const prompt = getComputationInstructionsForMessageSignal(
        messageLengthSignalConfig,
        chatResponseData
    );

    // Return both the messages (so we can see what was generated) and the prompt.
    return {
        messages,
        prompt,
    };
}

/**
 * Validates and processes NFT holdings data (directly via parsing utility)
 */
export function processNftHoldings(
    fanDetails: FanDetailObject[]
): WildpassHoldingsScore[] {
    try {
        return fanDetails
            .map((fan) => {
                // Validate arrays exist
                const wildpassesCount = Array.isArray(fan.Wildpasses)
                    ? fan.Wildpasses.length
                    : 0;

                // Ensure FanId exists
                if (!fan.FanId) {
                    console.warn(`Fan detail missing FanId:`, fan);
                    return null;
                }

                return {
                    userId: fan.FanId,
                    totalSumWildpassHoldingsAmounts: wildpassesCount,
                };
            })
            .filter((item): item is WildpassHoldingsScore => item !== null);
    } catch (error) {
        console.error("Error processing NFT holdings:", error);
        return [];
    }
}

export function getNftHoldingsAiRecommendation(fanDetails: FanDetailObject[]): {
    scoreNftHoldingsPrompt: NftHoldingsScoreResult;
    prompt: string;
} {
    // Pre-process the data
    const processedHoldings = processNftHoldings(fanDetails);
    const nftHoldingsResponseData = JSON.stringify(
        { scores: processedHoldings },
        null,
        2
    );

    const prompt = `
You are a scoring assistant. Calculate the total number of NFT holdings (Wildpasses) for each user.

Output your final result in pure JSON, using this exact format:

{
  "scores": [
    {
      "userId": "someUserId",
      "totalSumWildpassHoldingsAmounts": <number>
    }
  ]
}

Here is the NFT holdings data to process (as JSON):
${nftHoldingsResponseData}

Please provide only the JSON object as your final answer.`;

    return {
        scoreNftHoldingsPrompt: { scores: processedHoldings },
        prompt: prompt.trim(),
    };
}

export function getBoostsAiRecommendation(boosts: Boost[]) {
    // 2. Convert them into a JSON string that the LLM can parse.
    const boostResponseData = JSON.stringify({ boosts }, null, 2);

    // 3. Build a signal config item for MESSAGE_LENGTH_SCORE (or any other signal).
    //    If you have a real config, you'd fetch it from your config file instead.
    const boostLengthSignalConfig: SignalConfigItem<BOOSTS_SIGNALS> = {
        key: BOOSTS_SIGNALS.TOTAL_SUM_BOOST_AMOUNT,
        label: "Sum of boost amounts",
        prompt: "Gather total sum of boosts amounts.",
        weight: 1.0,
        active: true,
    };

    // 4. Get the AI computation instructions (prompt) for that signal
    const prompt = getComputationInstructionsForBoostSignal(
        boostLengthSignalConfig,
        boostResponseData
    );

    // Return both the messages (so we can see what was generated) and the prompt.
    return {
        boosts,
        prompt,
    };
}

// =================================== DISTRIBUTION LOGIC ===============================================

/**
 * Builds a prompt string for the token distribution agent.
 *
 * @dev- the calc = Composite Score= 
Message Priority+Reaction Priority+NFT Holdings Priority+Boost Priority
Message Score×Message Priority+Reaction Score×Reaction Priority+NFT Holdings Score×NFT Holdings Priority+Boost Score×Boost Priority
​
(mes* rank)..../(rank sum)= composite

/**
 * Builds a prompt string for the token distribution agent.
 *
 * @param messageScores - an array of MessageScore objects.
 * @param reactionScores - an array of ReactionScore objects.
 * @param nftHoldingScores - an array of WildpassHoldingsScore objects.
 * @param boostScore - an array of BoostScore objects.
 * @param totalTokens - total number of tokens available for distribution.
 * @param maxTokensPerUser - maximum tokens a single user can receive.
 * @param topUsersCount - how many top users to allocate tokens to.
 */
export function buildTokenDistributionPromptFromCompositeScores(
    compositeScores: UserCompositeScore[],
    totalTokens: number,
    maxTokensPerUser: number,
    topUsersCount: number
): string {
    const prompt = `
You are a token distribution assistant. The following data represents precomputed composite scores for each user along with a detailed score breakdown. Each user's scores are normalized as percentages (0–100) and include:
- messageScore
- reactionScore
- nftHoldingsScore
- boostScore
- compositeScore

DATA TO ANALYZE:
${JSON.stringify(compositeScores, null, 2)}

TASK:
Using the Hamilton method for proportional allocation, distribute a total of ${totalTokens} tokens among these users as follows:

For each user \( i \):
\[
\text{AllocatedTokens}_i = \min\Big(\text{maxTokensPerUser}, \text{Round}\Big(\frac{S_i}{\sum_{j} S_j} \times {totalTokens}\Big)\Big)
\]
where:
- \( S_i \) is the composite score for user \( i \),
- Rounding is performed using standard round half-up rules,
- No user may receive more than ${maxTokensPerUser} tokens,
- The sum of allocated tokens must equal exactly ${totalTokens}.

Return ONLY the JSON structure below (limited to the top ${topUsersCount} users) with each user's detailed score breakdown:

{
  "topUsers": [
    {
      "userId": "someUserId",
      "allocatedTokens": <number>,
      "scoreBreakdown": {
        "boostScore": <number>,
        "nftHoldingsScore": <number>,
        "reactionScore": <number>,
        "messageScore": <number>,
        "compositeScore": <number>
      }
    },
    ...
  ],
  "totalTokensDistributed": <number>
}
`;
    return prompt.trim();
}

/**
 * Enhances distribution results with fan details
 * @param distributionResult Original distribution result
 * @param fanDetails Array of fan details
 * @returns Enhanced distribution result with fan details
 */
export function buildEnhancedDistributionWithFanDetails(
    distributionResult: TokenDistributionResult,
    fanDetails: FanDetail[]
): string {
    // Create a normalized map for quick fan detail lookups
    const fanDetailsMap = new Map(
        fanDetails.map((fan) => [
            fan.FanId.trim().toLowerCase(), // Normalize FanId
            {
                fanId: fan.FanId,
                fanName: fan.FanName,
                walletAddress: fan.WalletAddress,
            },
        ])
    );

    // Enhance each distribution user by matching the normalized userId with the fan detail map
    const enhancedTopUsers = distributionResult.topUsers.map((distUser) => {
        const normalizedUserId = distUser.userId.trim().toLowerCase();
        const fanDetail = fanDetailsMap.get(normalizedUserId);
        return {
            ...distUser,
            fanId: fanDetail ? fanDetail.fanId : "UNKNOWN",
            fanName: fanDetail ? fanDetail.fanName : "UNKNOWN",
            walletAddress: fanDetail ? fanDetail.walletAddress : "UNKNOWN",
        };
    });

    const combinedData = {
        distributionResults: {
            ...distributionResult,
            topUsers: enhancedTopUsers,
        },
        fanDetailsMap: Object.fromEntries(fanDetailsMap),
        task: "Enhance distribution results with fan details",
    };

    const prompt = `
You are a distribution result enhancer. Your task is to accurately map fan details to the distribution results.

Here is the data:
${JSON.stringify(combinedData, null, 2)}

IMPORTANT RULES:
1. ONLY map details when there is an EXACT match between userId and FanId.
2. If no match is found, use "UNKNOWN" for fanId, fanName, and walletAddress.
3. Maintain ALL original distribution data (tokens, scores, etc.).
4. Never guess or approximate matches.
5. Preserve exact numerical values.
6. fanId must EXACTLY match the original FanId from fan details.

Return ONLY a JSON object with this structure:
{
  "topUsers": [
    {
      "userId": string,
      "allocatedTokens": number,
      "scoreBreakdown": {
        "boostScore": <number>,
        "wildpassHoldingsScore": <number>,
        "reactionScore": <number>,
        "messageScore": <number>,
        "totalScore": <number>
      },
      "fanId": string,
      "fanName": string,
      "walletAddress": string
    }
  ],
  "totalTokensDistributed": number
}`;

    return prompt.trim();
}

/**
 * Validates the enhanced distribution result
 * Checks if the total tokens and top users match the original distribution
 */
export function validateEnhancedDistribution(
    enhanced: EnhancedDistributionResult,
    original: TokenDistributionResult
): boolean {
    if (enhanced.totalTokensDistributed !== original.totalTokensDistributed) {
        return false;
    }

    if (enhanced.topUsers.length !== original.topUsers.length) {
        return false;
    }

    // Check each user's allocated tokens if it's allocation tokens is 0 then remove
    enhanced.topUsers = enhanced.topUsers.filter(
        (enhancedUser) => enhancedUser.allocatedTokens > 0
    );

    // parse out "UNKNOWN" users
    const unknownUsers = enhanced.topUsers.filter(
        (enhancedUser) => enhancedUser.fanId === UNKNOWN_USER_ID
    );

    return enhanced.topUsers.every((enhancedUser, index) => {
        const originalUser = original.topUsers[index];
        if (!originalUser) {
            return false;
        }

        // Check token match
        const tokenMatch =
            enhancedUser.allocatedTokens === originalUser.allocatedTokens;

        return tokenMatch;
    });
}

/**
 * Attempts to parse a JSON string. First uses standard JSON.parse.
 * If that fails, falls back to JSON5.parse for relaxed JSON syntax.
 * If both fail, logs an error and returns an empty object.
 *
 * @param jsonString - The JSON string to parse.
 * @returns The parsed object, or {} if parsing fails.
 */
export function parseFlexibleJSON(jsonString: string): any {
    if (!jsonString) return {};
    try {
        return JSON.parse(jsonString);
    } catch (err) {
        console.warn(
            "Standard JSON.parse failed, attempting JSON5.parse...",
            err
        );
        try {
            return JSON5.parse(jsonString);
        } catch (err2) {
            console.error("Both JSON.parse and JSON5.parse failed.", err2);
            return {};
        }
    }
}
