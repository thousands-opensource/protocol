import {
    CODE,
    GRANT_TYPE,
    AUTHORIZATION_CODE,
    REDIRECT_URI,
    CODE_VERIFIER,
    CHALLENGE,
    APPLICATION_FORM_URLENCODED,
    CLIENT_ID,
    CLIENT_SECRET,
    TWITCH_OAUTH2_ENDPOINT,
    TWITCH_APPLICATION_SCOPE,
    TWITTER_OAUTH2_ENDPOINT,
    TWITTER_APPLICATION_SCOPE,
    RESPONSE_TYPE,
    CODE_CHALLENGE_METHOD,
    CODE_CHALLENGE,
} from "@/constants/constants";
import { NextRouter } from "next/router";
import { IUser, WildcardApiResponse } from "@repo/interfaces";
import Cookies from "cookies";
import JsCookies from "js-cookie";
import axios from "axios";
import {
    getAPIEndpointRootUrl,
    getOAuthRedirectUrl,
    getTwitchBaseUrl,
    getTwitchClientId,
    getTwitchClientSecret,
    getTwitterBaseUrl,
    getTwitterBasicAuth,
    getTwitterClientId,
} from "./environmentUtil";
import { signIn } from "next-auth/react";
import {
    COOKIES_IS_CONNECT_ACCOUNT,
} from "@/utils/accountAPIUtil";

export const SIG_COOKIE = "wca_signature";
export const ADDRESS_COOKIE = "wca_address";
export const MSG_COOKIE = "wca_msg";
export const OAUTH_STATE = "wca_oauth_state";

export const PRIMARY_SIG_COOKIE = "primary_wca_signature";
export const PRIMARY_ADDRESS_COOKIE = "primary_wca_address";
export const PRIMARY_MSG_COOKIE = "primary_wca_msg";

/**
 * Get twitter access token
 * @param authCode - random unique string allows an application to hit APIs on behalf of users
 * @returns twitter access token
 */
export async function getTwitterAccessToken(
    authCode: string
): Promise<WildcardApiResponse> {
    try {
        const params = new URLSearchParams();
        params.append(CODE, `${authCode}`);
        params.append(GRANT_TYPE, AUTHORIZATION_CODE);
        params.append(REDIRECT_URI, getOAuthRedirectUrl());
        params.append(CODE_VERIFIER, CHALLENGE);

        const { data } = await axios.post("/twitter/v2/oauth2/token", params, {
            headers: {
                Authorization: `Basic ${getTwitterBasicAuth()}`,
                "Content-Type": APPLICATION_FORM_URLENCODED,
            },
        });

        const accessToken = data.access_token;
        const refreshToken = data.refresh_token;
        const accessTokenExpiresAt = new Date(
            Date.now() + data.expires_in * 1000
        );
        return {
            success: true,
            data: {
                accessToken,
                refreshToken,
                accessTokenExpiresAt,
            },
        };
    } catch (e: any) {
        console.error("Failed to retrieve user's twitter access token", e);
        return {
            success: false,
            err: e.message,
        };
    }
}

/**
 * Get information about authorized twitter user with given access token
 * @param accessToken - token based authentication to allow an application to access an API
 * @returns information about authorized twitter user
 */
export async function getTwitterUser(
    accessToken: string
): Promise<WildcardApiResponse> {
    try {
        // Very odd expected response structure
        const {
            data: { data },
        } = await axios.get("/twitter/v2/users/me", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const id = data.id;
        const username = data.username;
        return { success: true, data: { id, username } };
    } catch (e: any) {
        console.error(
            "Failed to retrieve information about an authorized twitter user",
            e
        );
        return {
            success: false,
            err: e.message,
        };
    }
}

/**
 * Get twitch access token
 * @param authCode - random unique string allows an application to hit APIs on behalf of users
 * @returns twitch access token
 */
export async function getTwitchAccessToken(
    authCode: string
): Promise<WildcardApiResponse> {
    try {
        const params = new URLSearchParams();
        params.append(CLIENT_ID, getTwitchClientId());
        params.append(CLIENT_SECRET, getTwitchClientSecret());
        params.append(CODE, authCode);
        params.append(GRANT_TYPE, AUTHORIZATION_CODE);
        params.append(REDIRECT_URI, getOAuthRedirectUrl());
        const { data } = await axios.post("/twitch/oauth2/token", params, {
            headers: {
                "Content-Type": APPLICATION_FORM_URLENCODED,
            },
        });

        const accessToken = data.access_token;
        const refreshToken = data.refresh_token;
        const accessTokenExpiresAt = new Date(
            Date.now() + data.expires_in * 1000
        );
        return {
            success: true,
            data: {
                accessToken,
                refreshToken,
                accessTokenExpiresAt,
            },
        };
    } catch (e: any) {
        console.error("Failed to retrieve user's twitch access token", e);
        return {
            success: false,
            err: e.message,
        };
    }
}

/**
 * Get information about authorized twitch user with given access token
 * @param accessToken - token based authentication to allow an application to access an API
 * @returns information about authorized twitch user
 */
export async function getTwitchUser(
    accessToken: string
): Promise<WildcardApiResponse> {
    try {
        const {
            data: { data },
        } = await axios.get("/twitch/helix/users", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Client-Id": getTwitchClientId(),
            },
        });
        const twitchUser = data[0];
        const id = twitchUser.id;
        const username = twitchUser.login;
        return { success: true, data: { id, username } };
    } catch (e: any) {
        console.error(
            "Failed to retrieve information about an authorized twitch user",
            e
        );
        return {
            success: false,
            err: e.message,
        };
    }
}

/**
 * Sets the specific value of a cookie
 * @param name name of the cookie
 * @param value value to set the cookie to
 * @param cookies a Cookies object that is used to set the created cookies
 * @param maxAge a number representing the milliseconds from Date.now() for expiry
 * @param httpOnly a boolean indicating if the cookie should be HTTP only (default is true)
 */
export function setCookieValue(
    name: string,
    value: string,
    cookies: Cookies,
    maxAge?: number,
    httpOnly: boolean = true
) {
    cookies.set(name, value, {
        httpOnly: httpOnly,
        maxAge: maxAge,
        secure: false, // TODO: process.env.NODE_ENV === "production", // Set secure flag in production
        sameSite: "strict",
    });
}

/**
 * Handles formatting string with new lines so that it can properly be stored as a cookie
 * @param value - value to store
 * @returns string
 */
export function formatNewlinesForCookie(value: string): string {
    const formattedValue = value.replace(/\n/g, "\\n");
    return formattedValue;
}

/**
 * Handles reformatting cookie string to its original value with new lines
 * @param formattedValue - string to restore
 * @returns string
 */
export function restoreNewlinesFromCookie(formattedValue: string): string {
    const originalValue = formattedValue.replace(/\\n/g, "\n");
    return originalValue;
}

// Connect OAUTH user as additional connections (additional account onboarding)
export const handleSignInDeprecated = async (
    userDB: IUser,
    accountType: string
) => {
    JsCookies.set(COOKIES_IS_CONNECT_ACCOUNT, "true");

    // await signIn(accountType, { redirect: false });
    await signIn(accountType, {
        callbackUrl: `${getAPIEndpointRootUrl()}/wildfile/profile/connected-accounts/`,
        redirect: true,
    });
};
