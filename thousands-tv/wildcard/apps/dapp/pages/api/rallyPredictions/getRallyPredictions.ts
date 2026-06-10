import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import { authorize } from "../middleware/authorization";
import { RallyPredictionDoc } from "@repo/schemas";
import { IUser, IRallyPrediction } from "@repo/interfaces";
import IRallyPredictionRepository from "@/repositories/interfaces/IRallyPredictionRepository";
import { BackendApiResponse } from "@/types";

/**
 * Backend API response interface for forecasts API
 */
export interface RallyPredictionsApiResponse
    extends BackendApiResponse<IRallyPrediction[]> {
    data?: IRallyPrediction[] | null;
}

type RequestResponse = RallyPredictionsApiResponse;

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

        const { unexpired, includeHidden } = req.query;

        const rallyPredictionRepository = diContainer.get<IRallyPredictionRepository>(
            "IRallyPredictionRepository"
        );

        let rallyPredictionDocs: RallyPredictionDoc[];

        if (unexpired === 'true') {
            const now = new Date();
            const futureDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
            rallyPredictionDocs = await rallyPredictionRepository.getRallyPredictionsByExpirationDateRange(
                now,
                futureDate
            );
        } else {
            rallyPredictionDocs = await rallyPredictionRepository.getAllRallyPredictions();
        }

        // Filter by visibility unless includeHidden is true (for admin pages)
        let rallyPredictions: IRallyPrediction[] = rallyPredictionDocs.map(
            (doc) => doc.toObject() as IRallyPrediction
        );
        
        // Only include visible predictions for public API calls
        // Admin calls will pass includeHidden=true to see all predictions
        if (includeHidden !== 'true') {
            rallyPredictions = rallyPredictions.filter(
                (prediction) => prediction.isVisible !== false
            );
        }

        const successMsg = `Successfully fetched ${rallyPredictions.length} forecasts for user [${user._id}]`;
        console.info(successMsg);

        return res.status(200).json({
            success: true,
            message: successMsg,
            data: rallyPredictions,
        });
    } catch (error: any) {
        console.error("Error fetching forecasts:", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

export default authorize(handler);
