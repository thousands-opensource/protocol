import { NextRouter } from "next/router";

export enum ServerName {
    WILDCARD = "wildcard",
    YGG = "ygg",
    THOUSANDS = "thousands",
}

export interface ServerConfig {
    serverCode: ServerName;
    primaryLogoUrl: string;
    title: string;
    path: string;
    primaryColor: string;
    gradientColor: string;
    serverName: string;
    serverLogoHeight: string; // a custom height is required in order to maintain the aspect ratio of the logo across different servers
}

/**
 * Configuration for each server.
 */
export const SERVER_CONFIGS: Record<ServerName, ServerConfig> = {
    [ServerName.WILDCARD]: {
        serverCode: ServerName.WILDCARD,
        title: "Wildfile",
        primaryLogoUrl: "/images/ServerNavigation/wildcardservercicle.svg",
        path: "/wildcard",
        primaryColor: "#4776E6",
        gradientColor:
            "linear(to-r, #4776E6, #4671E6 30%, rgba(139, 62, 47, 0))",

        serverName: "Wildcard",
        serverLogoHeight: "30px",
    },
    [ServerName.THOUSANDS]: {
        serverCode: ServerName.THOUSANDS,
        title: "Thousands",
        primaryLogoUrl: "/images/ServerNavigation/thousandsservercircle.svg",
        path: "/thousands",
        primaryColor: "#8B3E2F",
        gradientColor:
            "linear-gradient(to right, #821510, #821510 30%, rgba(0, 0, 0, 1))",
        serverName: "THOUSANDS",
        serverLogoHeight: "45px",
    },
    [ServerName.YGG]: {
        serverCode: ServerName.YGG,
        title: "YGG",
        primaryLogoUrl: "/images/ServerNavigation/yggservercircle.svg",
        path: "/ygg",
        primaryColor: "#75C97F",
        gradientColor:
            "linear(to-r, #75C97F, #60FAC8 30%, rgba(20, 20, 20, 10))",
        serverName: "YGG",
        serverLogoHeight: "45px",
    },
} as const;

/**
 * Default server placeholder.
 */
export const DEFAULT_SERVER_PLACEHOLDER: ServerConfig = {
    serverCode: ServerName.WILDCARD,
    title: "",
    primaryLogoUrl: "",
    path: "",
    primaryColor: "blackAlpha.500",
    gradientColor: "unset",
    serverName: "",
    serverLogoHeight: "45px",
};

/**
 * Get the server code from the path.
 */
export function getServerCodeFromPath(router: NextRouter): ServerName | null {
    const path = router.asPath;
    if (path.includes(`/${ServerName.THOUSANDS}/`)) return ServerName.THOUSANDS;
    if (path.includes(`/${ServerName.YGG}/`)) return ServerName.YGG;
    if (path.includes(`/${ServerName.WILDCARD}/`)) return ServerName.WILDCARD;
    return null;
}
