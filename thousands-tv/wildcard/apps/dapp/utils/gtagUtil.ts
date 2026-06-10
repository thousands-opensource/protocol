import { SocialMediaPlatform } from "@repo/interfaces";

/**
 * Retrieve the appropriate element id e.g. "link to twitch" button for GA analytics
 * @param socialName - name of the social platform
 * @returns gtag id associated with the social platform
 */
export const getElementIdLinkSocials = (
    socialName: SocialMediaPlatform
): string => {
    switch (socialName) {
        case "twitch":
            return "ga-profile-button-link-twitch";
        case "twitter":
            return "ga-profile-button-link-x";
        default:
            return "ga-profile-button-add-socials";
    }
};
