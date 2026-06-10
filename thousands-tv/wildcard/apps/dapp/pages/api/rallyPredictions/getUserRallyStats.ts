import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import { authorize } from "../middleware/authorization";
import { IUser } from "@repo/interfaces";
import IRallyMetricsService from "@/services/interfaces/IRallyMetricsService";
import { BackendApiResponse } from "@/types";

export interface UserRallyStatsApiResponse extends BackendApiResponse<any> {
    data?: {
        poolContribution: number;
        positionFactor: number;
        timingFactor: number;
        activityLevel: 'Low' | 'Medium' | 'High';
        percentileRank: number;
    } | null;
}

type RequestResponse = UserRallyStatsApiResponse;

type RequestBody = {
    rallyPredictionId: string;
    userAmount: number;
    betTimestamp?: string;
}

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

        const { rallyPredictionId, userAmount, betTimestamp } = req.body as RequestBody;

        if (!rallyPredictionId || !userAmount) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: rallyPredictionId, userAmount",
            });
        }

        const rallyMetricsService = diContainer.get<IRallyMetricsService>(
            "IRallyMetricsService"
        );

        const timestamp = betTimestamp ? new Date(betTimestamp) : new Date();
        const userStats = await rallyMetricsService.calculateUserStats(
            rallyPredictionId,
            userAmount,
            timestamp
        );

        const successMsg = `Successfully calculated user stats for rallyPredictionId [${rallyPredictionId}]`;
        console.info(successMsg);

        return res.status(200).json({
            success: true,
            message: successMsg,
            data: userStats,
        });
    } catch (error: any) {
        console.error("Error calculating user rally stats:", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

export default authorize(handler);
