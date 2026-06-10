import dotenv from "dotenv";
import { ENV, LOCAL, PROD, TEST, CONDUIT } from "../constants";
import { Environment } from "../types";

dotenv.config();

export function getPort() {
    return process.env.PORT || 3002;
}

export function getMaxUsersPerThread() {
    return Number(process.env.MAX_USERS_PER_THREAD) || 995;
}

export function getOpenSeaCollectionUrl() {
    return process.env.OPENSEA_COLLECTION_URL;
}

/**
 * @returns the smart contract address for the airdrop
 */
export function getWildcardSwagContractAddress(): string {
    return process.env.WILDCARD_SWAG_CONTRACT_ADDRESS || "";
}

export function getWildcardDistributorContractAddress(): string {
    return process.env.WILDCARD_DISTRIBUTOR_CONTRACT_ADDRESS || "";
}

export function getAirdropChannelId(): string {
    return process.env.AIRDROP_CHANNEL_ID || "";
}

export function getLeaderboardChannelId(): string {
    return process.env.LEADERBOARD_CHANNEL_ID || "";
}

export function getPrivateAdminChannelId(): string {
    return process.env.AIRDROP_ADMIN_CHANNEL_ID || "";
}

export function getWildPassAllowListRegistrationChannelId(): string {
    return process.env.WILDPASS_ALLOWLIST_REGISTRATION_CHANNEL_ID || "";
}

export function getPlaytestChannelId(): string {
    return process.env.DISCORD_PLAYTEST_CHANNEL_ID || "";
}

export function getLinkWalletChannelId(): string {
    return process.env.LINK_WALLET_CHANNEL_ID || "";
}

export function getKudosChannelId(): string {
    return process.env.KUDOS_CHANNEL_ID || "";
}

export function getWildPassInvitedRoleId(): string {
    return process.env.WILDPASS_INVITED_ROLE_ID || "";
}

export function getDiscordToken() {
    const env = getEnvironment();
    switch (env) {
        case Environment.LOCAL:
            return process.env.DISCORD_TOKEN_LOCAL;
        case Environment.CONDUIT:
            return process.env.DISCORD_TOKEN_LOCAL;
        case Environment.TEST:
            return process.env.DISCORD_TOKEN_TEST;
        case Environment.PROD:
            return process.env.DISCORD_TOKEN_PROD;
    }
}

export function getDiscordAppId() {
    const env = getEnvironment();
    switch (env) {
        case Environment.LOCAL:
            return process.env.DISCORD_APP_ID_LOCAL;
        case Environment.CONDUIT:
            return process.env.DISCORD_APP_ID_LOCAL;
        case Environment.TEST:
            return process.env.DISCORD_APP_ID_TEST;
        case Environment.PROD:
            return process.env.DISCORD_APP_ID_PROD;
    }
}

export function getDiscordGuildId() {
    const env = getEnvironment();
    switch (env) {
        case Environment.LOCAL:
            return process.env.DISCORD_GUILD_ID_LOCAL;
        case Environment.CONDUIT:
            return process.env.DISCORD_GUILD_ID_LOCAL;
        case Environment.TEST:
            return process.env.DISCORD_GUILD_ID_TEST;
        case Environment.PROD:
            return process.env.DISCORD_GUILD_ID_PROD;
    }
}

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
    // check if there's a command-line option, ex. env=test
    for (let i = 0; i < process.argv.length; i += 1) {
        const arg = process.argv[i];
        const envArgArr = arg.split("=");
        if (envArgArr.length != 2 || envArgArr[0] !== ENV) {
            continue;
        }

        const targetEnv = envArgArr[1];
        return getEnvironmentFromString(targetEnv);
    }

    // otherwise check if the TARGET_ENVIRONMENT env variable is set
    const targetEnv = process.env.TARGET_ENVIRONMENT;
    if (targetEnv) {
        return getEnvironmentFromString(targetEnv);
    }

    // default to local as last resort
    console.log(`Target environment to not found, defaulting to LOCAL`);
    return Environment.LOCAL;
}

function getEnvironmentFromString(targetEnvironment: string): Environment {
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

/**
 * @returns the bot balance check interval as a number
 */
export function getBotWalletBalanceCheckIntervalMin(): number {
    return Number(process.env.BOT_WALLET_BALANCE_CHECK_INTERVAL_MIN) || 60;
}

/**
 * @returns the minimum matic balance required for bot
 */
export function getMinBotWalletMATICBalance(): number {
    return Number(process.env.MIN_BOT_WALLET_MATIC_BALANCE) || 10;
}

/**
 * @returns the minimum token balance of bot to airdrop
 */
export function getMinBotTokenBalance(): number {
    return Number(process.env.MIN_BOT_TOKEN_BALANCE) || 1;
}

/**
 * @returns the minimum token balance of bot before it starts sending out alert messages
 */
export function getMinBotTokenBalanceNotification(): number {
    return Number(process.env.MIN_BOT_TOKEN_BALANCE_NOTIFICATION) || 5;
}

/**
 * @returns the url for the uptime heartbeat endpoint
 */
export function getUptimeHeartbeatUrl(): string {
    return process.env.UPTIME_HEARTBEAT_URL || "";
}

/**
 * @returns the interval in seconds that we should ping the uptime endpoint
 */
export function getUptimeHeartbeatIntervalSeconds(): number {
    return Number(process.env.UPTIME_HEARTBEAT_INTERVAL_SECONDS) || 120;
}

/**
 * @returns the interval in seconds that we should check and conclude airdrops
 */
export function getConcludeAirdropIntervalSeconds(): number {
    return Number(process.env.CONCLUDE_AIRDROP_INTERVAL_SECONDS) || 60;
}

/**
 * @returns the interval in seconds that we should update the Leaderboard
 */
export function getLeaderboardCronJob(): string {
    //This 0 0 * * * is 0th minute of 0th hour of every day, aka midnight every day
    return process.env.LEADERBOARD_CRON_JOB || "0 0 * * *";
}

/**
 * @returns the interval in seconds that we should update the Badge
 */
export function getBadgeCronJob(): string {
    return process.env.BADGES_CRON_JOB || "5 0 * * *";
}

/**
 * @returns the interval in seconds that we should update the points for all users
 */
export function getPointsCronJob(): string {
    //This 0 0 * * * is 5th minute of 0th hour of every day, aka 12:05 AM every day
    return process.env.POINTS_CRON_JOB || "5 0 * * *";
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
 * @returns the interval in seconds that we should sync user's discord tags
 */
export function getDiscordTagSyncIntervalSeconds(): number {
    return Number(process.env.DISCORD_SYNC_INTERVAL_SECONDS) || 3600;
}

/**
 * @returns the interval in seconds that we should reconcile pfps
 */
export function getReconcilePfpIntervalSeconds(): number {
    return Number(process.env.RECONCILE_PFP_INTERVAL_SECONDS) || 4 * 60 * 60; // default to 4 hours
}

/**
 * @returns the papertrail username (for logging)
 */
export function getPapertrailUsername(): string {
    return process.env.PAPERTRAIL_USERNAME || "";
}

/**
 * @returns the papertrail password (for logging)
 */
export function getPapertrailPassword(): string {
    return process.env.PAPERTRAIL_PASSWORD || "";
}

/**
 * @returns the interval in seconds that the bot updates the airdrop embeds
 */
export function getUpdateAirdropEmbedsIntervalSeconds(): number {
    return Number(process.env.UPDATE_AIRDROP_EMBED_INTERVAL_SECONDS) || 10;
}

/**
 * @returns the base url of the dapp
 */
export function getDappBaseUrl(): string {
    return process.env.DAPP_BASE_URL || "http://localhost:3000";
}

/**
 * @returns the number of retry attempts for each axios call
 */
export function getAxiosRetryCount(): number {
    return Number(process.env.AXIOS_RETRY_COUNT) || 3;
}

/**
 * @returns RPC provider for ethersjs
 */
export function getRpcProvider(): string {
    return process.env.RPC_PROVIDER || "http://127.0.0.1:8545/";
}

/**
 * @returns Private key to interact with the blockchain
 */
export function getPrivateKey(): string {
    return process.env.PRIVATE_KEY || "";
}

export function getDappWalletPrivateKey(): string {
    return process.env.DAPP_WALLET_PRIVATE_KEY || "";
}

export function getWildfileContractAddress(): string {
    return process.env.WILDFILE_CONTRACT_ADDRESS || "";
}

export function getWildpassContractAddress(): string {
    return process.env.WILDPASS_CONTRACT_ADDRESS || "";
}

/**
 * Get the number of minutes that a link wallet guid/ session is valid for before expiring
 * @returns the number of minutes that a link wallet guid is valid for before expiring
 */
export function getLinkWalletGuidExpiresMinutes(): number {
    return Number(process.env.LINK_WALLET_GUID_EXPIRES_MINUTES) || 30;
}

export function getWildeventRegistryContractAddress(): string {
    return process.env.WILDEVENT_REGISTRY_CONTRACT_ADDRESS || "";
}

export function getPlaytestSessionWildeventContractAddress(): string {
    return process.env.PLAYTEST_SESSION_WILDEVENT_ADDRESS || "";
}

export function getPlaytestGameWildeventContractAddress(): string {
    return process.env.PLAYTEST_GAME_WILDEVENT_ADDRESS || "";
}

export function getLinkedSocialWildeventContractAddress(): string {
    return process.env.LINKED_SOCIAL_WILDEVENT_ADDRESS || "";
}

export function getDiscordEventWildeventContractAddress(): string {
    return process.env.DISCORD_EVENT_WILDEVENT_ADDRESS || "";
}

export function getDiscordEventAttendanceWildeventContractAddress(): string {
    return process.env.DISCORD_EVENT_ATTENDANCE_WILDEVENT_ADDRESS || "";
}

export function getKudosWildeventContractAddress(): string {
    return process.env.KUDOS_WILDEVENT_ADDRESS || "";
}

export function getArchivedLeaderboardWildeventContractAddress(): string {
    return process.env.ARCHIVED_LEADERBOARD_WILDEVENT_ADDRESS || "";
}

export function getWildcardEventTicketContractAddress(): string {
    return process.env.WILDCARD_EVENT_TICKET_ADDRESS || "";
}

export function getWildcardTicketBoothContractAddress(): string {
    return process.env.WILDCARD_TICKET_BOOTH_ADDRESS || "";
}

export function getWildeventsChannelId(): string {
    return process.env.WILDEVENTS_CHANNEL_ID || "";
}

export function getAirdropWildeventContractAddress(): string {
    return process.env.AIRDROP_WILDEVENT_ADDRESS || "";
}

export function getPfpWildeventContractAddress(): string {
    return process.env.PFP_WILDEVENT_ADDRESS || "";
}

export function getLinkedWalletWildeventContractAddress(): string {
    return process.env.LINKED_WALLET_WILDEVENT_ADDRESS || "";
}

/**
 * @returns Alchemy API key
 */
export function getAlchemyApiKey(): string {
    return process.env.ALCHEMY_API_KEY || "";
}

export function getSendWildfileMintStats(): boolean {
    return process.env.SEND_WILDFILE_MINT_STATS === "true";
}

/**
 * Get Space and Time Configs
 */
export function getSpaceAndTimeConfigs(): {
    sxtUserId: string;
    sxtUserPublicKey: string;
    sxtUserPrivateKey: string;
    sxtTableBiscuit: string;
} {
    const sxtUserId = process.env.SXT_USER_ID || "";
    if (!sxtUserId) {
        console.warn("SXT_USER_ID not found");
    }

    const sxtUserPublicKey = process.env.SXT_USER_PUBLIC_KEY || "";
    if (!sxtUserPublicKey) {
        console.warn("SXT_USER_PUBLIC_KEY not found");
    }

    const sxtUserPrivateKey = process.env.SXT_USER_PRIVATE_KEY || "";
    if (!sxtUserPrivateKey) {
        console.warn("SXT_USER_PRIVATE_KEY not found");
    }

    const sxtTableBiscuit = process.env.SXT_TABLE_BISCUIT || "";
    if (!sxtTableBiscuit) {
        console.warn("SXT_TABLE_BISCUIT not found");
    }

    return {
        sxtUserId,
        sxtUserPublicKey,
        sxtUserPrivateKey,
        sxtTableBiscuit,
    };
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
 * Get the interval in seconds to poll for new eligible fan attendance airdrop recipients
 * @returns the number of seconds before polling for new eligible fan attendance airdrop recipients
 */
export function getFanAttendanceAirdropPollingIntervalSeconds(): number {
    return (
        Number(process.env.FAN_ATTENDANCE_AIRDROP_POLLING_INTERVAL_SECONDS) ||
        10
    ); // default to 10 seconds
}

/**
 * Get the fan attendance airdrop token id
 * @returns - the fan attendance airdrop token id
 */
export function getFanAttendanceAirdropTokenId(): number {
    return Number(process.env.FAN_ATTENDANCE_AIRDROP_TOKEN_ID) || 23;
}

export function getDappApiKey(): string {
    return process.env.DAPP_API_KEY || "";
}
