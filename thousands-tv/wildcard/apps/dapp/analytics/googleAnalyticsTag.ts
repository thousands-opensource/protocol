import { getGoogleTagManagerId } from "@/utils/environmentUtil";

/**
 * Measures the page views of a webpage associated with Google Analytics Tracking ID
 * https://developers.google.com/analytics/devguides/collection/gtagjs/pages
 * @param url - url of the DApp Route
 */
export const measurePageView = (url: string) => {
    window.gtag("config", getGoogleTagManagerId(), {
        page_path: url,
    });
};
