import { Environment } from "@repo/interfaces";
import { LOCAL, TEST, PROD } from "../constants";

export function isLocalEnvironment(): boolean {
    return getEnvironment() === Environment.LOCAL;
}

export function isTestEnvironment(): boolean {
    return getEnvironment() === Environment.TEST;
}

export function isProdEnvironment(): boolean {
    return getEnvironment() === Environment.PROD;
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
        default:
            console.warn(
                `Unknown target environment '${targetEnvironment}', defaulting to LOCAL`
            );
            return Environment.LOCAL;
    }
}

export function getBeamApiUrl(): string | undefined {
    if (isLocalEnvironment()) {
        return "https://api.beamable.com";
    }
    return process.env.BEAM_API_URL;
}

/**
 * @dev - Public CID and PID provided by beamable web example
 * @url - https://github.com/beamable/BeamWebAccess-example
 */

export function getBeamCid(): string {
    return process.env.BEAM_CID || "1418422019508250";
}

export function getBeamPid(): string {
    return process.env.BEAM_PID || "DE_1719820960373762";
}

export function getGamerTagPid(): string {
    return process.env.GAMER_TAG_PID || "";
}

export function getBeamRealmSecret(): string {
    return process.env.REALM_SECRET || "";
}

/**
 * Get the web app name by environment
 * @returns - The web app name by environment
 */
export function getWebAppName(): string {
    if (!process.env.NEXT_PUBLIC_WEB_APP_NAME) {
        console.warn(`Web app name not found.`);
    }
    return process.env.NEXT_PUBLIC_WEB_APP_NAME || "Exhibitions";
}

/**
 * Gets the API endpoint root url
 * @returns the API endpoint root url
 */
export function getAPIEndpointRootUrl(): string {
    return process.env.API_ENDPOINT_ROOT_URL || "http://localhost:3000";
}

/**
 * Gets the admin account email
 * @returns - The admin account email
 */
export function getAdminAccountEmail(): string {
    return process.env.ADMIN_ACCOUNT_EMAIL || "";
}

/**
 * Gets the admin account password
 * @returns - The admin account password
 */
export function getAdminAccountPassword(): string {
    return process.env.ADMIN_ACCOUNT_PASSWORD || "";
}

// =============

/**
 * Get the Google OAuth client ID
 * @returns - The Google OAuth client ID
 */
export function getOAuthGoogleClientId(): string {
    if (!process.env.OAUTH_GOOGLE_CLIENT_ID) {
        console.warn(`Google OAuth client ID not found.`);
    }
    return process.env.OAUTH_GOOGLE_CLIENT_ID || "";
}

/**
 * Get the Github OAuth client ID
 * @returns - The Github OAuth client ID
 */
export function getOAuthGithubClientId(): string {
    if (!process.env.OAUTH_GITHUB_CLIENT_ID) {
        console.warn(`Github OAuth client ID not found.`);
    }
    return process.env.OAUTH_GITHUB_CLIENT_ID || "";
}

/**
 * Get the Github OAuth client secret
 * @returns - The Github OAuth client secret
 */
export function getOAuthGithubClientSecret(): string {
    if (!process.env.OAUTH_GITHUB_CLIENT_SECRET) {
        console.warn(`Github OAuth client secret not found.`);
    }
    return process.env.OAUTH_GITHUB_CLIENT_SECRET || "";
}

/**
 * Get the Google OAuth client secret
 * @returns - The Google OAuth client secret
 */
export function getOAuthGoogleClientSecret(): string {
    if (!process.env.OAUTH_GOOGLE_CLIENT_SECRET) {
        console.warn(`Google OAuth client secret not found`);
    }
    return process.env.OAUTH_GOOGLE_CLIENT_SECRET || "";
}

/**
 * Get the Discord OAuth client ID
 * @returns - The Discord OAuth client ID
 */
export function getOAuthDiscordClientId(): string {
    if (!process.env.DISCORD_CLIENT_ID) {
        console.warn(`Discord OAuth client ID not found.`);
    }
    return process.env.DISCORD_CLIENT_ID || "";
}

/**
 * Get the Discord OAuth client secret
 * @returns - The Discord OAuth client secret
 */
export function getOAuthDiscordClientSecret(): string {
    if (!process.env.DISCORD_CLIENT_SECRET) {
        console.warn(`Discord OAuth client secret not found.`);
    }
    return process.env.DISCORD_CLIENT_SECRET || "";
}

/**
 * Get the JWT secret
 */
export function getJWTSecret(): string {
    if (!process.env.JWT_SECRET) {
        console.warn(`JWT secret not found.`);
    }
    return process.env.JWT_SECRET || "";
}

/**
 * Get the NextAuth secret
 * @returns - The NextAuth secret
 */
export function getNextAuthSecret(): string {
    if (!process.env.NEXTAUTH_SECRET) {
        console.warn(`NextAuth secret not found.`);
    }
    return process.env.NEXTAUTH_SECRET || "";
}

/**
 * Get the next auth session expiry seconds (how long the user session lasts before being auto logged out)
 */
export function getNextAuthSessionExpirySeconds(): number {
    const nextAuthSessionExpirySeconds =
        process.env.NEXTAUTH_SESSION_EXPIRY_SECONDS || 24 * 60 * 60;
    return Number(nextAuthSessionExpirySeconds);
}

export function getDocsPageUrlByEnvironment(): string {
    switch (getEnvironment()) {
        case Environment.PROD:
            return process.env.NEXT_PUBLIC_DOCS_PAGE_URL_PROD || "";
        case Environment.TEST:
            return process.env.NEXT_PUBLIC_DOCS_PAGE_URL_TEST || "";
        default:
            return process.env.NEXT_PUBLIC_DOCS_PAGE_URL_LOCAL || "";
    }
}

/**
 * gets the mongo connection url
 * @dev - throws error if any of the environment variables are not set
 * @returns the mongo connection url
 */
export function getMongoConnectionURL() {
    const mongoDbName = process.env.MONGODB_NAME;
    if (!mongoDbName) {
        console.log(
            "Environment variable MONGODB_NAME needs to be set to establish MongoDB connection"
        );
    }

    const mongoDbUsername = process.env.MONGODB_USERNAME;
    if (!mongoDbUsername) {
        console.log(
            "Environment variable MONGODB_USERNAME needs to be set to establish MongoDB connection"
        );
    }

    const mongoDbPassword = process.env.MONGODB_PASSWORD;
    if (!mongoDbPassword) {
        console.log(
            "Environment variable MONGODB_PASSWORD needs to be set to establish MongoDB connection"
        );
    }

    const mongoDbClusterName = process.env.MONGODB_CLUSTER_NAME;
    if (!mongoDbClusterName) {
        console.log(
            "Environment variable MONGODB_CLUSTER_NAME needs to be set to establish MongoDB connection"
        );
    }

    // setup the connection
    const mongoUrl = `mongodb+srv://${mongoDbUsername}:${mongoDbPassword}@${mongoDbClusterName}.mongodb.net/${mongoDbName}?retryWrites=true&w=majority`;

    console.log(
        `MongoDB info: ${mongoDbName}, on cluster ${mongoDbClusterName}`
    );

    return mongoUrl;
}

/**
 * Get the Twitch OAuth client ID
 * @returns - The Twitch OAuth client ID
 */
export function getOAuthTwitchClientId(): string {
    if (!process.env.TWITCH_CLIENT_ID) {
        console.warn(`Twitch OAuth client ID not found.`);
    }
    return process.env.TWITCH_CLIENT_ID || "";
}

/**
 * Get the Twitch OAuth client secret
 * @returns - The Twitch OAuth client secret
 */
export function getOAuthTwitchClientSecret(): string {
    if (!process.env.TWITCH_CLIENT_SECRET) {
        console.warn(`Twitch OAuth client secret not found.`);
    }
    return process.env.TWITCH_CLIENT_SECRET || "";
}

/**
 * Discord invite link
 * @returns - The Discord invite link
 */
export function getDiscordInviteLink(): string {
    return (
        process.env.NEXT_PUBLIC_DISCORD_INVITE_LINK ||
        "https://discord.gg/playwildcard"
    );
}

/***
 * Gets redis host
 * @returns redis host
 */
export function getRedisHost(): string {
    return process.env.REDIS_HOST || "127.0.0.1";
}

/**
 * Gets redis port
 * @returns redis port

 */
export function getRedisPort(): number {
    return Number(process.env.REDIS_PORT) || 6379;
}

/**
 * Gets redis username
 * @returns redis username
 */
export function getRedisUsername(): string {
    return process.env.REDIS_USERNAME || "";
}

/**
 * Gets redis password
 * @returns redis password
 */
export function getRedisPassword(): string {
    return process.env.REDIS_PASSWORD || "";
}

/**
 * Gets the account system admin access token
 * @dev - critical key for admin access
 * Generate a new token:
 * $ openssl rand -base64 32
 * @returns - The account system admin access token
 */
export function getAccountSystemAdminAccessToken(): string {
    if (!process.env.ACCOUNT_SYSTEM_ADMIN_ACCESS_TOKEN) {
        throw Error(`Account system admin access token not found.`);
    }
    return process.env.ACCOUNT_SYSTEM_ADMIN_ACCESS_TOKEN || "";
}

/**
 * Gets the completed swag set wildevent contract address
 * @returns - The account system admin access token
 */
export function getCompletedSwagSetWildeventContractAddress(): string {
    return process.env.NEXT_PUBLIC_COMPLETED_SWAG_SET_WILDEVENT_ADDRESS || "";
}

/**
 * TODO: remove later on but testing for now
 * Gets the pub nub publish key
 * @returns the pub nub publish key
 */
export function getPubnubPublishKey(): string {
    return process.env.NEXT_PUBLIC_PUBNUB_PUBLISHKEY || "";
}

/**
 * TODO: remove later on but testing for now
 * Gets the pub nub subscribe key
 * @returns the pub nub subscribe key
 */
export function getPubnubSubscribeKey(): string {
    return process.env.NEXT_PUBLIC_PUBNUB_SUBSCRIBEKEY || "";
}

/**
 * TODO: this is temporary until we get admin tools to mangaing seasons
 * Gets the current season id (_id from Seasons collection in MongoDB)
 * @returns the current season id (_id from Seasons collection in MongoDB)
 */
export function getCurrentSeasonId(): string {
    return process.env.CURRENT_SEASON || "";
}

/**
 * Gets the pub nub secret key
 * @returns the pub nub secret key
 */
export function getPubnubSecretKey(): string {
    return process.env.PUBNUB_SECRET_KEY || "";
}

/**
 * Gets the IvsIdleGamePlayerAction Url for AWS for this environment
 * @returns the url
 */
export function getIvsIdleGamePlayerActionUrl(): string {
    return process.env.AWS_IVS_IDLE_GAME_PLAYER_ACTION_URL || "";
}

/**
 * Gets the IvsAirdrop Url for AWS for this environment
 * @returns the url
 */
export function getIvsAirdropUrl(): string {
    return process.env.AWS_IVS_AIRDROP_URL || "";
}

/**
 * Gets the IvsEmojiAction Url for AWS for this environment
 * @returns the url
 */
export function getIvsChatReactionUrl(): string {
    return process.env.NEXT_PUBLIC_AWS_IVS_CHAT_REACTION_URL || "";
}

/**
 * Gets the IvsEmojiAction Url for AWS for this environment
 * @returns the url
 */
export function getIvsChatMessageUrl(): string {
    return process.env.NEXT_PUBLIC_AWS_IVS_SEND_CHAT_MESSAGE_ACTION_URL || "";
}

/**
 * Gets the IvsVotingStreamApp Url for AWS for this environment
 * @returns the url
 */
export function getIvsVotingStreamAppUrl(): string {
    return process.env.NEXT_PUBLIC_AWS_IVS_VOTING_STREAM_APP_URL || "";
}

/**
 * Gets the aws api endpoint Url for this environment
 * @returns the url
 */
export function getPriceQuoteUrl(): string {
    return process.env.NEXT_PUBLIC_AWS_GET_PRICE_QUOTE_URL || "";
}

/**
 * Gets the aws api endpoint Url for this environment
 * @returns the url
 */
export function getPlaceOrderUrl(): string {
    return process.env.NEXT_PUBLIC_AWS_PLACE_ORDER_URL || "";
}

/**
 * Gets the aws api endpoint Url for this environment
 * @returns the url
 */
export function getQueueApiUrl(): string {
    return process.env.NEXT_PUBLIC_AWS_QUEUE_API_URL || "";
}

/**
 * Gets the aws api endpoint Url for this environment
 * @returns the url
 */
export function getTopCoinsUrl(): string {
    return process.env.NEXT_PUBLIC_AWS_GET_TOP_COINS_URL || "";
}

/**
 * Gets the aws api endpoint Url for this environment
 * @returns the url
 */
export function getMyCoinsUrl(): string {
    return process.env.NEXT_PUBLIC_AWS_GET_MY_COINS_URL || "";
}

/**
 * Gets the aws api endpoint Url for this environment
 * @returns the url
 */
export function getChatLeaderboardUrl(): string {
    return process.env.NEXT_PUBLIC_AWS_GET_CHAT_LEADERBOARD_URL || "";
}

/**
 * Gets the aws api endpoint Url for this environment
 * @returns the url
 */
export function getIvsChatActionUrl(): string {
    return process.env.NEXT_PUBLIC_AWS_IVS_CHAT_ACTION_URL || "";
}

/**
 * Gets the aws api endpoint Url for this environment
 * @returns the url
 */
export function getIvsBoostActionUrl(): string {
    return process.env.NEXT_PUBLIC_AWS_IVS_BOOST_ACTION_URL || "";
}

/**
 * Gets the aws api endpoint Url for this environment
 * @returns the url
 */
export function getFanDetailsUrl(): string {
    return process.env.NEXT_PUBLIC_AWS_GET_FAN_DETAILS || "";
}

/**
 * Gets the IvsIdleGame Platform API Key for AWS for this environment
 * @returns the API key
 */
export function getIvsIdleGamePlatformApiKey(): string {
    return process.env.AWS_IVS_IDLE_GAME_PLATFORM_API_KEY || "";
}

/**
 * Gets the IvsIdleGame Platform API Key for AWS for this environment
 * @returns the API key
 */
export function getIvsGameEventUrl(): string {
    return process.env.AWS_IVS_GAME_EVENT_URL || "";
}

/**
 * Gets the IvsIdleGame Platform API Key for AWS for this environment
 * @returns the API key
 */
export function getIvsIdleGameGameApiKey(): string {
    return process.env.AWS_IVS_IDLE_GAME_GAME_API_KEY || "";
}

/**
 * Gets a string of JSON that configures the airdrops displayed in Wildcard for this environment
 * @returns the JSON string
 */
export function getAirDropGifts(): string {
    return (
        process.env.NEXT_PUBLIC_AIRDROP_GIFTS ||
        '[{"Id": "15","Name": "Ticket to Wild","ImageUrl": "https://test.wildfile.wildcardgame.com/images/nfts/Ticket_To_Wild.png","Description": "A souvenir for participating in a Wildcard community playtest or event."}, {"Id": "16","Name": "Ultimate Fan","ImageUrl": "https://test.wildfile.wildcardgame.com/images/nfts/Ultimate_Fan.png","Description": "A souvenir for showing superior fandom around the Wildcard community."}, {"Id": "17","Name": "Bring The Hype","ImageUrl": "https://test.wildfile.wildcardgame.com/images/nfts/Bring_The_Hype.png","Description": "A souvenir for bringing the Wildcard hype."}, {"Id": "18","Name": "Lets Get Wild","ImageUrl": "https://test.wildfile.wildcardgame.com/images/nfts/Lets_Get_Wild.png","Description": "A souvenir for showing Wild fan spirit."}, {"Id": "19","Name": "Fan on Fire","ImageUrl": "https://test.wildfile.wildcardgame.com/images/nfts/Fan_On_Fire.png","Description": "A souvenir for your history of being a great Wildcard fan."}, {"Id": "20","Name": "Fly it High","ImageUrl": "https://test.wildfile.wildcardgame.com/images/nfts/Fly_It_High.png","Description": "A souvenir for flying your Wildcard fan flag high."}, {"Id": "21","Name": "You Earned It","ImageUrl": "https://test.wildfile.wildcardgame.com/images/nfts/You_Earned_It.png","Description": "A souvenir for being a Wildcard community MVP."}, {"Id": "22","Name": "Wild Win","ImageUrl": "https://test.wildfile.wildcardgame.com/images/nfts/Wild_Win.png","Description": "A souvenir for your Wildcard win."}]'
    );
}

/**
 * Gets the default :serverCode for this environment
 * @returns the :serverCode
 */
export function getDefaultServerCode(): string {
    return process.env.DEFAULT_SERVER_CODE || "thousands";
}

/**
 * Determines whether logged-out users should be redirected to the CMS landing page.
 * Defaults to false
 */
export function isLoggedOutCmsRedirectEnabled(): boolean {
    const flag = process.env.NEXT_PUBLIC_ENABLE_LOGGED_OUT_CMS_REDIRECT;
    if (flag === undefined) {
        return false;
    }

    return flag === "true";
}

/**
 * Get the AWS user reactions by environment
 * @returns - The user reactions by environment
 */
export function getAWSReactionsEnabled(): boolean {
    if (!process.env.NEXT_PUBLIC_AWS_REACTIONS_ENABLED) {
        console.warn(
            `User reactions is not enabled. Set NEXT_PUBLIC_AWS_REACTIONS_ENABLED in environment variable.`
        );
    }

    return process.env.NEXT_PUBLIC_AWS_REACTIONS_ENABLED === "true";
}

/**
 * Get the AWS user reactions by environment
 * @returns - The user reactions by environment
 */
export function getAWSMessagesEnabled(): boolean {
    if (!process.env.NEXT_PUBLIC_AWS_MESSAGES_ENABLED) {
        console.warn(
            `User messages is not enabled. Set NEXT_PUBLIC_AWS_MESSAGES_ENABLED in environment variable.`
        );
    }

    return process.env.NEXT_PUBLIC_AWS_MESSAGES_ENABLED === "true";
}

/**
 * Get the aws api endpoint Url
 * @returns - The ivs token distribution url
 */
export function getIvsTokenDistributionUrl(): string {
    if (!process.env.NEXT_PUBLIC_AWS_IVS_TOKEN_DISTRIBUTION_URL) {
        console.warn(
            `User messages is not enabled. Set NEXT_PUBLIC_AWS_MESSAGES_ENABLED in environment variable.`
        );
    }

    return process.env.NEXT_PUBLIC_AWS_IVS_TOKEN_DISTRIBUTION_URL || "";
}

/**
 * Gets the Xsolla merchant ID for this environment
 * @returns the Xsolla merchant ID
 */
export function getXsollaMerchantId(): string {
    return process.env.XSOLLA_MERCHANT_ID || "";
}

/**
 * Gets the Xsolla project ID for this environment
 * @returns the Xsolla project ID
 */
export function getXsollaProjectId(): string {
    return process.env.XSOLLA_PROJECT_ID || "";
}

/**
 * Gets the Xsolla API key for this environment
 * @returns the Xsolla API key
 */
export function getXsollaApiKey(): string {
    return process.env.XSOLLA_API_KEY || "";
}

/**
 * Gets whether Xsolla is in sandbox mode for this environment
 * @returns true if sandbox mode is enabled
 */
export function getXsollaSandboxMode(): boolean {
    return process.env.XSOLLA_SANDBOX_MODE !== "false";
}

export function getGameDataApiKey(): string {
    return process.env.GAME_DATA_API_KEY || "";
}

export function getSnagLoyaltyPointsHomePageUrl(): string {
    const url =
        process.env.NEXT_PUBLIC_SNAG_LOYALTY_POINTS_HOME_PAGE_URL ||
        process.env.SNAG_LOYALTY_POINTS_HOME_PAGE_URL ||
        "";

    if (!url) {
        console.warn("Thousands points home page URL not configured.");
    }

    return url;
}

/**
 * Gets the AWS purchase sponsorship URL
 * @returns the purchase sponsorship URL
 */
export function getPurchaseSponsorshipUrl(): string {
    if (!process.env.NEXT_PUBLIC_AWS_PURCHASE_SPONSORSHIP_URL) {
        console.warn(
            "Purchase sponsorship URL not configured. Set NEXT_PUBLIC_AWS_PURCHASE_SPONSORSHIP_URL."
        );
    }
    return process.env.NEXT_PUBLIC_AWS_PURCHASE_SPONSORSHIP_URL || "";
}

/**
 * Gets the franchise asset marketplace URL
 * @returns the franchise asset marketplace URL
 */
export function getFranchiseAssetMarketplaceUrl(): string {
    const url =
        process.env.NEXT_PUBLIC_FRANCHISE_ASSET_MARKETPLACE_URL ||
        process.env.FRANCHISE_ASSET_MARKETPLACE_URL ||
        "";

    if (!url) {
        console.warn(
            "Franchise asset marketplace URL not configured. Set FRANCHISE_ASSET_MARKETPLACE_URL."
        );
    }

    return url;
}

/**
 * Gets the franchise offer accept/reject URL
 * @returns the franchise offer accept/reject URL
 */
export function getFranchiseOfferAcceptOrRejectUrl(): string {
    const url =
        process.env.NEXT_PUBLIC_FRANCHISE_OFFER_ACCEPT_OR_REJECT_URL ||
        "";

    if (!url) {
        console.warn(
            "Franchise offer accept/reject URL not configured. Set FRANCHISE_OFFER_ACCEPT_OR_REJECT_URL."
        );
    }

    return url;
}

/**
 * Determines whether the Franchises and Sponsorships features are enabled.
 * Defaults to false when the env var is unset.
 */
export function isFranchisesAndSponsorshipsEnabled(): boolean {
    const flag = process.env.ENABLE_FRANCHISES_AND_SPONSORSHIPS;
    if (flag === undefined) {
        return false;
    }
    return flag === "1" || flag === "true";
}

/**
 * Gets the franchise start date used for week calculations.
 * @returns ISO date string or empty string if not configured
 */
export function getFranchiseStartDate(): string {
    if (!process.env.FRANCHISE_START_DATE) {
        console.warn(
            "Franchise start date not configured. Set FRANCHISE_START_DATE."
        );
    }
    return process.env.FRANCHISE_START_DATE || "";
}
