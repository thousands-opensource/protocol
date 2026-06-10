import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import { authorize } from "../middleware/authorization";
import { IUser } from "@repo/interfaces";
import { IUserInsightScoreService } from "@/services/implementations/UserInsightScoreService";
import { BackendApiResponse } from "@/types";

export interface LeaderboardEntry {
    userId: string;
    displayName: string;
    totalInsightScore: number;
    totalPredictions: number;
    correctPredictions: number;
    accuracyPercentage: number;
    bestStreak: number;
    currentStreak: number;
    rank: number;
}

export interface InsightScoreLeaderboardApiResponse extends BackendApiResponse<LeaderboardEntry[]> {
    data?: LeaderboardEntry[];
    currentUserEntry?: LeaderboardEntry;
}

type RequestResponse = InsightScoreLeaderboardApiResponse;

async function handler(
    req: NextApiRequest,
    res: NextApiResponse<RequestResponse>,
    user: IUser
) {
    try {
        if (req.method !== "GET") {
            return res.status(405).json({
                success: false,
                message: `Method ${req.method} Not Allowed`,
            });
        }

        const { topCount = "10" } = req.query;

        const topCountNum = parseInt(topCount as string, 10);

        if (isNaN(topCountNum) || topCountNum <= 0 || topCountNum > 1000) {
            return res.status(400).json({
                success: false,
                message: "Invalid topCount parameter. Must be between 1 and 1000.",
            });
        }

        const currentUserId = user._id?.toString();

        const userInsightScoreService = diContainer.get<IUserInsightScoreService>("IUserInsightScoreService");
        const { leaderboardEntries, currentUserEntry } = await userInsightScoreService.getLeaderboardWithDecay(topCountNum, currentUserId);

        const successMsg = `Successfully fetched insight score leaderboard with ${leaderboardEntries.length} entries`;
        console.info(successMsg);

        return res.status(200).json({
            success: true,
            message: successMsg,
            data: leaderboardEntries,
            currentUserEntry: currentUserEntry
        });
    } catch (error: any) {
        console.error("Error fetching insight score leaderboard:", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

export default authorize(handler);
