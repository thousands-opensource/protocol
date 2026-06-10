import {
    LOCAL,
    MIN_RECAPTCHA_SCORE,
    PROD,
    RECAPTCHA_V3_THRESHOLD_FOR_V2_SCORE,
    TEST,
    CONDUIT,
} from "@/constants/constants";
import { Environment } from "@repo/interfaces";

export function isLocalEnvironment(): boolean {
    return getEnvironment() === Environment.LOCAL;
}

export function isTestEnvironment(): boolean {
    return getEnvironment() === Environment.TEST;
}

export function isProdEnvironment(): boolean {
    return getEnvironment() === Environment.PROD;
}

export function isConduitEnvironment(): boolean {
    return getEnvironment() === Environment.CONDUIT;
}

export function getEnvironment(): Environment {
    const targetEnv = process.env.NEXT_PUBLIC_TARGET_ENVIRONMENT;
    if (targetEnv) {
        return getEnvironmentFromString(targetEnv);
    }

    // default to local
    console.log(`Target environment not found, defaulting to LOCAL`);
    return Environment.LOCAL;
}

export function getEnvironmentFromString(
    targetEnvironment: string
): Environment {
    switch (targetEnvironment) {
        case LOCAL:
            return Environment.LOCAL;
        case TEST:
            return Environment.TEST;
        case PROD:
            return Environment.PROD;
        case CONDUIT:
            return Environment.CONDUIT;
        default:
            console.warn(
                `Unknown target environment '${targetEnvironment}', defaulting to LOCAL`
            );
            return Environment.LOCAL;
    }
}

export function getDiscordInviteLink(): string {
    return (
        process.env.NEXT_PUBLIC_DISCORD_INVITE_LINK ||
        "https://discord.gg/playwildcard"
    );
}

export function getBlockExplorerUrl(): string {
    return (
        process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL || "https://polygonscan.com"
    );
}

/**
 * @returns the dev env twitter basic authentication
 */
export function getTwitterBasicAuth(): string {
    return process.env.DEV_TWITTER_BASIC_AUTH || "";
}

/**
 * @returns the OAuth redirect uri
 */
export function getOAuthRedirectUrl(): string {
    return (
        process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URL ||
        "http://localhost:3000/wildfile/linkSocialOAuthLanding"
    );
}

/**
 * @returns the twitch cliend id
 */
export function getTwitchClientId(): string {
    return process.env.DEV_TWITCH_CLIENT_ID || "";
}

/**
 * @returns the twitch client secret
 */
export function getTwitchClientSecret(): string {
    return process.env.DEV_TWITCH_CLIENT_SECRET || "";
}

// wildfile contract address
export function getWildfileContractAddress(): string {
    return process.env.NEXT_PUBLIC_WILDFILE_CONTRACT_ADDRESS || "";
}

// wildevents contract address
export function getWildcardSwagContractAddress(): string {
    return process.env.NEXT_PUBLIC_WILDCARD_SWAG_CONTRACT_ADDRESS || "";
}

// wildevents contract address
export function getWildeventRegistryContractAddress(): string {
    return process.env.NEXT_PUBLIC_WILDEVENT_REGISTRY_CONTRACT_ADDRESS || "";
}

export function getLinkedSocialWildeventContractAddress(): string {
    return process.env.NEXT_PUBLIC_LINKED_SOCIAL_WILDEVENT_ADDRESS || "";
}

export function getAlchemyApiKey(): string {
    return process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "";
}

export function getBackendAlchemyApiKey(): string {
    return process.env.BACKEND_ALCHEMY_API_KEY || "";
}

export function getDappApiKey(): string {
    return process.env.DAPP_API_KEY || "";
}

/**
 * @returns the base url of the twitter
 */
export function getTwitterBaseUrl(): string {
    return process.env.TWITTER_BASE_URL || "http://twitter.com";
}

/**
 * @returns the client id of twitter oauth
 */
export function getTwitterClientId(): string {
    return process.env.DEV_TWITTER_CLIENT_ID || "";
}

/**
 * @returns the client secret of twitter oauth
 */
export function getTwitterClientSecret(): string {
    return process.env.DEV_TWITTER_CLIENT_SECRET || "";
}

/**
 * @returns the base url of the twitch api
 */
export function getTwitchBaseUrl(): string {
    return process.env.TWITCH_BASE_URL || "https://id.twitch.tv";
}

/**
 * @returns Wildpass contract address
 */
export function getWildpassContractAddress(): string {
    return process.env.NEXT_PUBLIC_WILDPASS_CONTRACT_ADDRESS || "";
}

export function getWolvesDaoAddress(): string {
    return process.env.NEXT_PUBLIC_WOLVES_DAO_CONTRACT_ADDRESS || "";
}

export function getEthWildpassContractAddress(): string {
    return (
        process.env.NEXT_PUBLIC_ETH_WILDPASS_CONTRACT_ADDRESS ||
        "0xd8cb3f39875def5853b155c0adf2530644397428"
    );
}

/**
 * @returns polygon mainnet alchemy provider
 */
export function getPolygonMainnetAlchemyProvider(): string {
    if (!process.env.POLYGON_MAINNET_ALCHEMY_PROVIDER) {
        console.warn("POLYGON_MAINNET_ALCHEMY_PROVIDER not found");
    }
    return process.env.POLYGON_MAINNET_ALCHEMY_PROVIDER || "";
}

/**
 * @returns Wildcard event ticket contract address
 */
export function getWildcardEventTicketContractAddress(): string {
    return process.env.NEXT_PUBLIC_WILDCARD_EVENT_TICKET_ADDRESS || "";
}

/**
 * @returns Wildpass tokens contract address
 */
export function getWildpassTokensContractAddress(): string {
    return process.env.NEXT_PUBLIC_WILDCARD_TOKENS_CONTRACT_ADDRESS || "";
}

/**
 * Get sentry dsn
 * @returns the sentry dsn
 */
export function getSentryDsn(): string {
    return process.env.NEXT_PUBLIC_SENTRY_DSN || "";
}

/**
 * Get google tag manager id
 * @returns the google tag manager id
 */
export function getGoogleTagManagerId(): string {
    return process.env.NEXT_PUBLIC_GA_TAG_MANAGER_ID || "";
}

/**
 * @dev: wallet connect V2 now requires a project id: https://docs.walletconnect.com/2.0/advanced/migration-from-v1.x/overview
 * Wallet connect project id (default: Wildcard project id)
 * @returns the wallet connect project id
 */
export function getWalletConnectProjectId(): string {
    return (
        process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ||
        "32e4f8510f5e616ed67df75affeb534f"
    );
}

export function getDiscordBaseEndpoint(): string {
    return process.env.DISCORD_BASE_ENDPOINT || "http://localhost:3033";
}

/**
 * @returns discord server's get acive showdown event endpoint
 */
export function getDiscordShowdownEndpoint(): string {
    const discordBaseEndpoint = getDiscordBaseEndpoint();
    return `${discordBaseEndpoint}/fetchActiveShowdownEvent`;
}

export function getShowdownFeatureEnabled(): boolean {
    return process.env.NEXT_PUBLIC_SHOWDOWN_FEATURE_ENABLED === "true";
}

/**
 * get discord token based on the target environment
 * @returns the discord token
 */
export function getDiscordToken() {
    return process.env.DISCORD_TOKEN || "";
}

/**
 * get discord guild id based on the target environment
 * @returns the discord guild id
 */
export function getDiscordGuildId() {
    return process.env.DISCORD_GUILD_ID || "";
}

/**
 * enable mongo user analytics
 * @returns true if enabled, false otherwise
 */
export function isEnabledMongoUserAnalyticsLog(): boolean {
    const isEnabled =
        process.env.NEXT_PUBLIC_ENABLE_MONGO_USER_ANALYTICS_LOG || "false";
    return isEnabled === "true";
}

export function getLinkedWalletWildeventContractAddress(): string {
    return process.env.NEXT_PUBLIC_LINKED_WALLET_WILDEVENT_ADDRESS || "";
}

export function getPfpWildeventContractAddress(): string {
    return process.env.NEXT_PUBLIC_PFP_WILDEVENT_ADDRESS || "";
}
export function getCompletedSwagSetWildeventContractAddress(): string {
    return process.env.NEXT_PUBLIC_COMPLETED_SWAG_SET_WILDEVENT_ADDRESS || "";
}

/**
 * get the wildpass survey url (CTA in the edit avatar modal)
 * @returns the url of the wildpass survey
 */
export function getWildpassSurveyUrl(): string {
    return (
        process.env.NEXT_PUBLIC_WILDPASS_SURVEY_URL ||
        "https://www.discord.gg/playwildcard"
    );
}

/**
 * get the wildpass suggestion url (CTA in the edit avatar modal)
 * @returns the url of the wildpass suggestion
 */
export function getWildpassSuggestionUrl(): string {
    return (
        process.env.NEXT_PUBLIC_WILDPASS_SUGGESTION_URL ||
        "https://www.discord.gg/playwildcard"
    );
}

/**
 * get the recaptcha v2 site key
 * @returns - the recaptcha v2 site key
 */
export function getRecaptchaV2SiteKey(): string {
    return process.env.NEXT_PUBLIC_RECAPTCHA_V2_SITE_KEY || "";
}

/**
 * get the recaptcha v3 site key
 * @returns - the recaptcha v3 site key
 */
export function getRecaptchaV3SiteKey(): string {
    return process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY || "";
}

/**
 * get the recaptcha v2 secret key
 * @returns - the recaptcha v2 secret key
 */
export function getRecaptchaV2SecretKey(): string {
    return process.env.RECAPTCHA_V2_SECRET_KEY || "";
}

/**
 * get the recaptcha v3 secret key
 * @returns - the recaptcha v3 secret key
 */
export function getRecaptchaV3SecretKey(): string {
    return process.env.RECAPTCHA_V3_SECRET_KEY || "";
}

export function getRecaptchaV3MinScore(): number {
    return process.env.NEXT_PUBLIC_RECAPTCHA_V3_MIN_SCORE
        ? Number(process.env.NEXT_PUBLIC_RECAPTCHA_V3_MIN_SCORE)
        : MIN_RECAPTCHA_SCORE;
}

export function getRecaptchaV3ScoreForV2Threshold(): number {
    return process.env.NEXT_PUBLIC_RECAPTCHA_V3_THRESHOLD_FOR_V2
        ? Number(process.env.NEXT_PUBLIC_RECAPTCHA_V3_THRESHOLD_FOR_V2)
        : RECAPTCHA_V3_THRESHOLD_FOR_V2_SCORE;
}

/**
 * Get the Auth Bearer Token for the game client
 * @returns - the auth bearer token for the game client
 */
export function getAuthBearerTokenGameClient(): string {
    return process.env.AUTH_BEARER_TOKEN_GAME_CLIENT || "";
}

/**
 * Get the Neynar Api Key for Farcaster
 * @returns - the neynar api key
 */
export function getNeynarApiKey(): string {
    return process.env.NEYNAR_API_KEY || "";
}

/**
 * Gets the cache duration in minutes for the api
 * @returns the cache duration in minutes for the api (default: 720 minutes = 12 hours)
 */
export function getApiCacheResponseDurationMinutes(): number {
    return process.env.API_CACHE_RESPONSE_DURATION_MINUTES
        ? Number(process.env.API_CACHE_RESPONSE_DURATION_MINUTES)
        : 15;
}

/**
 * Gets the API endpoint root url
 * @returns the API endpoint root url
 */
export function getAPIEndpointRootUrl(): string {
    return process.env.API_ENDPOINT_ROOT_URL || "http://localhost:3000";
}

/**
 * Gets the value of CLOSED_ENVIRONMENT_MODE environment variable.
 *
 * @returns {boolean} - Returns true if CLOSED_ENVIRONMENT_MODE is "true", otherwise false.
 */
export function isClosedEnvironmentMode(): boolean {
    return process.env.NEXT_PUBLIC_CLOSED_ENVIRONMENT_MODE === "true";
}

/**
 * Gets the Thirdweb Client ID
 * @returns the thirdweb client id
 */

export function getThirdWebClientId(): string {
    return process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "";
}

/**
 * Gets the Thousands Payee Address for payments (via Thirdweb)
 * @returns the thousands payee wallet address
 */
export function getThousandsPayeeAddress(): string {
    return process.env.NEXT_PUBLIC_THOUSANDS_PAYEE_ADDRESS || "";
}

/**
 * Gets the Ethereum erc20 token-gated contract addresses
 * @returns the ethereum erc20 token-gated contract addresses
 */
export function getErc20TokenGatedEthContractAddresses(): string[] {
    // Values on the env var should be comma-separated
    const envValue =
        process.env.ERC20_TOKEN_GATED_ETH_CONTRACT_ADDRESSES?.trim();
    // If the env var is not set, return an empty array
    return envValue
        ? envValue.split(",").filter((address) => address.trim() !== "")
        : [];
}

/**
 * Gets the minimum tokens held to allow entry to an event
 * @returns the minimum tokens held to allow entry to an event
 */
export function getMinTokensHeldToAllowEntryToAnEvent(): BigInt {
    return process.env.MIN_TOKENS_HELD_TO_ALLOW_ENTRY_TO_AN_EVENT
        ? BigInt(process.env.MIN_TOKENS_HELD_TO_ALLOW_ENTRY_TO_AN_EVENT)
        : BigInt(-1);
}

/**
 * Gets the Ethereum nft token-gated contract addresses
 * @returns the ethereum nft token-gated contract addresses
 */
export function getTokenGatedEthContractAddresses(): string[] {
    // Values on the env var should be comma-separated
    const envValue = process.env.TOKEN_GATED_ETH_CONTRACT_ADDRESSES?.trim();
    // If the env var is not set, return an empty array
    return envValue
        ? envValue.split(",").filter((address) => address.trim() !== "")
        : [];
}

export function getTokenGatedPolyContractAddresses(): string[] {
    // Values on the env var should be comma-separated
    const envValue = process.env.TOKEN_GATED_POLY_CONTRACT_ADDRESSES?.trim();
    // If the env var is not set, return an empty array
    return envValue
        ? envValue.split(",").filter((address) => address.trim() !== "")
        : [];
}

export function getTokenGatedBaseContractAddresses(): string[] {
    // Values on the env var should be comma-separated
    const envValue = process.env.TOKEN_GATED_BASE_CONTRACT_ADDRESSES?.trim();
    // If the env var is not set, return an empty array
    return envValue
        ? envValue.split(",").filter((address) => address.trim() !== "")
        : [];
}

export function getTokenGatedAvaxContractAddresses(): string[] {
    // Values on the env var should be comma-separated
    const envValue = process.env.TOKEN_GATED_AVAX_CONTRACT_ADDRESSES?.trim();
    // If the env var is not set, return an empty array
    return envValue
        ? envValue.split(",").filter((address) => address.trim() !== "")
        : [];
}

/**
 * Gets erc20 staking contract addresses (comma-separated)
 */
export function getErc20StakingContractAddresses(): string[] {
    const envValue =
        process.env.NEXT_PUBLIC_ERC20_STAKING_CONTRACT_ADDRESSES?.trim();
    return envValue
        ? envValue.split(",").filter((address) => address.trim() !== "")
        : [];
}

/**
 * Gets minimum staked erc20 tokens required for entry
 */
export function getMinStakedErc20TokensHeldToAllowEntryToAnEvent(): BigInt {
    return process.env.NEXT_PUBLIC_MIN_ERC20_STAKED_TOKENS_REQUIRED
        ? BigInt(process.env.NEXT_PUBLIC_MIN_ERC20_STAKED_TOKENS_REQUIRED)
        : BigInt(-1);
}

/**
 * Get Anthropic API Key (Claude AI)
 */
export function getAnthropicApiKey(): string {
    return process.env.ANTHROPIC_API_KEY || "";
}

/**
 * Get OpenAI API Key
 */
export function getOpenAIApiKey(): string {
    return process.env.OPENAI_API_KEY || "";
}

/**
 * Get Third Web PayEmbed Chain (Only currently supports values "sepolia" and "base")
 */
export function getThirdWebPayEmbedChain(): string {
    return process.env.NEXT_PUBLIC_THIRD_WEB_PAY_EMBED_CHAIN || "base";
}

/**
 * Get Third Web PayEmbed Token (Only current supports values "WETH" and "USDC")
 */
export function getThirdWebPayEmbedToken(): string {
    return process.env.NEXT_PUBLIC_THIRD_WEB_PAY_EMBED_TOKEN || "USDC";
}

/**
 * Set Winner Endpoint (AWS API Endpoint)
 * @returns the set winner endpoint
 */
export function getSetWinnerEndpoint(): string {
    return process.env.NEXT_PUBLIC_AWS_SET_WINNER_ENDPOINT || "";
}

/**
 * Initiate Prediction Endpoint (AWS API Endpoint)
 * @returns the initiate prediction endpoint
 */
export function getInitiatePredictionEndpoint(): string {
    return process.env.NEXT_PUBLIC_AWS_INITIATE_PREDICTION_ENDPOINT || "";
}

/**
 * Confirm Prediction Endpoint (AWS API Endpoint)
 * @returns the confirm prediction endpoint
 */
export function getConfirmPredictionEndpoint(): string {
    return process.env.NEXT_PUBLIC_AWS_CONFIRM_PREDICTION_ENDPOINT || "";
}

/**
 * Initiate Prediction Endpoint (AWS API Endpoint)
 * @returns the initiate prediction endpoint
 */
export function getInitiateChoicePredictionEndpoint(): string {
    return (
        process.env.NEXT_PUBLIC_AWS_CHOICE_INITIATE_PREDICTION_ENDPOINT || ""
    );
}

/**
 * Get Prediction Endpoint (AWS API Endpoint)
 * @returns the get prediction endpoint
 */
export function getGetPredictionEndpoint(): string {
    return (
        process.env.NEXT_PUBLIC_AWS_GET_PREDICTION_ENDPOINT || ""
    );
}

/**
 * Confirm Prediction Endpoint (AWS API Endpoint)
 * @returns the confirm prediction endpoint
 */
export function getConfirmChoicePredictionEndpoint(): string {
    return process.env.NEXT_PUBLIC_AWS_CHOICE_CONFIRM_PREDICTION_ENDPOINT || "";
}

/**
 * Get minimum credits required to allow entry to an event
 * @returns the minimum credits required
 */
export function getMinCreditsHeldToAllowEntryToAnEvent(): number {
    return process.env.MIN_CREDITS_HELD_TO_ALLOW_ENTRY_TO_AN_EVENT
        ? Number(process.env.MIN_CREDITS_HELD_TO_ALLOW_ENTRY_TO_AN_EVENT)
        : 100000;
}

/***
 * Get RPC URL for Ethereum
 */
export function getEthRPCProvider(): string {
    return process.env.ETH_RPC_PROVIDER || "";
}

/**
 * Skybox Stream App base api (AWS API Endpoint)
 * @returns the skybox stream app endpoint
 */
export function getSkyboxStreamAppApiEndpoint(): string {
    return process.env.NEXT_PUBLIC_AWS_IVS_SKYBOX_STREAM_APP_URL || "";
}

/**
 * Gets the Thousands Campaign contract address
 * @returns the Thousands Campaign contract address
 */
export function getThousandsCampaignContractAddress(): string {
    return process.env.NEXT_PUBLIC_THOUSANDS_CAMPAIGN_CONTRACT_ADDRESS || "";
}

/**
 * Gets the Thousands Campaign ID
 * @returns the Thousands Campaign ID
 */
export function getThousandsCampaignId(): string {
    return process.env.THOUSANDS_CAMPAIGN_ID || "1";
}

/**
 * Gets the RPC provider URL for local development
 * @returns the RPC provider URL
 */
export function getLocalRPCProvider(): string {
    return process.env.LOCAL_RPC_PROVIDER || "http://127.0.0.1:8545";
}

/**
 * Gets the chain ID for local development
 * @returns the chain ID (31337 for Anvil)
 */
export function getLocalChainId(): number {
    return 31337; // Anvil default chain ID
}

/**
 * Gets the etherscan-style explorer URL for transactions
 * @returns the explorer URL 
 */
export function getEthExplorerUrl(): string {
    return process.env.NEXT_PUBLIC_ETH_EXPLORER_URL || "https://etherscan.io";
}

/**
 * Generates a transaction link for the configured explorer
 * @param transactionHash - the transaction hash to link to
 * @returns the full URL to view the transaction
 */
export function getTransactionLink(transactionHash: string): string {
    const explorerUrl = getEthExplorerUrl();
    return `${explorerUrl}/tx/${transactionHash}`;
}
