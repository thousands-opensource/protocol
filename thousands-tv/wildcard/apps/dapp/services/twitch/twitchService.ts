import axios from "axios";
import {
    getTwitchClientId,
    getTwitchClientSecret,
} from "@/utils/environmentUtil";

interface TwitchAppToken {
    access_token: string;
    expires_at: number;
}

interface TwitchStream {
    id: string;
    user_id: string;
    user_login: string;
    user_name: string;
    viewer_count: number;
    type: string;
}

interface TwitchStreamsResponse {
    data: TwitchStream[];
    pagination: {
        cursor?: string;
    };
}

export interface ViewerCountData {
    user_id: string;
    user_login: string;
    viewer_count: number;
    is_live: boolean;
}

/***
 * Service to interact with Twitch API for getting stream viewer counts
 */
class TwitchService {
    private appToken: TwitchAppToken | null = null;

    /**
     * Get or refresh the Twitch app access token using client credentials flow
     */
    private async getAppAccessToken(): Promise<string> {
        // Check if we have a valid cached token
        if (this.appToken && Date.now() < this.appToken.expires_at) {
            return this.appToken.access_token;
        }

        console.log("Fetching new Twitch app access token");

        try {
            const params = new URLSearchParams();
            params.append("client_id", getTwitchClientId());
            params.append("client_secret", getTwitchClientSecret());
            params.append("grant_type", "client_credentials");

            const response = await axios.post(
                "https://id.twitch.tv/oauth2/token",
                params,
                {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                }
            );

            console.log("Twitch app access token response:", response.data);

            const { access_token, expires_in } = response.data;

            // Cache the token with expiration (subtract 60 seconds for safety)
            this.appToken = {
                access_token,
                expires_at: Date.now() + (expires_in - 60) * 1000,
            };

            console.log("Successfully obtained Twitch app access token");
            return access_token;
        } catch (error: any) {
            console.error(
                "Failed to get Twitch app access token:",
                error.message
            );

            // Log more details for debugging
            if (error.response) {
                console.error("Twitch API error response:", {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data,
                });
            }

            throw new Error(
                `Failed to authenticate with Twitch: ${
                    error.response?.data?.message || error.message
                }`
            );
        }
    }

    /**
     * Get viewer counts for specified Twitch user IDs
     * @param userIds Array of Twitch user IDs
     * @returns Array of viewer count data for each user
     */
    async getStreamViewerCounts(userIds: string[]): Promise<ViewerCountData[]> {
        if (!userIds || userIds.length === 0) {
            return [];
        }

        const accessToken = await this.getAppAccessToken();

        const results: ViewerCountData[] = [];
        const liveStreams = new Map<string, TwitchStream>();

        // Process in batches of 100 (Twitch API limit)
        const batchSize = 100;
        for (let i = 0; i < userIds.length; i += batchSize) {
            const batch = userIds.slice(i, i + batchSize);

            try {
                // Build query string with multiple user_id parameters
                const queryParams = batch
                    .map((id) => `user_id=${id}`)
                    .join("&");

                const response = await axios.get<TwitchStreamsResponse>(
                    `https://api.twitch.tv/helix/streams?${queryParams}`,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            "Client-Id": getTwitchClientId(),
                        },
                    }
                );

                // Store live streams in map for quick lookup
                response.data.data.forEach((stream) => {
                    liveStreams.set(stream.user_id, stream);
                });
            } catch (error: any) {
                console.error(
                    `Failed to fetch streams for batch ${i / batchSize + 1}:`,
                    error.message
                );

                // Log more details for debugging
                if (error.response) {
                    console.error("Twitch Streams API error response:", {
                        status: error.response.status,
                        statusText: error.response.statusText,
                        data: error.response.data,
                    });
                }

                // @note - continue processing other batches even if one fails
            }
        }

        // Build results including offline streams
        for (const userId of userIds) {
            const stream = liveStreams.get(userId);

            results.push({
                user_id: userId,
                user_login: stream?.user_login || "",
                viewer_count: stream?.viewer_count || 0,
                is_live: !!stream,
            });
        }

        return results;
    }
}

// Export singleton instance
export const twitchService = new TwitchService();
