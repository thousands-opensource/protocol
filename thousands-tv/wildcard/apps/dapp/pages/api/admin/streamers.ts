import { NextApiRequest, NextApiResponse } from "next";
import connectToDb from "@/db/connectToDb";
import { findUsersByQuery } from "@repo/schemas";
import { authorize } from "../middleware/authorization";
import { UserRole } from "@repo/interfaces";

async function getStreamers(
    req: NextApiRequest,
    res: NextApiResponse,
    user: any
) {
    if (req.method !== "GET") {
        res.status(405).json({
            message: `getStreamers - Method ${req.method} Not Allowed`,
        });
        return;
    }

    try {
        await connectToDb();

        const streamers = await findUsersByQuery({
            roles: { $in: [UserRole.STREAMER] }
        }, {
            "preferences.displayName": 1,
            _id: 1
        });

        const streamerNames = streamers
            .map(streamer => streamer.preferences?.displayName)
            .filter(name => name && name.trim().length > 0);

        res.status(200).json({
            success: true,
            data: streamerNames,
        });
    } catch (error) {
        console.error("Error fetching streamers:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}

export default authorize(getStreamers, [UserRole.ADMIN]);
