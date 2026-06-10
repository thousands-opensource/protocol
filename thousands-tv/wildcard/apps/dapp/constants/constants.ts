import {
    AccountProviderType,
    AccountStatus,
    IUser,
    PfpMetadata,
} from "@repo/interfaces";
import { UseToastOptions } from "@chakra-ui/react";
import { ConsumableCommandAction, WildcardActionMetaData } from "@/types";

export const WILDCARD_APP_NAME = "Wildcard DApp";
export const PRIMARY_COLOR_THEME = "blue.500";
export const BACKGROUND_COLOR_WHITE = "whiteAlpha.900";
export const THEME_MODAL_BACKGROUND = `linear(to-r, ${"#30363B"}, ${"#181D20"})`;
export const THEME_COLOR_YELLOW = "#c9ac53";
export const THEME_COLOR_YELLOW_DARK = "#9e8332";
export const THEME_COLOR_GREY = "#484C4F";
export const THEME_COLOR_SLIGHT_GREY_BACKGROUND = "#E4E7E9";
export const THEME_COLOR_STEEL_GREY = "#33383B";
export const THEME_CHARCOAL_BLACK = "#1A1A1A";
export const THEME_COLOR_DIVIDER_GREY = "lightgrey";
export const THEME_COLOR_IRON_GREY = "#898E92";
export const THEME_COLOR_DARK_GOLDEN_YELLOW = "#d2a522";
export const THEME_COLOR_DARK_GOLD = "#b47700";
export const THEME_COLOR_BRONZE = "rgb(135,58,3)";
export const THEME_COLOR_DARK_BRONZE = "#5E3D27";
export const THEME_COLOR_METALLIC_GREY = "#a7a9aa";
export const THEME_COLOR_DARK_BAY_BLUE = "#2F3747";
export const THEME_COLOR_BAY_BLUE = "#33476b";
export const THEME_COLOR_DARK_NAVY_BLUE = "#436089";
export const THEME_COLOR_CYAN_BLUE = "#8ab4f8";
export const THEME_GRADIENT = `linear(to-r, ${THEME_COLOR_DARK_GOLDEN_YELLOW}, ${THEME_COLOR_DARK_GOLD}, ${THEME_COLOR_BRONZE})`;
export const THEME_GRADIENT_GOLD_TWO_TONE = `linear(to-r, ${THEME_COLOR_DARK_GOLDEN_YELLOW}, ${THEME_COLOR_DARK_GOLD})`;
export const UNSET = "unset";
export const THEME_COLOR_SILVER = "#f7f7f7";
export const THEME_COLOR_CLOUD_GREY = "#878787";
export const THEME_COLOR_FOG_GREY = "#f2f2f2";
export const THEME_COLOR_SKELETON_START = "#3a3e42";
export const THEME_COLOR_SKELETON_END = "#282c2f";
export const BACKGROUND_COLOR_CRYPTO_PUNKS = "#648595";
export const THEME_COLOR_AVATAR_COLLECTION = "#8C9EBA";
export const THEME_COLOR_ERROR_RED = "#FF9494";
export const THEME_COLOR_SUCCESS_GREEN = "#41D37C";
export const THEME_COLOR_SMOKE_GREY = "#c4c4c4";
export const THEME_COLOR_EERIE_BLACK = "#161A1E";
export const THEME_COLOR_LIGHT_BLACK_GREY = "#0000004d";
export const THEME_COLOR_PRIMARY_AZURE = "#007AFC";
export const THEME_COLOR_ONYX = "#33393d";
export const THEME_COLOR_DARK_ONYX = "#383838";
export const THEME_COLOR_PLATINUM = "#e9e9e9";
export const THEME_COLOR_BRIGHT_GRAY = "#eeeeee";
export const THEME_COLOR_GHOST_WHITE = "#f9f9f9";

//use this as default
export const ALPHA_SERIES_ZERO_BG_COLOR = "#829FBF";
export const DREAM_HACK_BG_COLOR = "#DA5C38";
export const LEADERBOARD_AVATAR_BG_COLOR1 = "#FF6A45";
export const LEADERBOARD_AVATAR_BG_COLOR2 = "#DC3148";
export const ALPHA_SERIES_ZERO_LEADERBOARD_ID = "alpha-series-zero";
export const DREAM_HACK_LEADERBOARD_ID = "dream-hack";
export const NFT_LEADERBOARD_ID = "nft";
export const EVENT_LEADERBOARD_ID = "event";
export const LEADERBOARD_PLACEHOLDER_COLOR = "#606060";

export const LOCAL = "local";
export const TEST = "test";
export const PROD = "prod";
export const CONDUIT = "conduit";

// gas stations
export const FALLBACK_GAS_STATION_URL =
    "https://gpoly.blockscan.com/gasapi.ashx?apikey=key&method=gasoracle";
export const PROD_GAS_STATION_URLS: string[] = [
    "https://gasstation-mainnet.matic.network/v2",
    FALLBACK_GAS_STATION_URL,
];
export const MUMBAI_GAS_STATION_URLS: string[] = [
    "https://gasstation-mumbai.matic.today/v2",
];

export const MAX_ADDITIONAL_WALLETS = 5;
export const MAX_FAVORITE_PFPS = 12;
// Link Wallet Flow
export const WALLET_LINKED = "Completed";

export const PRIMARY_FONT_SIZE = "18px";
export const ROOT_WILDFILE_URL = "/";

export const TWITTER = "Twitter";
export const TWITCH = "Twitch";
export const ACCESS_DENIED = "access_denied";
export const CODE = "code";
export const GRANT_TYPE = "grant_type";
export const REFRESH_TOKEN = "refresh_token";
export const AUTHORIZATION_CODE = "authorization_code";
export const REDIRECT_URI = "redirect_uri";
export const CODE_VERIFIER = "code_verifier";
export const CHALLENGE = "challenge";
export const APPLICATION_FORM_URLENCODED = "application/x-www-form-urlencoded";

export const CLIENT_ID = "client_id";
export const CLIENT_SECRET = "client_secret";

// Link Twitter constants
export const TWITTER_OAUTH2_ENDPOINT = "i/oauth2/authorize";
export const TWITTER_APPLICATION_SCOPE =
    "tweet.read%20users.read%20follows.read%20space.read%20like.read%20list.read%20offline.access";
export const RESPONSE_TYPE = "code";
export const STATE = "state";
// export const TWITTER_REDIRECT_URI =
//     "http%3A%2F%2Fwww.localhost:3000/wildfile/claim";
export const CODE_CHALLENGE_METHOD = "plain";
export const CODE_CHALLENGE = "challenge";

// Link Twitch constants
export const TWITCH_OAUTH2_ENDPOINT = "oauth2/authorize";
// export const TWITCH_REDIRECT_URI = "http://localhost:3000/wildfile/claim";
export const TWITCH_APPLICATION_SCOPE =
    "user%3Aread%3Aemail%20user%3Aread%3Afollows%20moderation%3Aread%20moderator%3Aread%3Afollowers%20moderator%3Aread%3Achatters%20analytics%3Aread%3Aextensions%20analytics%3Aread%3Agames%20bits%3Aread%20channel%3Aread%3Acharity%20channel%3Aread%3Ahype_train%20channel%3Aread%3Apolls%20channel%3Aread%3Asubscriptions%20channel%3Aread%3Avips%20moderator%3Aread%3Ashoutouts%20user%3Aread%3Abroadcast%20user%3Aread%3Asubscriptions";

export const ONE_WEEK_MS = 1000 * 60 * 60 * 24 * 7;

export enum WildpassColors {
    AZURE = "#3ECCB6",
    GOLD = "#DBC149",
    SCARLET = "#EB2432",
    VIOLET = "#845AFE",
    ALABASTER = "#CDECD2",
    AMBER = "#B85C29",
    BLUSH = "#C94CDA",
    EMERALD = "#7CCA45",
}

//  Twitter Web Intent URL constants
export const TWITTER_SHARE_WEB_INTENT_BASE_URL =
    "https://twitter.com/intent/tweet";

export const MAGIC_EDEN_WILDPASS_LINK =
    "https://magiceden.us/collections/ethereum/0xd8cb3f39875def5853b155c0adf2530644397428";
export const MAGIC_EDEN_WILDCARD_SWAG_LINK =
    "https://magiceden.io/collections/polygon/0x305a9d605455844ad3779204fddc0b41d6dc1788";

export const NUM_ACTIVITIES_DISPLAYED = 3;

export const IPFS = "ipfs";
export const IPFS_BASE_URL = "https://ipfs.io";

export const BASE64_DATA_IMAGE_FORMAT = "data:image/svg+xml;base64,";
export const UTF8_DATA_IMAGE_FORMAT = "data:image/svg+xml;utf8,";
export const BASE64 = "base64";

export const TOO_MANY_FAVORITES_ERR = `You have reached the maximum number of favorites: ${MAX_FAVORITE_PFPS}. Please remove one to add another.`;

export const WILDCARD_SWAG_CONTRACT_ADDRESS =
    "0x305a9d605455844ad3779204fddc0b41d6dc1788";

export const emptyPfp: PfpMetadata = {
    tokenId: "0",
    name: "default",
    contractAddress: "0x0000000000000000000000000000000000000000",
    imageUrl: "",
    chainId: 0,
};

export const emptyUser: IUser = {
    preferredProvider: AccountProviderType.WALLET, // Assuming 'preferredProvider' is required
    walletProvider: undefined, // If wallet is a primary provider, it could be null initially
    discordProvider: undefined, // Set other provider objects to null or appropriate empty initialization
    googleProvider: undefined,
    beamableProvider: undefined,
    twitchProvider: undefined,
    twitterProvider: undefined,
    roles: [], // Starts with no roles
    status: AccountStatus.ACTIVE, // Assuming the user is active by default
    preferences: {
        displayName: "",
        avatarThemeColor: "",
        showLinkedSocials: false,
        sendNotifications: false,
    },
};

export const FETCH_PFPS_ENDPOINT = "/api/fetchPfps";

export const toastDefaultOptions: UseToastOptions = {
    position: "top",
    variant: "solid",
    isClosable: true,
    duration: 5000,
};

export const SHOWCASES = ["Pre-Alpha"];

export const RECAPTCHA_V3_THRESHOLD_FOR_V2_SCORE = 0.8;
export const MIN_RECAPTCHA_SCORE = 0.2;
export const FEATURE_RELEASE = 1;
export const NEW_FEATURE_TEXT = "Showcase";

export const WILDFILE_ASSETS_COLLECTION_DIRECTORY =
    "/images/WildfileAssets/Collections";

export const WILDFILE_ASSETS_BADGE_DIRECTORY = "/images/WildfileAssets/Badges";

export const STRIPE_VERTICAL_BACKGROUND_IMAGE =
    "/images/WildfileAssets/Collections/pre-alpha/Stripe_Vertical.webp";

export const STRIPE_HORIZONTAL_BACKGROUND_IMAGE =
    "/images/WildfileAssets/Collections/pre-alpha/Stripe_Horizontal.webp";

export const ULTIMATE_FAN_STRIPE_HORIZONTAL_BACKGROUND_IMAGE =
    "/images/WildfileAssets/Collections/pre-alpha/Ultimate_Fan_Stripe_Horizontal.webp";

export const MOODS_OF_BOLGAR_HORIZONTAL_BACKGROUND_IMAGE =
    "/images/WildfileAssets/Collections/pre-alpha/Moods_Of_Bolgar_Horizontal.webp";

export const MOODS_OF_BOLGAR_VERTICAL_BACKGROUND_IMAGE =
    "/images/WildfileAssets/Collections/pre-alpha/Moods_Of_Bolgar_Vertical.webp";

export const SPAWN_OF_SPORD_HORIZONTAL_BACKGROUND_IMAGE =
    "/images/WildfileAssets/Collections/pre-alpha/Spawn_Of_Spord_Horizontal.webp";

export const SPAWN_OF_SPORD_VERTICAL_BACKGROUND_IMAGE =
    "/images/WildfileAssets/Collections/pre-alpha/Spawn_Of_Spord_Vertical.webp";

export const ALPHA_SERIES_LEARN_MORE_LINK =
    "https://www.notion.so/wildcard-alliance/9fbaa5465496469199c35d80dcad9999?v=041e03796e8548eb85380b246064b076&pvs=4";

export const MAX_TOTAL_WILDPASSES = 8; // wildpass colors consists of immutable 8 unique colors on-chain

export const TWITCH_BASE_URL = "https://twitch.tv";
export const TWITTER_BASE_URL = "https://twitter.com";
export const WARPCAST_BASE_URL = "https://warpcast.com";

export const DEFAULT_WILDPASS_HOLDER_COLOR_BADGE = "emerald";
export const WILDPASS_HOLDER = "wildpass-holder";

// Farcaster
export const MINT_IMAGE_PATH = "images/MintFrame/mint.webp";
export const SPORD_MINT_IMAGE_PATH = "images/SpordMintFrame/Spord";
export const VALIDATE_SPORD_MINT_IMAGE_PATH =
    "images/ValidateSpordMintFrame/ValidateSpordMint.png";
export const SUCCESSFUL_VALIDATION_SPORD_MINT_IMAGE_PATH =
    "images/ValidateSpordMintFrame/SuccessfulValidateSpordMint.png";
export const ALREADY_VALIDATED_SPORD_MINT_IMAGE_PATH =
    "images/ValidateSpordMintFrame/AlreadyValidatedSpordMint.png";
export const UNSUCCESSFUL_VALIDATION_SPORD_MINT_IMAGE_PATH =
    "images/ValidateSpordMintFrame/UnsuccessfulValidateSpordMint.png";

export const SUCCESSFUL_MINT_IMAGE_PATH =
    "images/MintFrame/successfulMint.webp";
export const SUCCESSFUL_SPORD_MINT_IMAGE_PATH =
    "images/SpordMintFrame/successfulSpordMint.png";
export const ALREADY_MINTED_SPORD_IMAGE_PATH =
    "images/SpordMintFrame/alreadyMintedSpord.png";
export const SOLD_OUT_IMAGE_PATH = "images/MintFrame/soldOut.webp";
export const ERROR_IMAGE_PATH = "images/MintFrame/techDifficulties.webp";
export const FRAME_TITLE = "Wildcard Mint Frame"; // Does not display on frame
export const VIEW_MINT_PATH =
    "https://magiceden.io/item-details/polygon/0x305a9d605455844ad3779204fddc0b41d6dc1788/";

export const DOMAIN_FOR_FARCASTER = "wildfile.wildcardgame.com";

export const DEFAULT_SIGNUP_STEPS = {
    linkedWallet: false,
    linkedSocial: false,
    mintedWildfile: false,
};

export const MINIMUM_NOTIFICATIONS_SHOWN = 3;

// Presence API - User Activity Stream Constants
export const MINIMUM_RECORD_STREAM_ACTIVITY_INTERVAL_MS = 20000; // minimum interval between recording user activity in a stream
export const MINIMUM_FETCH_LATEST_ACTIVE_USERS_INTERVAL_MS = 30000; // minimum interval between fetching latest active users in a stream
export const MINIMUM_USER_INACTIVITY_THRESHOLD_MS = 60000; // minimum time threshold for user inactivity in a stream

export const EVENT_COPIED_MSG = "Event URL copied to clipboard";
export const CAMERA_OPERATOR_COPIED_MSG =
    "Camera Operator Streaming Token copied to clipboard";

export const AUTO_POLLING_INTERVAL_MS = 30 * 1000;

export const WILDCARD_ACTIONS: WildcardActionMetaData[] = [
    {
        title: "Fireworks",
        command: ConsumableCommandAction.FIREWORKS,
        credit: 200,
        icon: "🎆",
        description: "Set off fireworks.  Costs 200 credits.",
        joinable: false,
    },
    {
        title: "Cheer",
        command: ConsumableCommandAction.CHEER,
        credit: 1000,
        icon: "📣",
        description:
            "Start a cheer that lasts for 10 seconds.  Costs 1000 credits.",
        joinable: true,
    },
    {
        title: "Confetti",
        command: ConsumableCommandAction.CONFETTI,
        credit: 50,
        icon: "🎉",
        description:
            "Double credits for a random number of ticks! Costs 50 credits.",
        joinable: false,
    },
];

export const FOLLOW_TWITTER_DELAY_MS = 5 * 1000;

// LOGIN/SIGNUP CONSTANTS
export const MIN_PASSWORD_LENGTH = 9;
export const VERIFICAITON_CODE_LENGTH = 6;

export const GOLDEN_RATIO = 1.618;
export const INITIAL_RALLY_POT = 10000;

export const MAX_SKYBOX_SLOT = 5;
export const TEMP_MAX_MEMBERSHIP = 20;
export const TIER_MAX_MEMBERSHIP_MAP: { [key: number]: number } = {
    1: 4,
    2: 10,
    3: 20,
};
