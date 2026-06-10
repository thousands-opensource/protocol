import { RouteConfig, WILDFILE_ROUTES } from "@/constants/routes";

/**
 * Finds the matching route configuration for a given pathname.
 *
 * @param {string | undefined} pathname - The pathname to match against the route configurations.
 * @returns {RouteConfig | null} - The matching route configuration or null if no match is found.
 */
export function findMatchingRoute(
    pathname: string | undefined
): RouteConfig | null {
    if (!pathname) {
        return null;
    }

    // Removes query parameters and trailing slash
    const cleanPath = pathname.split("?")[0].replace(/\/$/, "");
    const pathSegments = cleanPath.split("/").filter(Boolean);

    function isMatch(routeUrl: string, pathToMatch: string[]): boolean {
        const routeSegments = routeUrl.split("/").filter(Boolean);
        if (routeSegments.length !== pathToMatch.length) return false;

        return routeSegments.every((segment, index) => {
            return segment.startsWith(":") || segment === pathToMatch[index];
        });
    }

    function searchRoutes(routes: any): RouteConfig | null {
        for (const key in routes) {
            const route = routes[key];
            if (route.url && isMatch(route.url, pathSegments)) {
                return route;
            } else if (typeof route === "object") {
                const nestedResult = searchRoutes(route);
                if (nestedResult) return nestedResult;
            }
        }
        return null;
    }

    return searchRoutes(WILDFILE_ROUTES);
}
