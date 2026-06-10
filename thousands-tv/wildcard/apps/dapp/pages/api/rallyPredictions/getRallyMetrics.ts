import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import { authorize } from "../middleware/authorization";
import { IUser } from "@repo/interfaces";
import IRallyMetricsService from "@/services/interfaces/IRallyMetricsService";
import { BackendApiResponse } from "@/types";

export interface RallyMetricsApiResponse extends BackendApiResponse<any> {
    data?: {
        totalPool: number;
        forTotal: number;
        againstTotal: number;
        participantCount: number;
        hourlyActivity: number;
        momentumLevel: 'Low' | 'Medium' | 'High';
        activityMultiplier: number;
    } | null;
}

type RequestResponse = RallyMetricsApiResponse;

type RequestBody = {
    rallyPredictionId: string;
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

        const { rallyPredictionId } = req.body as RequestBody;

        if (!rallyPredictionId) {
            return res.status(400).json({
                success: false,
                message: "Missing required field: rallyPredictionId",
            });
        }

        const rallyMetricsService = diContainer.get<IRallyMetricsService>(
            "IRallyMetricsService"
        );

        const metrics = await rallyMetricsService.getRallyMetrics(rallyPredictionId);

        if (!metrics) {
            return res.status(404).json({
                success: false,
                message: "Rally metrics not found",
            });
        }

        const successMsg = `Successfully fetched rally metrics for rallyPredictionId [${rallyPredictionId}]`;
        console.info(successMsg);

        return res.status(200).json({
            success: true,
            message: successMsg,
            data: metrics,
        });
    } catch (error: any) {
        console.error("Error fetching rally metrics:", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

export default authorize(handler);
