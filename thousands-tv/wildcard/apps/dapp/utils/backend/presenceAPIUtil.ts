import { UserDoc } from "@repo/schemas";
import { getAPIEndpointRootUrl } from "../environmentUtilWCA";
import axios from "axios";

/**
 * Adds or updates a user in the stream.
 *
 * @param {string} userId - The ID of the user.
 * @param {string} streamArn - The ARN of the stream.
 * @param {string} wildcardAccessToken - The wildcard access token.
 * @returns {Promise<void>} - A promise that resolves when the function completes.
 * @throws Will throw an error if the API call fails.
 */
export const recordUserStreamActivity = async (
    userId: string,
    streamId: string,
    wildcardAccessToken: string
): Promise<void> => {
    try {
        if (!wildcardAccessToken) {
            throw new Error("Wildcard access token is missing");
        }

        const response = await axios.post(
            `${getAPIEndpointRootUrl()}/api/presence-api/active-viewers/record-user-activity`,
            {
                userId,
                streamId,
            },
            {
                headers: {
                    Authorization: `Bearer ${wildcardAccessToken}`,
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error("Error adding or updating user in stream", error);
        throw error;
    }
};
