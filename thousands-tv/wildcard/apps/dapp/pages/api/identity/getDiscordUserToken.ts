import { NextApiRequest, NextApiResponse } from "next";
import connectToDb from "@/db/connectToDb";
import { UserDoc } from "@repo/schemas";
import { findUserByProviderId } from "@repo/schemas";
import { AccountProviderType } from "@repo/interfaces";
import { createWildcardAccessToken } from "../auth/wildcard/token";
import validateAdminAccessTokenMiddleware from "../middleware/validateAdminAccessToken";

export interface DiscordIdParams {
    discordId: string;
}

async function getDiscordUserToken(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            data: null,
            message: `Method ${req.method} Not Allowed`,
        });
    }

    try {
        const { discordId } = req.body as DiscordIdParams;

        if (!discordId) {
            return res.status(400).json({
                success: false,
                data: null,
                message: "Discord ID is required",
            });
        }

        console.log("Generating token for Discord ID:", discordId);
        await connectToDb();

        // Find user by Discord provider ID
        const user: UserDoc | null = await findUserByProviderId(
            discordId,
            AccountProviderType.DISCORD
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                data: null,
                message: `User not found with Discord ID: ${discordId}`,
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

        // Get the Discord provider ID for token creation
        const discordProviderId = user.discordProvider?.id;
        if (!discordProviderId) {
            return res.status(400).json({
                success: false,
                data: null,
                message: "Discord provider ID not found for user",
            });
        }

        // Create wildcard access token
        const wildcardAccessToken = createWildcardAccessToken(
            discordProviderId,
            userId,
            user.roles || []
        );

        const responseData = {
            wildcardAccessToken: wildcardAccessToken,
            userId: userId,
            discordId: discordId,
        };

        return res.status(200).json({
            success: true,
            data: responseData,

            message: "Wildcard access token generated successfully",
        });
    } catch (error: any) {
        console.error("Error generating token for Discord ID:", error.message);
        return res.status(500).json({
            success: false,
            data: null,
            message: `Internal server error: ${error.message}`,
        });
    }
}

export default validateAdminAccessTokenMiddleware(getDiscordUserToken);
