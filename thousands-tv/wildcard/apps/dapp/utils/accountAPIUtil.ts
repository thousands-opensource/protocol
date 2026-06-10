import axios from "axios";
import cookie, { serialize } from "cookie";
import { GetServerSidePropsContext } from "next";
import {
    FindBeamableUser,
    UserDetailsMe,
} from "@/contexts/globalContextAccounts";
import { DecodedToken } from "./accountsUtil";
import { getAPIEndpointRootUrl } from "@/utils/environmentUtilWCA";
import { IUser } from "@repo/interfaces";
import {
    INotificationResponses,
    NotificationData,
    WildcardAccountsApiResponse,
} from "@/types";
import { getAdminAccessToken } from "@/backend/common";

export const COOKIES_ACCESS_TOKEN_WILDCARD = "wildcardAccessToken";
export const COOKIES_NEXT_AUTH_SESSION_TOKEN =
    "__Secure-next-auth.session-token";

// Cookie constants (name of cookies)
export const COOKIES_ACCESS_TOKEN_PROVIDER_BEAMABLE =
    "accessTokenProviderBeamable";
export const COOKIES_EMAIL = "email";
// OTP session
export const COOKIES_IS_OTP_SESSION_VALID = "isOtpSessionValid"; // boolean value
export const COOKIES_IS_OTP_SESSION_VALID_EXPIRY_SECONDS = 900; // 15 minutes

// Twitch login tracking
export const COOKIES_IS_TWITCH_LOGIN = "isTwitchLogin"; // boolean value
export const COOKIES_IS_TWITCH_STREAMER_LOGIN = "isTwitchStreamerLogin";

// Discord login tracking
export const COOKIES_IS_DISCORD_LOGIN = "isDiscordLogin"; // boolean value

// Linking OAuth to Wallet Address Account
export const COOKIES_LINKING_OAUTH_WALLET_ADDRESS = "LinkingOAuthWalletAddress"; // boolean value
export const COOKIES_IS_LINKING_OUTH_WALLET = "isLinkingOAuthWallet"; // boolean value

// Connect Additional Accounts to OAuth Account
export const COOKIES_IS_CONNECT_ACCOUNT = "isConnectAccount"; // boolean value
export const COOKIES_CONNECT_WALLET_EMAIL = "connectWalletEmail"; // string value
export const COOKIES_CONNECTED_PROVIDER_ID = "connectedProviderId"; // string value

// Flow to Sign Up or Sign In
export const COOKIES_IS_SIGN_UP = "isSignUp"; // boolean value
export const COOKIES_IS_LOGIN = "isLogin"; // boolean value

// Flow to Link old account (migration)
export const COOKIES_IS_LINK_OLD_ACCOUNT = "isLinkOldAccount"; // boolean value
//  WILDCARD TOKEN CONFIGS
export const ACCESS_TOKEN_WILDCARD_EXPIRY = "24h";

// Link Discord Account Cookie Reminder
export const COOKIES_LINK_DISCORD_ACCOUNT_REMINDER =
    "linkDiscordAccountReminder";
export const COOKIES_LINK_DISCORD_ACCOUNT_REMINDER_EXPIRY_HOURS = 48;

// Migration Flow
export const COOKIES_IS_USER_MIGRATION = "isUserMigration";

// Redirect URL
export const COOKIES_REDIRECT_URL = "redirectUrl";

// User Server Preferences
export const COOKIES_USER_SERVER_PREFERENCES = "userServerPreferences";
// Expiration time for user server preferences cookie
export const COOKIES_USER_SERVER_PREFERENCES_EXPIRATION_TIME_MS =
    15 * 60 * 1000;

/**
 * `validateToken` is an asynchronous function that validates a given token by making a POST request to a specific URL.
 *
 * @async
 * @function
 * @param {string} base_url - The base URL for the API.
 * @param {string} token - The token to be validated.
 * @returns {Promise<object|null>} The data from the response if the request is successful, or null if an error occurs.
 * @throws Will log the error message if the HTTP request fails.
 */
export async function validateToken(
    base_url: string,
    token: string
): Promise<DecodedToken | null> {
    const url = `${base_url}/api/auth/wildcard/validate-token`;

    try {
        const response = await axios.post(
            url,
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const decodedTokenResponse: WildcardAccountsApiResponse = response.data;

        if (!decodedTokenResponse.success) {
            console.error(
                `Error validating token: ${decodedTokenResponse.message}`
            );
            return null;
        }

        const decodedToken: DecodedToken = decodedTokenResponse.data;
        return decodedToken;
    } catch (error) {
        console.error(`Error validating token: ${error}`);
        return null;
    }
}

export async function fetchBeamableAccountAPI(
    accessToken: string
): Promise<UserDetailsMe | null> {
    const accountResponse = await axios.get(
        `${getAPIEndpointRootUrl()}/api/beamable/fetch-account`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );
    const account: UserDetailsMe = accountResponse.data;
    return account;
}

/**
 * Checks if the MFA step has been completed for a user.
 *
 * @param {IUser | null} userDB - The user's database record.
 * @returns {Promise<{mfaStepCompleted: boolean, mfaStepCompletedWithinLast15Minutes: boolean}>} An object containing the MFA status.
 */
export async function checkIsMFAStepCompleted(userDB: IUser | null): Promise<{
    mfaStepCompleted: boolean;
    mfaStepCompletedWithinLast15Minutes: boolean;
}> {
    if (!userDB || !userDB.authenticator) {
        return {
            mfaStepCompleted: false,
            mfaStepCompletedWithinLast15Minutes: false,
        };
    }

    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

    const mfaStepCompleted = userDB.authenticator.mfaStepCompleted;
    const mfaStepCompletedAt =
        userDB.authenticator.mfaStepCompletedAt || new Date(0); // default to epoch if not set

    const mfaStepCompletedWithinLast15Minutes =
        mfaStepCompleted && mfaStepCompletedAt > fifteenMinutesAgo;

    return { mfaStepCompleted, mfaStepCompletedWithinLast15Minutes };
}

// ======= Move to accountsUtil.ts =========

/**
 * This function retrieves the 'wildcardAccessToken' from the cookies present in the request headers.
 *
 * @param {GetServerSidePropsContext} context - The context object which contains the request and response objects.
 * @returns {string} The value of the 'wildcardAccessToken' cookie.
 */
export function getWildcardAccessTokenFromCookiesServerSide(
    context: GetServerSidePropsContext
): string {
    const parsedCookies = cookie.parse(context.req.headers.cookie || "");
    const wildcardAccessTokenCookie = parsedCookies.wildcardAccessToken;
    return wildcardAccessTokenCookie;
}

/**
 * Handles redirection based on a stored URL in cookies.
 * If a redirect URL is found, it clears the cookie and returns a redirect object.
 *
 * @param {GetServerSidePropsContext} context - The context object provided by Next.js for server-side rendering.string is the rel URL to redirect to.
 *
 * returns null.
 */
export function handleRedirectFromCookies(context: GetServerSidePropsContext) {
    const storedRedirectUrl = getRedirectUrlFromCookiesServerSide(context);
    const redirectUrlFromCookies = storedRedirectUrl || "";

    if (redirectUrlFromCookies) {
        context.res.setHeader(
            "Set-Cookie",
            serialize(COOKIES_REDIRECT_URL, "", {
                maxAge: -1,
                path: "/",
            })
        );

        return {
            redirect: {
                destination: redirectUrlFromCookies,
                permanent: false,
            },
        };
    }

    // If no redirect is needed, return null
    return null;
}

/**
 * This function retrieves the redirect URL from the cookies present in the request headers.
 *
 * @param {GetServerSidePropsContext} context - The context object which contains the request and response objects.
 * @returns {string | undefined} The value of the redirect URL cookie, or undefined if not present.
 */
export function getRedirectUrlFromCookiesServerSide(
    context: GetServerSidePropsContext
): string | undefined {
    const parsedCookies = cookie.parse(context.req.headers.cookie || "");
    const redirectUrl = parsedCookies[COOKIES_REDIRECT_URL];
    return redirectUrl;
}

/**
 * Fetches user data from Beamable API using an email.
 */
export async function fetchBeamableUserByEmail(
    email: string
): Promise<FindBeamableUser | null> {
    try {
        const accessToken = await getAdminAccessToken();

        const response = await axios.get(
            `${getAPIEndpointRootUrl()}/api/beamable/search-user-query`,
            {
                params: { email: email, page: 1, pagesize: 45 },

                headers: {
                    accept: "application/json",
                    "content-type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (
            response.data &&
            response.data.accounts &&
            response.data.accounts.length > 0
        ) {
            return response.data.accounts[0]; // Assuming the first account is the desired one
        }
        return null;
    } catch (error) {
        console.error(
            `Failed to fetch Beamable user by email: ${email}`,
            error
        );
        return null;
    }
}

/**
 * Creates a notification for a user.
 *
 * @dev - considered as an admin command
 * @param {NotificationData} data - The data for the notification to be created.
 * @returns {Promise<any>} The response data from the API.
 * @throws Will throw an error if the API call fails.
 */
export const createNotification = async (
    data: NotificationData
): Promise<any> => {
    try {
        const response = await axios.post(
            "/api/accounts/admin/user/notifications/create",
            data
        );

        return response.data;
    } catch (error) {
        console.error("Error creating notification", error);
        throw error;
    }
};

/**
 * Fetches notifications for a user with pagination.
 *
 * @param {string} userId - The ID of the user whose notifications are to be fetched.
 * @param {number} page - The page number for pagination.
 * @param {number} limit - The number of items per page.
 * @returns {Promise<INotificationResponses>} - The response data from the API.
 * @throws Will throw an error if the API call fails.
 */
export const getNotifications = async (
    userId: string,
    page: number = 1,
    limit: number = 10
): Promise<INotificationResponses> => {
    try {
        console.log("getNotifications userId", userId);
        const response = await axios.get(
            "/api/accounts/admin/user/notifications/query",
            {
                params: { userId, page, limit },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching notifications", error);
        throw error;
    }
};

/**
 * Updates the read status of a notification.
 *
 * @param {string} notificationId - The ID of the notification to update.
 * @param {boolean} isRead - The new read status of the notification.
 * @returns {Promise<any>} - The response data from the API.
 * @throws Will throw an error if the API call fails.
 */
export const updateNotificationReadStatus = async (
    notificationId: string,
    isRead: boolean
): Promise<any> => {
    try {
        const response = await axios.post(
            "/api/accounts/admin/user/notifications/update-read-status",
            {
                notificationId,
                isRead,
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error updating notification read status", error);
        throw error;
    }
};

/**
 * Marks a notification as deleted.
 *
 * @param {string} notificationId - The ID of the notification to delete.
 * @returns {Promise<any>} - The response data from the API.
 * @throws Will throw an error if the API call fails.
 */
export const deleteNotification = async (
    notificationId: string
): Promise<any> => {
    try {
        const response = await axios.post(
            "/api/accounts/admin/user/notifications/delete-notification-by-id",
            {
                notificationId,
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error deleting notification", error);
        throw error;
    }
};

/**
 * Fetches the count of unread notifications.
 *
 * @param {string} userId - The ID of the user whose unread notifications count is to be fetched.
 * @returns {Promise<number>} - The count of unread notifications.
 * @throws Will throw an error if the API call fails.
 */
export const getUnreadNotificationsCount = async (
    userId: string
): Promise<number> => {
    try {
        const response = await axios.get(
            "/api/accounts/admin/user/notifications/unread-count",
            {
                params: { userId },
            }
        );

        return response.data.count;
    } catch (error) {
        console.error("Error fetching unread notifications count", error);
        throw error;
    }
};
