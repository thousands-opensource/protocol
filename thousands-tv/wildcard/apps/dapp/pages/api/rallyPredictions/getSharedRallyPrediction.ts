import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import { authorize } from "../middleware/authorization";
import { IUser } from "@repo/interfaces";
import IPredictionSharedCacheService, { SharedRallyPredictionData } from "@/services/interfaces/IPredictionSharedCacheService";
import { BackendApiResponse } from "@/types";
import axios from "axios";
import { getGetPredictionEndpoint } from "@/utils/environmentUtil";

/**
 * Backend API response interface for Get Shared Rally Prediction API
 */
export interface GetSharedRallyPredictionApiResponse
    extends BackendApiResponse<SharedRallyPredictionData> {
    data?: SharedRallyPredictionData | null;
}

type RequestResponse = GetSharedRallyPredictionApiResponse;

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

        const { predictionId } = req.body;

        if (!predictionId || typeof predictionId !== "string") {
            return res.status(400).json({
                success: false,
                message: "Missing or invalid prediction ID",
            });
        }

        const predictionSharedCacheService = diContainer.get<IPredictionSharedCacheService>(
            "IPredictionSharedCacheService"
        );

        let sharedPredictionData = await predictionSharedCacheService.getCachedSharedRallyPrediction(predictionId);

        if (!sharedPredictionData) {
            console.info(`Cache miss for shared rally prediction: ${predictionId} - fetching from external endpoint`);
            
            try {
                const externalEndpoint = getGetPredictionEndpoint();
                const response = await axios.post(externalEndpoint, {
                    predictionId: predictionId
                });

                if (response.data) {
                    const fullResponseData = response.data;
                    const haltedUntil = fullResponseData?.predictionStats?.haltedUntil || null;
                    
                    sharedPredictionData = {
                        haltedUntil: haltedUntil
                    };

                    await predictionSharedCacheService.cacheSharedRallyPrediction(predictionId, sharedPredictionData);
                } else {
                    console.error("Invalid response structure from external endpoint");
                    return res.status(500).json({
                        success: false,
                        message: "Invalid response from external prediction service",
                    });
                }
            } catch (externalError: any) {
                console.error("Error fetching from external endpoint:", externalError);
                return res.status(500).json({
                    success: false,
                    message: "Failed to fetch prediction data from external service",
                });
            }
        }

        const successMsg = `Successfully fetched shared rally prediction [${predictionId}] for user [${user._id}]`;
        console.info(successMsg);

        return res.status(200).json({
            success: true,
            message: successMsg,
            data: sharedPredictionData,
        });
    } catch (error: any) {
        console.error("Error fetching shared rally prediction:", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

export default authorize(handler);
