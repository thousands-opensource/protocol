import { NextApiRequest, NextApiResponse } from "next";
import connectToDb from "@/db/connectToDb";
import { UserDoc } from "@repo/schemas";
import { findUserByProviderId } from "@repo/schemas";
import { AccountProviderType } from "@repo/interfaces";
import { createWildcardAccessToken } from "../auth/wildcard/token";
import validateAdminAccessTokenMiddleware from "../middleware/validateAdminAccessToken";

export interface TwitchIdParams {
    twitchId: string;
}

async function getTwitchUserToken(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            data: null,
            message: `Method ${req.method} Not Allowed`,
        });
    }

    try {
        const { twitchId } = req.body as TwitchIdParams;

        if (!twitchId) {
            return res.status(400).json({
                success: false,
                data: null,
                message: "Twitch ID is required",
            });
        }

        console.log("Generating token for Twitch ID:", twitchId);
        await connectToDb();

        // Find user by Twitch provider ID
        const user: UserDoc | null = await findUserByProviderId(
            twitchId,
            AccountProviderType.TWITCH
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                data: null,
                message: `User not found with Twitch ID: ${twitchId}`,
            });
        }

        const userId = user._id?.toString() ?? "";
        if (!userId) {
            return res.status(400).json({
                success: false,
                data: null,
                message: "Invalid user ID found",
            });
        }

        // Get the Twitch provider ID for token creation
        const twitchProviderId = user.twitchProvider?.id;
        if (!twitchProviderId) {
            return res.status(400).json({
                success: false,
                data: null,
                message: "Twitch provider ID not found for user",
            });
        }

        // Create wildcard access token
        const wildcardAccessToken = createWildcardAccessToken(
            twitchProviderId,
            userId,
            user.roles || []
        );

        const responseData = {
            wildcardAccessToken: wildcardAccessToken,
            userId: userId,
            twitchId: twitchId,
        };

        console.log("Response data:", responseData);

        return res.status(200).json({
            success: true,
            data: responseData,

            message: "Wildcard access token generated successfully",
        });
    } catch (error: any) {
        console.error("Error generating token for Twitch ID:", error.message);
        return res.status(500).json({
            success: false,
            data: null,
            message: `Internal server error: ${error.message}`,
        });
    }
}

export default validateAdminAccessTokenMiddleware(getTwitchUserToken);
