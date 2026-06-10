import { NextApiRequest, NextApiResponse } from "next";
import connectToDb from "@/db/connectToDb"; // Your MongoDB connection utility
import {
    API_RESPONSE_STATUS_CODE_404_MESSAGE,
    sendApiResponseWithStatusCode,
} from "@/utils/backend/apiUtil"; // Utility to standardize API responses
import { getOldUserByDiscordId } from "@repo/schemas";
/**
 * API handler to fetch a user from the old users collection by Discord ID.
 *
 * @param {NextApiRequest} req - The API request object.
 * @param {NextApiResponse} res - The API response object.
 * @returns {Promise<void>} - A promise that resolves when the function completes.
 */
async function handler(
    req: NextApiRequest,
    res: NextApiResponse
): Promise<void> {
    // Immediately return 404 to indicate the endpoint is deprecated
    // @ts-ignore - unreachable code
    return res
        .status(404)
        .json({ message: API_RESPONSE_STATUS_CODE_404_MESSAGE });

    const { discordId } = req.query;

    if (req.method !== "GET") {
        return sendApiResponseWithStatusCode(
            res,
            { success: false, message: `Method ${req.method} Not Allowed` },
            405
        );
    }

    if (!discordId || typeof discordId !== "string") {
        return sendApiResponseWithStatusCode(
            res,
            { success: false, message: "Discord ID is required" },
            400
        );
    }

    try {
        await connectToDb();

        console.log("Connected to DB");

        // @ts-ignore - Ignore unreachable code warning
        const user = await getOldUserByDiscordId(discordId);
        if (!user) {
            return sendApiResponseWithStatusCode(
                res,
                { success: false, message: "User not found" },
                404
            );
        }

        return sendApiResponseWithStatusCode(
            res,
            { success: true, data: user },
            200
        );
    } catch (error: any) {
        return sendApiResponseWithStatusCode(
            res,
            {
                success: false,
                message: `Error fetching user: ${error.message}`,
            },
            500
        );
    }
}

export default handler;
