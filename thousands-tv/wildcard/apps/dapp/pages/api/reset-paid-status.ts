import { NextApiRequest, NextApiResponse } from "next";
import { authorize } from "./middleware/authorization";
import { IUser, WildcardApiResponse } from "@repo/interfaces";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import connectToDb from "@/db/connectToDb";
import { StreamerStatsModel } from "@repo/schemas";

async function handler(req: NextApiRequest, res: NextApiResponse, user: IUser) {
    if (req.method !== "POST") {
        return sendApiResponse(res, {
            success: false,
            err: "Method not allowed",
        });
    }

    try {
        await connectToDb();
        const war: WildcardApiResponse = await handleResetPaidStatus(user);
        sendApiResponse(res, war);
    } catch (error: any) {
        console.error("Error resetting paid status:", error);
        sendApiResponse(res, {
            success: false,
            err: error.message || "Internal server error",
        });
    }
}

async function handleResetPaidStatus(user: IUser): Promise<WildcardApiResponse> {
    const twitchChannelName = user.twitchProvider?.name;

    if (!twitchChannelName) {
        return {
            success: false,
            err: "User must have a connected Twitch account",
        };
    }

    const result = await StreamerStatsModel.updateMany(
        { channelName: twitchChannelName },
        { $set: { isPaidOut: false } }
    );

    return {
        success: true,
        data: {
            message: `Reset ${result.modifiedCount} streamer stats records`,
            modifiedCount: result.modifiedCount,
        },
    };
}

export default authorize(handler);
