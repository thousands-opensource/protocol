import { IUser, UserRole, UserSession } from "@repo/interfaces";
import { getServerSession } from "next-auth";
import { GetServerSidePropsContext } from "next/types";
import { getWildcardAccessTokenFromCookiesServerSide } from "../accountAPIUtil";
import { getAccountProviderByAccountId, verifyToken } from "../accountsUtil";
import { getUserDBSessionObj } from "../sessionUtil";
import {
    ExtendedSession,
    getNextAuthOptions,
} from "@/pages/api/auth/[...nextauth]";
import {
    clearAllCookies,
    getUserByProviderId,
    verifyAndElevateAccessRoles,
} from "./accountsBackendUtil";
import { isClosedEnvironmentMode } from "../environmentUtil";
import { WILDFILE_ROUTES } from "@/constants/routes";
import { ServerDoc } from "@repo/schemas";
import {
    createUserSession,
    getUserSession,
    storeUserSession,
} from "./userSessionBackendUtil";

export interface AuthorizedUserData {
    userDB: IUser | null;
    connectedUserDBProviderId: string | null;
    connectedUserDBEmail: string | null;
    wildcardAccessToken: string | null;
    roleElevated?: boolean;
    accessDocElevatedRole?: string[];
    authUserRedirectUrl?: string | null;
    serverDoc?: ServerDoc | null;
}

/**
 * Checks if the user is authorized by verifying the existence of the user in the session.
 * Now uses Redis cache to avoid repeated MongoDB lookups for the same user.
 *
 * @param {GetServerSidePropsContext} context - The context object from getServerSideProps.
 * @returns {Promise<AuthorizedUserData | null>} - A Promise that resolves to the user object or null.
 */
export async function authorizeUser(
    context: GetServerSidePropsContext
): Promise<AuthorizedUserData | null> {
    console.log(`[AuthorizeUser] Starting authorization for route: ${context?.req?.url}`);

    const session: ExtendedSession | null = await getServerSession(
        context.req,
        context.res,
        getNextAuthOptions(context.req, context.res)
    );

    console.log(`[AuthorizeUser] Session retrieved - exists: ${!!session}, clearCookies: ${session?.clearCookies || false}`);

    if (session?.clearCookies) {
        clearAllCookies(context.res);
        console.log(`Session token is invalid. Cleared auth related cookies.`);
        return null;
    }

    let connectedUserDBProviderId: string | null = null;
    let connectedUserDBEmail: string | null = null;

    // First try to get user from the session
    let userDB: IUser | null = getUserDBSessionObj(session);
    console.log(`[AuthorizeUser] User from session - exists: ${!!userDB}`);

    console.log(`[AuthorizeUser] Checking for wildcard access token from cookies and session`);
    const tokenFromCookies = getWildcardAccessTokenFromCookiesServerSide(context);
    const tokenFromSession = session?.wildcardAccessToken;
    console.log(`[AuthorizeUser] Token from cookies: ${!!tokenFromCookies}, Token from session: ${!!tokenFromSession}`);

    const wildcardAccessToken = tokenFromCookies || tokenFromSession;
    console.log(`[AuthorizeUser] Final wildcard access token exists: ${!!wildcardAccessToken}`);

    if (!wildcardAccessToken) {
        console.log(
            `No wildcard access token found during user authorization from route: ${context?.req?.url}`
        );
        console.log(`[AuthorizeUser] Available cookies: ${Object.keys(context.req.cookies || {}).join(', ')}`);
        return null;
    }

    console.log(`[AuthorizeUser] Verifying wildcard access token`);
    const { valid, decodedToken, error } = verifyToken(wildcardAccessToken);
    console.log(`[AuthorizeUser] Token verification - valid: ${valid}, hasDecodedToken: ${!!decodedToken}, error: ${error || 'none'}`);

    if (!valid || !decodedToken) {
        console.log("Invalid or no token found during verification");
        return null;
    }

    const { id, userId } = decodedToken;
    console.log(`[AuthorizeUser] Decoded token - id: ${id}, userId: ${userId}`);
    connectedUserDBProviderId = id;

    // If user was not found in the session, check cache first
    if (!userDB && userId) {
        console.log(
            `User not found in session, checking cache for provider ID: ${userId}`
        );

        // Try to get user from cache
        const cachedUserSession: UserSession | null = await getUserSession(
            userId
        );

        // For debugging purposes - on access to user session cache
        // console.log("Debug: Cached user session: ", cachedUserSession);

        if (cachedUserSession) {
            console.log(`Found user in cache for provider ID: ${userId}`);
            userDB = cachedUserSession.user;
        } else {
            // If not in cache, fetch from database
            console.log(
                `User not in cache, fetching from DB for provider ID: ${userId}`
            );

            // Then update your code
            userDB = await getUserByProviderId(id);

            // If found in DB, store in cache for future requests
            if (userDB && userDB._id) {
                console.log(`Storing user in cache: ${userDB._id}`);
                const userSession = createUserSession(userDB);
                await storeUserSession(
                    userDB._id?.toString() || id,
                    userSession
                );
            }
        }
    }

    if (userDB) {
        const connectedUserProvider = getAccountProviderByAccountId(
            userDB,
            connectedUserDBProviderId
        );
        connectedUserDBEmail = (connectedUserProvider?.email as string) || "";
    }

    if (userDB?.isSuspended) {
        userDB.roles = [];
    }

    // Get access code from query parameters
    const accessCodeFromQuery = context.query.accessCode as string | undefined;

    // Process access code and elevate role if necessary
    const { roleElevated, accessDocElevatedRole, updatedUserDB } =
        await verifyAndElevateAccessRoles(context, userDB);

    // Update userDB and cache if roles were elevated
    // And also update the other similar section
    if (updatedUserDB) {
        console.log(`User roles elevated: ${updatedUserDB.roles}`);
        userDB = updatedUserDB;

        // Update cache with the new roles
        if (userDB._id) {
            const userSession = createUserSession(userDB);
            await storeUserSession(userDB._id?.toString(), userSession);
        }
    }

    const isUserOnlySpectatorRoleAndClosedEnvironmentMode =
        hasOnlySpectatorRoleAndClosedEnvironmentMode(
            userDB?.roles,
            UserRole.SPECTATOR
        );

    // Get redirect URL from query parameters or set to sign-up confirmation if needed
    let authUserRedirectUrl: string | null = null;
    if (accessCodeFromQuery) {
        authUserRedirectUrl = context.query.redirectUrl as string | null;
    } else if (
        !roleElevated &&
        isUserOnlySpectatorRoleAndClosedEnvironmentMode
    ) {
        authUserRedirectUrl = WILDFILE_ROUTES.SIGN_UP_CONFIRMATION.url;
    }

    const authorizedUserData: AuthorizedUserData = {
        userDB,
        connectedUserDBProviderId,
        connectedUserDBEmail,
        wildcardAccessToken,
        roleElevated,
        accessDocElevatedRole,
        authUserRedirectUrl,
    };

    return authorizedUserData;
}

/**
 * Checks if the user has only the SPECTATOR role.
 *
 * @param {Array<string>} roles - The roles assigned to the user.
 * @param {string} spectatorRole - The role representing a spectator.
 * @returns {boolean} - Returns true if the user has only the SPECTATOR role, otherwise false.
 */
export function hasOnlySpectatorRole(
    roles: UserRole[] | undefined,
    spectatorRole: string
): boolean {
    return roles?.length === 1 && roles[0] === spectatorRole;
}

/**
 * Checks if the user has only the SPECTATOR role and if the environment is in closed mode.
 *
 * @param {Array<string>} roles - The roles assigned to the user.
 * @param {string} spectatorRole - The role representing a spectator.
 * @returns {boolean} - Returns true if the user has only the SPECTATOR role and the environment is in closed mode, otherwise false.
 */
export function hasOnlySpectatorRoleAndClosedEnvironmentMode(
    roles: UserRole[] | undefined,
    spectatorRole: string
): boolean {
    return (
        hasOnlySpectatorRole(roles, spectatorRole) && isClosedEnvironmentMode()
    );
}
