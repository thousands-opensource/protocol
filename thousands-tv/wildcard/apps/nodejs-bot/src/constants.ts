export const CHANNEL = "channel";
export const ROLE = "role";
export const USER = "user";
export const ENV = "env";
export const LOCAL = "local";
export const TEST = "test";
export const PROD = "prod";
export const CONDUIT = "conduit";

// discord broadcast message name constants
export const MINT_WILDFILE_BROADCAST_MESSAGE =
    "mint-wildfile-broadcast-message";

// airdrop commands
export const AIRDROP = "airdrop";
export const GET_AIRDROP_CONTRACT_ADDRESS = "get-airdrop-contract-address";
export const GET_AIRDROP_BOT_WALLET_ADDRESS = "get-airdrop-bot-wallet-address";
export const VIEW_ACTIVE_AIRDROPS = "view-active-airdrops";
export const GET_TOKEN_BALANCE = "get-token-balance";

// airdrop-admin commands
export const AIRDROP_ADMIN = "airdrop-admin";
export const AWARD_ROLE_FOR_VOICE_CHANNEL = "award-role-for-voice-channel";
export const CREATE_AIRDROP = "create-airdrop";
export const CONCLUDE_AIRDROP = "conclude-airdrop";
export const REOPEN_AIRDROP = "reopen-airdrop";
export const EDIT_AIRDROP_DURATION = "edit-airdrop-duration";
export const GET_DISCORD_IDS_FROM_WILDFILES = "get-discord-ids-from-wildfiles";
export const GET_WILDFILE_IDS_FROM_DISCORD_IDS =
    "get-wildfiles-from-discord-ids";
export const GET_WILDFILE_IDS_FROM_WALLET_ADDRESSES =
    "get-wildfile-ids-from-addresses";
export const GET_DISCORD_IDS_BUTTON_ID = "get-discord-ids-button-id";
export const GET_DISCORD_IDS_MODAL_ID = "get-discord-ids-modal-id";
export const GET_WILDFILE_IDS_FROM_DISCORD_IDS_MODAL_ID =
    "wf-ids-from-discord-id-modal-id";
export const GET_WILDFILE_IDS_FROM_ADDRESSES_MODAL_ID =
    "wf-ids-from-addresses-modal-id";
export const WILDFILE_IDS_INPUT_FIELD = "wildfile-ids-modal-input-id";
export const DISCORD_IDS_INPUT_FIELD = "wildfile-ids-modal-input-id";
export const WALLET_ADDRESSES_INPUT_FIELD = "addresses-modal-input-id";
export const UPDATE_ALL_INITIAL_WILDFILE_IDS =
    "update-all-initial-wildfile-ids";
export const GET_WILDPASS_OG_HOLDERS = "get-wildpass-og-holders";
export const AWARD_ROLE_TO_USERS = "award-role-to-users";
export const AWARD_ROLE_TO_USERS_MODAL_ID = "award-role-to-users-modal-id";
export const ROLE_AWARDED_INPUT_FIELD = "role-awarded-input-id";
export const ARCHIVE_LEADERBOARD_COMMAND = "archive-leaderboard";
export const LEADERBOARD_ID = "leaderboard-id";
export const AIRDROP_SWAG = "airdrop-swag";
export const GET_AIRDROP_ADDRESSES_MODAL_ID = "get-airdrop-addresses-modal-id";
export const TOKEN_ID_INPUT_FIELD = "token-id-modal-input-id";
export const AIRDROP_ADDRESSES_INPUT_FIELD = "airdrop-addresses-modal-input-id";

// Wildevent commands
export const WILDEVENTS = "wildevents";
export const GET_REGISTERED_EVENT_TYPES = "get-registered-event-types";
export const FETCH_RECENT_WILDEVENTS = "fetch-recent-wildevents";
export const VENUE = "venue";
export const SPECIAL_EVENT = "special-event";
export const WILDEVENT_ID = "wildevent-id";
export const WINNER = "winner";
export const LOSER = "loser";

export const WILDEVENT_TYPE = "wildevent-type";
export const NUM_WILDEVENTS = "num-wildevents";

// Wildfile commands
export const WILDFILE = "wildfile";
export const GET_WILDFILE_INFO = "get-wildfile-info";

// Wildfile Admin commands
export const WILDFILE_ADMIN = "wildfile-admin";
export const TRANSFER_WILDFILE = "transfer-wildfile";
export const GENERATE_HELIKA_REPORT = "generate-helika-report";
export const WILDFILE_ID = "wildfile-id";
export const DISCORD_TAG = "discord-tag";
export const TO = "to";
export const GIVE_KUDOS = "give-kudos";

export const ADDRESS = "address";
export const TOKEN_ID = "token-id";
export const CLAIM_AIRDROP_BUTTON_ID = "claim-airdrop-button-id";
export const CLAIM_AIRDROP_MODAL_ID = "claim-airdrop-modal-id";
export const CLAIM_AIRDROP_ADDRESS = "claim-airdrop-address";
export const AIRDROP_DURATION_HOURS = "airdrop-duration-hours";
export const KUDOS_REASON = "kudos-reason";
export const KUDOS_TYPE = "kudos-type";
// Fan Visibility constants
export const FAN = "fan";
export const REACTION = "reaction"; // reaction used in the voice-channel

// Fan Visibility commands
export const REACT = "react";

// wildpass allowlist
export const WILDPASS_ALLOWLIST_REGISTER_WALLET_BUTTON_ID =
    "wildpass-allowlist-register-wallet-button-id";
export const WILDPASS_ALLOWLIST_REGISTER_WALLET_MODAL_ID =
    "wildpass-allowlist-register-wallet-modal-id";
export const WILDPASS_ALLOWLIST_CHECK_WALLET_BUTTON_ID =
    "wildpass-allowlist-check-wallet-button-id";

export const WILDCARD_LOGO_PNG = "wildcardLogo.png";

export const DEFAULT_BLOCK_EXPLORER_URL = "https://mumbai.polygonscan.com";

export const DEFAULT_EMBED_IMAGE_URL =
    "https://wildcard-web3.vercel.app/_next/image/?url=%2F_next%2Fstatic%2Fmedia%2Fw_icon_blue.2a89a041.png&w=32&q=75";
export const DISCORD_CHANNELS_BASE_URL = "https://discord.com/channels";

// gas stations
export const FALLBACK_GAS_STATION_URL =
    "https://gpoly.blockscan.com/gasapi.ashx?apikey=key&method=gasoracle";
export const PROD_GAS_STATION_URLS: string[] = [
    "https://gasstation.polygon.technology/v2",
    FALLBACK_GAS_STATION_URL,
];

// our test env is pointing to mainnet. The testnet URL is commented here:
// "https://gasstation-testnet.polygon.technology/v2",
export const TEST_ENV_GAS_STATION_URLS: string[] = [
    "https://gasstation.polygon.technology/v2",
];

export const AIRDROP_TOKEN_BASE_URL_OPENSEA = "https://opensea.io/assets/matic";

// Link Wallet
export const COLOR_YELLOW_DARK = "#9e8332";

export const BOLGAR_FIGHTING_IMAGE_URL =
    "https://assets-global.website-files.com/62cdcc2c95f5c5fd2cb93096/63891de2c8a7b1000c96dc43_BolgarVersus_final.png";

export const MESSAGE_EMBED_ICON_URL =
    "https://wildcard-collectibles-dapp-git-feature-010e26-wildcard-alliance.vercel.app/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fwildcard-gold-logo.4302c9d8.png&w=3840&q=75";
export const LINK_WALLET_GREETER = `**Claim your Wildfile!**\n
Track your participation in the Wildcard universe and reap rewards by claiming your unique Wildcard Profile, the ***Wildfile***! This is completely free, we will even pay for the gas! All you need to do is link your Discord to your Wallet on our dapp.

To get started, click the ***Generate Link!*** button below and follow the instructions`;

// Wildevent schema
export const LINKED_SOCIAL_SCHEMA = ["string"];

// Max no. of participants to show in leaderboard
export const MAX_LEADERBOARD_SIZE = 50;

// ---- DISCORD EVENTS ----
export const DISCORD_EVENT_BATCH_SIZE = 100; // approx batch size for ~1_000_000 gas
export const ETH_MAINNET_ALCHEMY_ID = "eth-mainnet";

// Space and Time API Base URL
export const SXT_API_BASE_URL = "https://api.spaceandtime.app/v1/";

//leaderboard consts
export const alphaSeriesZeroLeaderboardId = "alpha-series-zero";
export const dreamHackLeaderboardId = "dream-hack";
export const nftLeaderboardId = "nft";
export const eventLeaderboardId = "event";
export const MAX_LEADERBOARD_RANK = 9999999;
// ---- FAN VIS. ----
export const REDIS_RPUSH_EXPIRY_SECONDS = 3600; // 1 hour

export const QUEUE_KEY_EVENT_CHANNEL_AIRDROP_RECIPIENTS =
    "eventChannelAirdropRecipients";

export const TEN_SECS_IN_MS = 10 * 1000;
export const ONE_SEC_IN_MS = 1 * 1000;

// --- KUDOS ----
export const KUDOS_OPTIONS = [
    {
        name: "Ticket to Wild",
        value: "kudosTicketToWild",
        tokenId: "15",
    },
    {
        name: "Ultimate Fan",
        value: "kudosUltimateFan",
        tokenId: "16",
    },
    {
        name: "Bring the Hype",
        value: "kudosBringTheHype",
        tokenId: "17",
    },
    {
        name: "Let's Get Wild",
        value: "kudosLetsGetWild",
        tokenId: "18",
    },
    {
        name: "Fan on Fire",
        value: "kudosFanOnFire",
        tokenId: "19",
    },
    {
        name: "Fly It High",
        value: "kudosFlyItHigh",
        tokenId: "20",
    },
    {
        name: "You Earned It",
        value: "kudosYouEarnedIt",
        tokenId: "21",
    },
    {
        name: "Wild Win Kudos",
        value: "kudosWildWin",
        tokenId: "22",
    },
];

export const DREAMHACK_DISCORD_EVENT_NAME =
    "Playtest: DREAMHACK Live Booth Coverage";

// Badges
export const SWAGSET = "swagSet";
export const WILDPASS = "wildpass";
export const COMMUNITY = "community";
export const OG = "og";

// Wildpass color
export const NUM_UNIQUE_WILDPASS = 8;
export const AZURE = "azure"; // 0
export const GOLD = "gold"; // 1
export const SCARLET = "scarlet"; // 2
export const VIOLET = "violet"; // 3
export const AMBER = "amber"; // 4
export const EMERALD = "emerald"; // 5
export const ALABASTER = "alabaster"; // 6
export const BLUSH = "blush"; // 7

// Swagset
export const MELEE_ON_THE_METEOR_TITLE = "EX1: Melee on the Meteor";
export const COMMUNITY_GATHERINGS_TITLE = "Wildcard Community Gatherings";
export const ROAD_TO_EX1_TITLE = "The Road to EX1";
export const PRE_ALPHA_PARTNERS_ACTIVATIONS_TITLE =
    "Pre-Alpha Partner Activations";
export const ULTIMATE_FAN_TITLE = "Ultimate Fan";
export const MOODS_OF_BOLGAR_TITLE = "Moods of Bolgar";
export const SPAWN_OF_SPORD_TITLE = "Spawn of Spord";

// Swagset Token Ids
export const ROAD_TO_EX1_TOKEN_IDS: string[] = [
    "2", // Tailgating Partying
    "1", // Now Boarding: EX1
    "3", // Melee on the Meteor: Ex1
];

export const MELEE_ON_THE_METEOR_TOKEN_IDS: string[] = [
    "8", // Janz
    "6", // Gorrit
    "9", // Aloe
    "7", // Fendor
    "5", // Locke
];

export const COMMUNITY_GATHERINGS_TOKEN_IDS: string[] = [
    "10", // AMA1
    "11", // TH1
    "12", // TH6
];

export const PRE_ALPHA_PARTNERS_ACTIVATIONS_TOKEN_IDS: string[] = [
    "13", // Green Bored Box
    "27", // Greyish Swag Pins
    "14", // 3XP 2023
];

export const ULTIMATE_FAN_TOKEN_IDS: string[] = [
    "16", // Ultimate Fan
    "17", // Bring The Hype
    "18", // Let's Get Wild
    "19", // Fan on Fire
    "15", // Ticket to Wild
    "22", // Wild Win
    "21", // You Earned It
    "20", // Fly it High
];

export const MOODS_OF_BOLGAR_TOKEN_IDS: string[] = [
    "25", // Loved It
    "24", // Rocked It
    "26", // Nailed It
];

export const SPAWN_OF_SPORD_TOKEN_IDS: string[] = [
    "28", // Spord
    "29", // More Spord
    "30", // Even More Spord
    "31", // Uh, Oh!
    "32", // Ok, Stop!
];

export const SWAG_AIRDROP_BATCH_SIZE = 25;
export const MINT_WILDFILE_BATCH_SIZE = 25;
export const DISCORD_EVENT_ATTENDANCE_BATCH_SIZE = 25;
export const AIRDROP_EVENT_BATCH_SIZE = 25;
export const GET_WILDFILE_ID_BATCH_SIZE = 100;
export const TRANSACTION_QUEUE_RETRY_LIMIT = 5;
export const ARCHIVE_LEADERBOARD_BATCH_SIZE = 300;

// Blockchain Constants
export const VIEW_FUNCTION_MAX_RETRIES = 3;
export const VIEW_FUNCTION_RETRY_INTERVAL = 1000;
