import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import { authorize } from "../middleware/authorization";
import { IUser, UserRole } from "@repo/interfaces";
import IUserInsightScoreRepository from "@/repositories/interfaces/IUserInsightScoreRepository";
import ILeaderboardCacheService from "@/services/interfaces/ILeaderboardCacheService";
import { IUserInsightScoreService } from "@/services/implementations/UserInsightScoreService";
import { BackendApiResponse } from "@/types";
import { User } from "lucide-react";

export interface UpdateRanksApiResponse extends BackendApiResponse<{ updated: boolean; count: number }> {
    data?: { updated: boolean; count: number };
}

type RequestResponse = UpdateRanksApiResponse;

async function handler(
    req: NextApiRequest,
    res: NextApiResponse<RequestResponse>,
    user: IUser
) {
    try {
        if (req.method !== "POST") {
            return res.status(405).json({
                success: false,
                message: `Method ${req.method} Not Allowed`,
            });
        }

        const userInsightScoreRepository = diContainer.get<IUserInsightScoreRepository>(
            "IUserInsightScoreRepository"
        );

        const leaderboardCacheService = diContainer.get<ILeaderboardCacheService>(
            "ILeaderboardCacheService"
        );

        const userId = user?._id?.toString() || 'unknown';
        console.info(`Manual rank update triggered by user [${userId}]`);

        const userInsightScoreService = diContainer.get<IUserInsightScoreService>("IUserInsightScoreService");
        const { totalUsers, updatedUsers, ranksUpdated } = await userInsightScoreService.refreshAllUserScoresWithDecay();

        if (ranksUpdated) {
            const successMsg = `Successfully updated leaderboard ranks and summaries for ${updatedUsers}/${totalUsers} users with decay applied`;
            console.info(successMsg);

            return res.status(200).json({
                success: true,
                message: successMsg,
                data: { updated: true, count: totalUsers }
            });
        } else {
            const errorMsg = "Failed to update leaderboard ranks";
            console.error(errorMsg);

            return res.status(500).json({
                success: false,
                message: errorMsg,
                data: { updated: false, count: totalUsers }
            });
        }
    } catch (error: any) {
        console.error("Error updating leaderboard ranks:", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

export default handler
//  authorize(handler, [UserRole.ADMIN]);
