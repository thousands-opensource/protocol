import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { isEnabledMongoUserAnalyticsLog } from "@/utils/environmentUtil";

export default function useUserAnalytics(address?: string) {
    useEffect(() => {
        logUserTimestamp();
    }, [address]);

    /**
     * Log user timestamp and update where necessary via useCallback
     * @dev - use state logic removed from this hook
     * @returns the updated mongodb response of the user's latest login activity
     */
    const logUserTimestamp = useCallback(async () => {
        try {
            if (!isEnabledMongoUserAnalyticsLog()) {
                console.warn(
                    "Environment variable NEXT_PUBLIC_ENABLE_MONGO_USER_ANALYTICS_LOG needs to be set to enable user analytics logging"
                );
            }
            const response = await axios.post("/api/userAnalytics/", {
                walletAddress: address,
            });

            const userAnalyticsData = response.data;
            if (userAnalyticsData.success) {
                if (userAnalyticsData.data) {
                    // console.log("User analytics timestamp logged to DB");
                }
            } else {
                console.log(
                    userAnalyticsData.err ||
                        `Error logging user analytics timestamp to DB`
                );
            }
        } catch (e: any) {
            console.error("Failed to fetch user from database", e);
        }
    }, []);
}
