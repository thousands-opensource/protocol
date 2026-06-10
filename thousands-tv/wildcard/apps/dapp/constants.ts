import { WILDFILE_ROUTES } from "./constants/routes";
import { THOUSANDS_SERIES_NAME } from "./types";
import { getAPIEndpointRootUrl } from "./utils/environmentUtil";

export const ENV = "env";
export const LOCAL = "local";
export const TEST = "test";
export const PROD = "prod";

export const DISPLAY_NAME_CHAR_LIMIT_MAX = 50;
export const DISPLAY_NAME_CHAR_LIMIT_MIN = 4;

// Constants for hyperlinks
export const LINK_TWITTER = "https://twitter.com/";
export const LINK_YOUTUBE = "https://www.youtube.com/";
export const LINK_GITHUB = "https://github.com/";
export const LINK_INSTAGRAM = "https://www.instagram.com/";
export const LEAD_CREATOR_HANDLE = "";
export const DICEBEAR_URL = "https://api.dicebear.com/9.x/bottts/svg?"; //"https://api.dicebear.com/6.x/micah/svg?mouth=pucker,smile,smirk,surprised,laughing,nervous";

export const BLOG = "";
export const HELP_CENTER_URL = "";

export const BANNER_MESSAGE = `Please ensure to regularly clear your cookies during testing. Changes
					are frequently made that may affect user experience.`;

export const DISCORD_COMMUNITY_URL = "https://discord.gg/";

// Thousands theme UI
export const THEME_COLOR_SECONDARY = "#D67355";
export const THEME_COLOR_THOUSANDS = "#FFD700";
export const THEME_COLOR_FONT_PRIMARY = "#FFFFFF";
export const THEME_COLOR_BG_PRIMARY = "#1E1E1E";
export const THEME_COLOR_FONT_REQUIRED = "#6a6d5d";
export const THEME_COLOR_BORDER_OUTLINE = "#555555";

// current thousand series name
export const CURRENT_SERIES_NAME = THOUSANDS_SERIES_NAME.ALPHA_SERIES;

// Constants for the thousands app (default landing page)
export const WEB_APP_HOME_URL = `${getAPIEndpointRootUrl()}/${WILDFILE_ROUTES.SERVER.HOMEPAGE.url
    }`;

// Default server primary logo URL
export const DEFAULT_THOUSANDS_PRIMARY_LOGO_URL = "thousands-token-2049.svg";
export const MAXIMUM_CREDIT_ALLOW_SPENT = 10000;
export const MAXIMUM_CREDIT_ALLOW_SPENT_FORECASTS = 100000;

/**
 * Blacklisted Wildpass token IDs
 * These token IDs are not allowed to be used for entry to an event
 */
export const BLACKLISTED_WILDPASS_TOKENIDS = [];

export const DAILY_INSIGHT_DECAY_RATE = 3.57; // 3.57% daily decay rate
export const FREE_POINT_EQUIVALENT = 1; // 1 point equivalent for free predictions
