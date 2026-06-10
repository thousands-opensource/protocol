import { WILDFILE_ROUTES, AccessRules } from "@/constants/routes";
import { IUser, UserRole } from "@repo/interfaces";
import { Session } from "next-auth";
import { checkIfAtLeastOneSocialProviderIdExists } from "./accountsUtil";
import { findMatchingRoute } from "./backend/routeConfigUtil";
import { GetServerSidePropsContext } from "next";

/**
 * An array of routes that are whitelisted from the redirectUserIfUnauthorized function.
 * @dev - this is used to prevent an infinite loop of redirects when the user is not authorized (on /verify page).
 */
const whitelistedRoutes = [WILDFILE_ROUTES.VERIFY.url];

/**
 * Extracts the mongo user DB object from the session.
 *
 * @param {Session | any} session - The session object from which to extract the user.
 * @returns {IUser | null} - The user object if it exists in the session, or null otherwise.
 */
export const getUserDBSessionObj = (session: Session | any): IUser | null => {
    if (!session?.user) {
        return null;
    }
    const user = session?.userDB as IUser;
    return user;
};

/**
 * Redirects to login page if the user is not found. If role is not authorized, route back to home page.
 *
 * @param {string | undefined | null} wildcardAccessTokenCookie - The wildcard access token from the cookies.
 * @param {IUser | null} userDB - The user object from the database.
 * @param {UserRole[]} [authorizedRoles] - Optional. An array of roles that are authorized to access the page.
 * @returns {{ redirect: { destination: string; permanent: boolean } } | null} - The redirect object if the user is not authorized, otherwise null.
 */
export function redirectUserIfUnauthorized(
    wildcardAccessTokenCookie: string | undefined | null,
    userDB: IUser | null,
    context: GetServerSidePropsContext
): { redirect: { destination: string; permanent: boolean } } | null {
    if (!wildcardAccessTokenCookie) {
        return {
            redirect: {
                destination: "/login",
                permanent: false,
            },
        };
    }

    if (!userDB) {
        return {
            redirect: {
                destination: "/login",
                permanent: false,
            },
        };
    }

    const matchingRouteConfigObj = findMatchingRoute(context.resolvedUrl);
    if (!matchingRouteConfigObj) {
        console.log(
            `The page ${context.resolvedUrl} is not setup in the route config. Redirecting to unauthorized page.`
        );
        return {
            redirect: {
                destination: WILDFILE_ROUTES.UNAUTHORIZED.url,
                permanent: false,
            },
        };
    }

    const routeConfigAllowedRoles = matchingRouteConfigObj.allowedRoles;
    const routeConfigAccessRules = matchingRouteConfigObj?.accessRules || [];

    const connectedUserRoles = userDB?.roles;

    const hasRequiredRole = routeConfigAllowedRoles.some((role) =>
        connectedUserRoles?.includes(role)
    );

    // @dev - If there are no allowed roles defined OR the user doesn’t have one of the required roles, redirect to unauthorized.
    if (routeConfigAllowedRoles.length === 0 || !hasRequiredRole) {
        console.log(
            `User does not have the required role. Redirecting to unauthorized page.`
        );
        return {
            redirect: {
                destination: WILDFILE_ROUTES.UNAUTHORIZED.url,
                permanent: false,
            },
        };
    }

    const isUserEmailVerified = userDB?.beamableProvider?.isVerified || false;
    const isDisplayNameSet = !!userDB?.preferences.displayName;
    const isAtLeastOneSocialIsConnected =
        checkIfAtLeastOneSocialProviderIdExists(userDB);
    const isTwitterLinked = !!userDB?.twitterProvider?.id;
    const isLinkedWalletSet = !!userDB?.walletProvider?.address;
    const isCompetitor = userDB?.roles.includes(UserRole.COMPETITOR);

    const unmetRules: AccessRules[] = routeConfigAccessRules.filter((rule) => {
        switch (rule) {
            case AccessRules.REQUIRE_EMAIL:
                return !isUserEmailVerified;
            case AccessRules.REQUIRE_DISPLAY_NAME:
                return !isDisplayNameSet;
            case AccessRules.REQUIRE_TWITTER_LINKED:
                return !isTwitterLinked;
            case AccessRules.REQUIRE_AT_LEAST_ONE_SOCIAL:
                return !isAtLeastOneSocialIsConnected;
            case AccessRules.REQUIRE_LINKED_WALLET:
                return !isLinkedWalletSet;
            default:
                return false;
        }
    });

    // Check if the user is a competitor and requires email verification and route is not verify
    // Remmed out the following on 1/6/2026 to handle the competitor role now being used for the competitor dashboard
    /*
    if (
        isCompetitor &&
        !isUserEmailVerified &&
        !whitelistedRoutes.some((route) => context.resolvedUrl.includes(route))
    ) {
        unmetRules.push(AccessRules.REQUIRE_EMAIL);
    }
    */

    if (unmetRules.length > 0) {
        const queryParams = new URLSearchParams();
        unmetRules.forEach((rule) => queryParams.append("unmetRule", rule));
        queryParams.append("redirect", context.resolvedUrl);

        return {
            redirect: {
                destination: `/verify?${queryParams.toString()}`,
                permanent: false,
            },
        };
    }

    return null;
}

export const getClientSideCookieValue = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value?.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift();
    return null;
};
