import { NextApiRequest, NextApiResponse } from "next";
import validateAdminAccessTokenMiddleware from "../../middleware/validateAdminAccessToken";
import { twitchService } from "@/services/twitch/twitchService";

interface GetViewCountByIdsRequest {
    userIds: string[];
}

async function getViewCountByIds(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            data: null,
            message: `Method ${req.method} Not Allowed`,
        });
    }

    try {
        const { userIds } = req.body as GetViewCountByIdsRequest;

        // Validate input
        if (!userIds || !Array.isArray(userIds)) {
            return res.status(400).json({
                success: false,
                data: null,
                message: "userIds must be an array",
            });
        }

        if (userIds.length === 0) {
            return res.status(400).json({
                success: false,
                data: null,
                message: "userIds array cannot be empty",
            });
        }

        // Validate all IDs are strings
        const invalidIds = userIds.filter(
            (id) => typeof id !== "string" || id.trim() === ""
        );
        if (invalidIds.length > 0) {
            return res.status(400).json({
                success: false,
                data: null,
                message: "All userIds must be non-empty strings",
            });
        }

        console.log(
            `Fetching viewer counts for ${userIds.length} Twitch user IDs`
        );

        // Fetch viewer counts from Twitch API
        console.log("Calling Twitch service to get viewer counts...");
        const viewerCounts = await twitchService.getStreamViewerCounts(userIds);

        const responseData = {
            viewerCounts,
            timestamp: new Date().toISOString(),
            totalRequested: userIds.length,
            totalLive: viewerCounts.filter((vc) => vc.is_live).length,
        };

        console.log(
            `Successfully fetched viewer counts: ${responseData.totalLive}/${responseData.totalRequested} live`
        );

        return res.status(200).json({
            success: true,
            data: responseData,
            message: "Viewer counts retrieved successfully",
        });
    } catch (error: any) {
        console.error("Error fetching Twitch viewer counts:", error.message);
        return res.status(500).json({
            success: false,
            data: null,
            message: `Internal server error: ${error.message}`,
        });
    }
}

export default validateAdminAccessTokenMiddleware(getViewCountByIds);
