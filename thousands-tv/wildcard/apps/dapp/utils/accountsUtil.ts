import jwt from "jsonwebtoken";
import { getAPIEndpointRootUrl, getNextAuthSecret } from "./environmentUtilWCA";
import { jwtVerify } from "jose";
import {
    checkIsMFAStepCompleted,
    COOKIES_REDIRECT_URL,
} from "./accountAPIUtil";
import {
    AccountProvider,
    AccountProviderType,
    IUser,
    WalletAccountProvider,
} from "@repo/interfaces";
import { WildcardSessionTokenParams } from "@/pages/api/auth/wildcard/token";
import axios from "axios";
import Cookies from "js-cookie";
import { WILDFILE_ROUTES } from "@/constants/routes";
import { parse } from "cookie"; // Import cookie parser

export interface DecodedToken {
    id: string;
    userId: string;
    roles: string[];
    iat: number;
    exp: number;
}

export interface TokenVerificationResult {
    valid: boolean;
    decodedToken?: DecodedToken;
    error?: string;
}

export interface RedirectServerSideProps {
    redirect: {
        destination: string;
        permanent: boolean;
    };
}

/**
 * Verifies a JWT token and returns the decoded token if valid.
 *
 * @param {string} wildcardAccessTokenCookie The JWT token to verify.
 * @returns {TokenVerificationResult} An object indicating whether the token is valid,
 *                                    the decoded token if valid, or an error message if not.
 */
export function verifyToken(
    wildcardAccessTokenCookie: string
): TokenVerificationResult {
    try {
        const decodedToken = jwt.verify(
            wildcardAccessTokenCookie,
            getNextAuthSecret()
        ) as DecodedToken;
        return { valid: true, decodedToken };
    } catch (error: any) {
        console.error("JWT Verification Error:", error.message);
        return { valid: false, error: error.message };
    }
}

/**
 * Decodes a JWT token payload without verifying its signature. (via base64 decoding)
 *
 * @param {string} token - The JWT token to decode.
 * @returns {DecodedToken | null} - The decoded token payload if successful, or `null` if decoding fails.
 *
 */
export const decodeToken = (token: string): DecodedToken | null => {
    try {
        const base64Payload = token.split(".")[1];
        const payload = Buffer.from(base64Payload, "base64").toString("utf-8");
        return JSON.parse(payload) as DecodedToken;
    } catch (error) {
        console.error("Failed to decode token:", error);
        return null;
    }
};

/**
 * Verifies a JWT token using the `jose` library, suitable for edge runtime in Next.js.
 * @dev - This function is used in the edge runtime in Next.js, where the `jose` library is supported.
 *
 * @param {string} wildcardAccessToken The JWT token to verify.
 * @returns {Promise<TokenVerificationResult>} An object indicating whether the token is valid,
 *                                    the decoded token if valid, or an error message if not.
 */
export async function verifyTokenOnMiddleware(
    wildcardAccessToken: string
): Promise<any> {
    try {
        const { payload } = await jwtVerify(
            wildcardAccessToken,
            new TextEncoder().encode(getNextAuthSecret()),
            {
                algorithms: ["HS256"], // Specify the algorithm you expect the token to be signed with
            }
        );
        console.log("Decoded token:", payload);
        return { valid: true, decodedToken: payload };
    } catch (error: any) {
        console.error("JWT Verification Error:", error.message);
        return { valid: false, error: error.message };
    }
}

/**
 * Maps a string to the corresponding AccountProviderType enum value.
 *
 * @param {string} provider - The provider as a string.
 * @returns {AccountProviderType | undefined} The corresponding AccountProviderType enum value, or undefined if the provider is not recognized.
 */
export const getAccountProviderTypeByString = (
    provider: string
): AccountProviderType | undefined => {
    switch (provider.toLowerCase()) {
        case "twitch":
            return AccountProviderType.TWITCH;
        case "kick":
            return AccountProviderType.KICK;
        case "discord":
            return AccountProviderType.DISCORD;
        case "google":
            return AccountProviderType.GOOGLE;
        case "wallet":
            return AccountProviderType.WALLET;
        case "beamable":
            return AccountProviderType.BEAMABLE;
        default:
            console.error(`Unrecognized provider: ${provider}`);
            return undefined;
    }
};

/**
 * Retrieves the provider object from the user data based on the provider type.
 * @audit - provide accurate typing
 * @param {IUser | null} userDB - The user object from the database.
 * @param {string} providerType - The type of the provider.
 * @returns {AccountProvider | WalletAccountProvider | null} The corresponding provider object, or null if not found or userDB is null.
 */
export const getUserDBProviderByType = (
    userDB: IUser | null,
    providerType: string | null
): AccountProvider | WalletAccountProvider | any | null => {
    if (!userDB || !providerType) {
        return null;
    }

    switch (providerType) {
        case "twitter":
            return userDB.twitterProvider || null;
        case "twitch":
            return userDB.twitchProvider || null;
        case "kick":
            return userDB.kickProvider || null;
        case "discord":
            return userDB.discordProvider || null;
        case "google":
            return userDB?.googleProvider || null;
        case "wallet":
            return userDB.walletProvider || null;
        case "beamable":
            return userDB.beamableProvider || null;
        default:
            console.error(`Unrecognized provider type: ${providerType}`);
            return null;
    }
};

/**
 * Converts an account provider type to the corresponding field name in the user model.
 * This is assuming your user model has dedicated fields for each provider type.
 */
export function getProviderFieldName(providerType: string): string {
    switch (providerType) {
        case AccountProviderType.TWITCH:
            return "twitchProvider.id";
        case AccountProviderType.KICK:
            return "kickProvider.id";
        case AccountProviderType.DISCORD:
            return "discordProvider.id";
        case AccountProviderType.GOOGLE:
            return "googleProvider.id";
        case AccountProviderType.WALLET:
            return "walletProvider.address";
        case AccountProviderType.BEAMABLE:
            return "beamableProvider.id";
        // Extend the cases as per your application's supported providers
        default:
            throw new Error(`Unsupported provider type: ${providerType}`);
    }
}

/**
 * Retrieves the account associated with a user by account provider type.
 *
 * @param {IUser} userDB - The user object from the database.
 * @param {AccountProviderType} providerType - The account provider type to search for.
 * @returns {AccountProvider | null} The account if found, otherwise null.
 */
export function getAccountByProviderType(
    userDB: IUser | null,
    providerType: AccountProviderType
): AccountProvider | WalletAccountProvider | null {
    if (!userDB) {
        return null;
    }

    switch (providerType) {
        case AccountProviderType.TWITCH:
            return userDB.twitchProvider || null;
        case AccountProviderType.KICK:
            return userDB.kickProvider || null;
        case AccountProviderType.DISCORD:
            return userDB.discordProvider || null;
        case AccountProviderType.GOOGLE:
            return userDB.googleProvider || null;
        case AccountProviderType.WALLET:
            return userDB.walletProvider || null;
        case AccountProviderType.BEAMABLE:
            return userDB.beamableProvider || null;
        default:
            console.error(`Unrecognized provider type: ${providerType}`);
            return null;
    }
}

/**
 * Retrieves the wallet address associated with a user.
 *
 * @param {IUser} userDB - The user object from the database.
 * @returns {string | null} The wallet address if found, otherwise null.
 */
export function getWalletAddressByUserDB(userDB: IUser | null): string | null {
    if (!userDB || !userDB.walletProvider) {
        return null;
    }
    return userDB.walletProvider.address || null;
}

/**
 * Retrieves the Beamable account associated with a user.
 *
 * @param {IUser} userDB - The user object from the database.
 * @returns {AccountProvider | null} The Beamable account if found, otherwise null.
 */
export function getBeamableAccountByUserDB(
    userDB: IUser | null
): AccountProvider | null {
    if (!userDB) {
        return null;
    }
    return userDB.beamableProvider || null;
}

/**
 * Retrieves the discord account associated with a user.
 *
 * @param {IUser} userDB - The user object from the database.
 * @returns {AccountProvider | null} The discord account if found, otherwise null.
 */
export function getDiscordAccountByUserDB(
    userDB: IUser | null
): AccountProvider | null {
    if (!userDB) {
        return null;
    }
    return userDB.discordProvider || null;
}

/**
 * Maps an error code to a human-readable error message.
 *
 * @param {any} error - The error code.
 * @returns {string} The corresponding error message.
 */
export function mapErrorToMessage(error: any): string {
    switch (error) {
        case "AccountDoesNotExist":
            return "No account found with that login. Please sign up or login with the correct sign-in option.";
        case "LinkingWalletFailed":
            return "Failed to link wallet. Please try again.";
        case "WalletAlreadyLinked":
            return "Wallet is already linked to your account.";
        case "SignUpFailed":
            return "Failed to sign up. Please try again.";
        case "ConnectAccountFailed":
            return "Failed to connect account. Please try again.";
        case "AccountAlreadyExists":
            return "An account with that email already exists. Please sign in or use a different email.";
        case "AccountAlreadyLinked":
            return "Account is already linked to another user. Please connect a different account.";
        case "ConnectAccountFailed":
            return "Failed to connect account. Please refresh the page and try again.";
        case "UserSuspended":
            return "Your account has been suspended. Please contact support for more information.";
        default:
            return "An unexpected error occurred.";
    }
}

/**
 * Checks if the user's only linked account provider is a wallet.
 *
 * @param {IUser | null} userDB - The user object from the database.
 * @returns {boolean} True if the only account provider is a wallet, otherwise false.
 */
export function isOnlyWalletProvider(userDB: IUser | null): boolean {
    if (!userDB) {
        return false;
    }

    // Convert all provider checks to boolean explicitly
    const hasWalletOnly =
        !!userDB.walletProvider &&
        !(
            !!userDB.discordProvider ||
            !!userDB.googleProvider ||
            !!userDB.beamableProvider ||
            !!userDB.twitchProvider ||
            !!userDB.kickProvider
        );

    return hasWalletOnly;
}

/**
/**
 * Checks if the MFA session is valid.
 *
 * @param {string | undefined} mfaSessionValid - The MFA session value to check.
 * @returns {boolean} - Returns true if the MFA session is valid, otherwise false.
 */
export function getIsMFASessionValid(
    mfaSessionValid: string | undefined
): boolean {
    return mfaSessionValid !== undefined && mfaSessionValid === "true";
}

/**
 * Checks the MFA status for a given session.
 * If the MFA is not enabled or the OTP session is valid, it returns null.
 * If the MFA step is not completed, it returns a redirect object to the MFA validation page.
 * If there's an error checking the MFA status, it returns a redirect object to the login page.
 *
 * @param {ExtendedSession} session - The session object.
 * @param {boolean} isOTPSessionValid - Indicates if the OTP session is valid.
 * @returns {Promise<{redirect: {destination: string, permanent: boolean}} | null>} - A promise that resolves to a redirect object or null.
 */
export async function checkMFAStatusAndRedirect(
    userDB: any | null,
    connectedUserDBEmail: string | null,
    isOTPSessionValid: boolean
): Promise<
    { redirect: { destination: string; permanent: boolean } } | null | undefined
> {
    if (!userDB?.authenticator?.authenticatorAppEnabled === true) {
        return null;
    }
    if (!isOTPSessionValid) {
        try {
            const { mfaStepCompleted, mfaStepCompletedWithinLast15Minutes } =
                await checkIsMFAStepCompleted(userDB);

            const isMfaStepNotCompletedStatus =
                !mfaStepCompleted || !mfaStepCompletedWithinLast15Minutes;

            if (isMfaStepNotCompletedStatus) {
                return {
                    redirect: {
                        destination: `/wildfile/mfa/validate-totp?email=${encodeURIComponent(
                            connectedUserDBEmail || ""
                        )}`,
                        permanent: false,
                    },
                };
            }
        } catch (error) {
            console.error("Error checking MFA step completed status", error);
            return {
                redirect: {
                    destination: "/login",
                    permanent: false,
                },
            };
        }
    }
}

/**
 * Verifies the token and returns the decoded token or a redirect object.
 *
 * @param {string} wildcardAccessTokenCookie - The token to verify.
 * @returns {Promise<{decodedToken: any, redirect?: {destination: string, permanent: boolean}}>} An object containing the decoded token or a redirect object.
 */
export async function verifyTokenOrRedirect(
    wildcardAccessTokenCookie: string
): Promise<{
    decodedToken?: DecodedToken | undefined;
    redirect?: { destination: string; permanent: boolean };
}> {
    const { valid, decodedToken, error } = verifyToken(
        wildcardAccessTokenCookie
    );

    if (!valid || !decodedToken) {
        const errMsg = `No token or valid token found. Redirecting to login page.`;
        console.log(errMsg);

        return {
            redirect: {
                destination: "/login", // Redirect to the login page
                permanent: false,
            },
        };
    }

    return { decodedToken };
}

// Utility function to get the logo (image) if available
export function getLogo(
    account: AccountProvider | WalletAccountProvider | null | undefined
): string | undefined {
    if (account && "image" in account) {
        return account.image ?? "";
    }
}

export enum ProviderType {
    WalletProvider = "walletProvider",
    BeamableProvider = "beamableProvider",
    GoogleProvider = "googleProvider",
    DiscordProvider = "discordProvider",
    TwitchProvider = "twitchProvider",
    TwitterProvider = "twitterProvider",
}

/**
 * Retrieves the provider type based on the connected provider ID from the user database object.
 * @param {UserDB} userDB - The user database object containing all provider information.
 * @param {string} connectedUserDBProviderId - The ID of the connected user's provider.
 * @returns {ProviderType | undefined} - Returns the provider type or undefined if not found.
 */
export function getConnectedProviderType(
    userDB: IUser,
    connectedUserDBProviderId: string
): ProviderType | undefined {
    if (userDB.googleProvider?.id === connectedUserDBProviderId) {
        return ProviderType.GoogleProvider;
    }
    if (userDB.discordProvider?.id === connectedUserDBProviderId) {
        return ProviderType.DiscordProvider;
    }
    if (userDB.twitchProvider?.id === connectedUserDBProviderId) {
        return ProviderType.TwitchProvider;
    }
    if (userDB.walletProvider?.address === connectedUserDBProviderId) {
        return ProviderType.WalletProvider;
    }
    if (userDB.beamableProvider?.id === connectedUserDBProviderId) {
        return ProviderType.BeamableProvider;
    }
    return undefined; // Return undefined if no provider matches the given ID
}

/**
 * Determines if the given ID is a wallet address using the decoded token based on the provider type.
 * @param id - The ID to check.
 * @returns - True if the ID is a wallet address, otherwise false.
 */
export function isWalletAddressProvider(id: string): boolean {
    return id.startsWith("0x");
}

/**
 * Checks if at least one provider is connectted
 * Connected Provider must consisot of a social provider ID (e.g. Google, Discord, Twitch)
 * @param {UserDB} userDB - The user database object containing all provider information.
 * @returns {boolean} - Returns true if at least one provider exists and has a valid ID, otherwise false.
 */
export function checkIfAtLeastOneSocialProviderIdExists(
    userDB: IUser | null
): boolean {
    // List all providers we want to check
    const providers = [
        userDB?.googleProvider,
        userDB?.discordProvider,
        userDB?.twitchProvider,
    ];

    // Check if any provider is non-null and has a non-empty id
    return providers.some(
        (provider) => provider && provider?.id && provider?.id.trim() !== ""
    );
}

/**
 * Creates or refreshes a wildcard access token.
 * @param wildcardSessionTokenParams - The wildcard session token parameters.
 * @param accessToken - access token of the provider
 * @returns - The wildcard access token.
 */
export async function createOrRefreshWildcardAccessToken(
    wildcardSessionTokenParams: WildcardSessionTokenParams,
    accessToken: string
): Promise<string> {
    try {
        const response = await axios.post(
            `${getAPIEndpointRootUrl()}/api/auth/wildcard/token`,
            {
                wildcardSessionTokenParams,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        console.log(`** Wildcard Access Token Response:`, response.data);

        if (!response.data.wildcardAccessToken) {
            throw new Error("Failed to obtain wildcard access token");
        }

        return response.data.wildcardAccessToken;
    } catch (error) {
        console.error(
            "Error creating/refreshing wildcard access token:",
            error
        );
        throw error;
    }
}

/**
 * Get the account provider object from the User Doc/ Wildfile by the account ID.
 * @param user - The user object to search in.
 * @param accountId - The account ID to search for.
 * @returns - The account provider object or null if not found.
 */
export function getAccountProviderByAccountId(
    user: IUser,
    accountId: string
): AccountProvider | null {
    for (const providerKey of Object.values(ProviderType)) {
        const provider = user[providerKey as keyof IUser] as
            | AccountProvider
            | undefined;
        if (provider && provider.id === accountId) {
            return provider;
        }
    }

    return null;
}

/**
 * Retrieves the redirect URL from the current URL's query parameters.
 *
 * @returns {string | null} The redirect URL if present in the query parameters, otherwise null.
 */
export function getRedirectUrlFromQuery(): string | null {
    if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get("redirectUrl");
    }
    return null;
}

/**
 * Sets the redirect URL in a cookie if it's present in the URL query.
 *
 * @param {string} cookieName - The name of the cookie to set.
 */
export function setRedirectUrlCookie(cookieName: string): void {
    const redirectUrl = getRedirectUrlFromQuery();
    if (redirectUrl) {
        Cookies.set(cookieName, redirectUrl);
    }
}

export function removeRedirectUrlCookie(cookieName: string): void {
    Cookies.remove(cookieName);
}

export function getAndRemoveRedirectUrl(cookieName: string): string | null {
    const redirectUrl = Cookies.get(cookieName);
    if (redirectUrl) {
        removeRedirectUrlCookie(cookieName);
    }
    return redirectUrl || null;
}

/**
 * Validates query parameters for redirect logic and constructs the appropriate callback URL.
 * Redirect URL is taken from the query string, on sign-in success it will redirect to the URL.
 * Handles access code validation (i.e elevate roles via verify page) and redirect URL construction.
 *
 * @param {string | null} accessCode - The valid access code if provided.
 * @param {boolean} clearCookie - Flag to determine if the redirect cookie should be cleared.
 * @returns {string} - The constructed callback URL.
 */
export function validateQueryParamsAndRedirect(
    accessCode: string | null | undefined,
    clearCookie: boolean = true
): string {
    // Get the redirect URL from the query string, fallback to cookie if needed
    const queryRedirectUrl = getRedirectUrlFromQuery();
    const redirectUrl = clearCookie
        ? getAndRemoveRedirectUrl(COOKIES_REDIRECT_URL)
        : queryRedirectUrl || Cookies.get(COOKIES_REDIRECT_URL);

    let callbackUrl = WILDFILE_ROUTES.VERIFY.url;

    if (accessCode) {
        // Construct the verify page URL if there's a valid access code
        callbackUrl = `${WILDFILE_ROUTES.VERIFY.url
            }?accessCode=${encodeURIComponent(accessCode)}`;

        if (redirectUrl) {
            // Append the redirect URL to the callback
            callbackUrl += `&redirectUrl=${encodeURIComponent(redirectUrl)}`;
        }
    } else if (redirectUrl) {
        // Use the redirect URL directly if no access code is present
        callbackUrl = redirectUrl;
    }
    if (!clearCookie && queryRedirectUrl) {
        Cookies.set(COOKIES_REDIRECT_URL, queryRedirectUrl);
    }

    return callbackUrl;
}

/**
 * Gets the user dashboard URL with the appropriate server code.
 * Used specifically for Twitch login redirects.
 *
 * @param {string} serverCode - The server code to use (defaults to "thousands" if not provided)
 * @returns {string} - The user dashboard URL in format /{serverCode}/userdashboard
 */
export function getTwitchLoginRedirectUrl(serverCode?: string): string {
    const finalServerCode = serverCode || "thousands"; // Use default if not provided
    return `/${finalServerCode}/userdashboard`;
}

/**
 * Gets the user dashboard URL with the appropriate server code.
 * Used specifically for Twitch login redirects.
 *
 * @param {string} serverCode - The server code to use (defaults to "thousands" if not provided)
 * @returns {string} - The user dashboard URL in format /{serverCode}/streamerdashboard
 */
export function getTwitchLoginRedirectToStreamerDashboardUrl(
    serverCode?: string
): string {
    const finalServerCode = serverCode || "thousands"; // Use default if not provided
    return `/${finalServerCode}/streamerdashboard`;
}

/**
 * Generates the redirect URL for Discord login users after successful authentication.
 * Used specifically for Discord login redirects.
 *
 * @param {string} serverCode - The server code to use (defaults to "thousands" if not provided)
 * @returns {string} - The user dashboard URL in format /{serverCode}/userdashboard
 */
export function getDiscordLoginRedirectUrl(serverCode?: string): string {
    const finalServerCode = serverCode || "thousands"; // Use default if not provided
    return `/${finalServerCode}/userdashboard`;
}

/**
 * Retrieves the specified cookie value from the document cookies.
 * @param cookieName - The name of the cookie to retrieve.
 * @returns The parsed cookie value, or null if the cookie doesn't exist.
 */
export const getCookieValue = (cookieName: string) => {
    const cookies = parse(document.cookie);
    return cookies[cookieName] ? JSON.parse(cookies[cookieName]) : null;
};

/**
 * Builds a wildfile URL by replacing the server code placeholder with the actual server code.
 * @param serverCode - The server code to be used in the URL.
 * @param path - The path to be appended to the base URL.
 * @returns The constructed URL with the server code.
 */
export const buildServerUrl = (serverCode: string, path: string): string => {
    // Remove the placeholder and construct the URL
    return path.replace(":serverCode", serverCode);
};
