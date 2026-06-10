import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import { authorize } from "../middleware/authorization";
import { IUser } from "@repo/interfaces";
import IPredictionChartService from "@/services/interfaces/IPredictionChartService";
import { BackendApiResponse } from "@/types";

interface RequestBody {
    rallyPredictionId: string;
    price: number;
    timestamp?: string;
}

async function handler(
    req: NextApiRequest,
    res: NextApiResponse<BackendApiResponse<null>>,
    user: IUser
) {
    try {
        if (req.method !== "POST") {
            return res.status(405).json({
                success: false,
                message: `Method ${req.method} Not Allowed`,
            });
        }

        const { rallyPredictionId, price, timestamp } = req.body as RequestBody;

        if (!rallyPredictionId || price === undefined) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: rallyPredictionId, price",
            });
        }

        const predictionChartService = diContainer.get<IPredictionChartService>(
            "IPredictionChartService"
        );

        const recordTimestamp = timestamp ? new Date(timestamp) : new Date();
        const success = await predictionChartService.recordPricePoint(
            rallyPredictionId,
            price,
            recordTimestamp
        );

        if (!success) {
            return res.status(500).json({
                success: false,
                message: "Failed to record chart data point",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Chart data point recorded successfully",
        });
    } catch (error: any) {
        console.error("Error recording chart data point:", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

export default authorize(handler);
