import { WILDFILE_ROUTES } from "@/constants/routes";
import { RouteConfigUrlParams } from "@/types";

export const MINT_ROUTE = "/login";
export const getUserIdProfileRoute = (id: string) => `/wildfile/userId/${id}`;

/**
 * Replaces the dynamic segments in the URL template with actual values.
 * @param {string} template - The URL template with dynamic segments.
 * @param {Params} params - An object containing the parameters to replace in the template.
 * @returns {string} The formatted URL with dynamic segments replaced by actual values.
 */
export function formatRouteConfigUrl(
    routeConfigUrl: string,
    params: RouteConfigUrlParams
): string {
    return routeConfigUrl.replace(/:([a-zA-Z]+)/g, (_, key) => {
        return params[key] || `:${key}`;
    });
}

/**
 * Retrieves an array of URLs that are whitelisted for authorization purposes/ do not need userDB auth. (i.e login, sign-up confirmation)
 * These URLs correspond to routes where the user should not be redirected
 * even if they are not logged in, such as login or sign-up confirmation pages.
 *
 * @returns {string[]} An array of whitelisted route URLs.
 */
export function getWhitelistedUrlsFromAuthorization(): string[] {
    const { LOGIN, SIGN_UP_CONFIRMATION } = WILDFILE_ROUTES;
    return [LOGIN.url, SIGN_UP_CONFIRMATION.url];
}
