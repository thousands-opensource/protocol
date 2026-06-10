import { NextApiRequest, NextApiResponse } from "next";
import connectToDb from "@/db/connectToDb";
import { UserDoc } from "@repo/schemas";
import { findUserByProviderId } from "@repo/schemas";
import { AccountProviderType } from "@repo/interfaces";
import { createWildcardAccessToken } from "../auth/wildcard/token";
import validateAdminAccessTokenMiddleware from "../middleware/validateAdminAccessToken";

export interface KickIdParams {
    kickId: string;
}

async function getKickUserToken(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            data: null,
            message: `Method ${req.method} Not Allowed`,
        });
    }

    try {
        const { kickId } = req.body as KickIdParams;

        if (!kickId) {
            return res.status(400).json({
                success: false,
                data: null,
                message: "Kick ID is required",
            });
        }

        console.log("Generating token for Kick ID:", kickId);
        await connectToDb();

        // Find user by Kick provider ID
        const user: UserDoc | null = await findUserByProviderId(
            kickId,
            AccountProviderType.KICK
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                data: null,
                message: `User not found with Kick ID: ${kickId}`,
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

        // Get the Kick provider ID for token creation
        const kickProviderId = user.kickProvider?.id;
        if (!kickProviderId) {
            return res.status(400).json({
                success: false,
                data: null,
                message: "Kick provider ID not found for user",
            });
        }

        // Create wildcard access token
        const wildcardAccessToken = createWildcardAccessToken(
            kickProviderId,
            userId,
            user.roles || []
        );

        const responseData = {
            wildcardAccessToken: wildcardAccessToken,
            userId: userId,
            kickId: kickId,
        };

        console.log("Response data:", responseData);

        return res.status(200).json({
            success: true,
            data: responseData,
            message: "Wildcard access token generated successfully",
        });
    } catch (error: any) {
        console.error("Error generating token for Kick ID:", error.message);
        return res.status(500).json({
            success: false,
            data: null,
            message: `Internal server error: ${error.message}`,
        });
    }
}

export default validateAdminAccessTokenMiddleware(getKickUserToken);
