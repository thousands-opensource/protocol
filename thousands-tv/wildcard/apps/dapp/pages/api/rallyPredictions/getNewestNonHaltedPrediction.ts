import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import IRallyPredictionRepository from "@/repositories/interfaces/IRallyPredictionRepository";
import IPredictionSharedCacheService from "@/services/interfaces/IPredictionSharedCacheService";

interface GetNewestNonHaltedPredictionResponse {
    success: boolean;
    prediction: any | null;
    errorMessage?: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<GetNewestNonHaltedPredictionResponse>
) {
    if (req.method !== "GET") {
        return res.status(405).json({
            success: false,
            prediction: null,
            errorMessage: "Method not allowed",
        });
    }

    try {
        const rallyPredictionRepository = diContainer.get<IRallyPredictionRepository>("IRallyPredictionRepository");
        const predictionSharedCacheService = diContainer.get<IPredictionSharedCacheService>("IPredictionSharedCacheService");

        const allPredictions = await rallyPredictionRepository.getAllRallyPredictions();

        if (!allPredictions || allPredictions.length === 0) {
            return res.status(200).json({
                success: true,
                prediction: null,
            });
        }

        const now = new Date();
        const activePredictions = allPredictions.filter(prediction => {
            const endDate = new Date(prediction.endDate);
            return endDate > now;
        });

        if (activePredictions.length === 0) {
            return res.status(200).json({
                success: true,
                prediction: null,
            });
        }

        let newestNonHaltedPrediction = null;
        let newestDate: Date | null = null;

        for (const prediction of activePredictions) {
            try {
                const sharedData = await predictionSharedCacheService.getCachedSharedRallyPrediction(prediction._id.toString());

                let isHalted = false;

                if (sharedData?.haltedUntil) {
                    const haltedUntilDate = new Date(sharedData.haltedUntil);
                    isHalted = now < haltedUntilDate;
                }

                if (!isHalted) {
                    const predictionDate = new Date(prediction.startDate);

                    if (!newestNonHaltedPrediction || !newestDate || predictionDate > newestDate) {
                        newestNonHaltedPrediction = prediction;
                        newestDate = predictionDate;
                    }
                }
            } catch (error) {
                console.error(`Error checking prediction ${prediction._id}:`, error);
                const predictionDate = new Date(prediction.startDate);

                if (!newestNonHaltedPrediction || !newestDate || predictionDate > newestDate) {
                    newestNonHaltedPrediction = prediction;
                    newestDate = predictionDate;
                }
            }
        }

        return res.status(200).json({
            success: true,
            prediction: newestNonHaltedPrediction,
        });

    } catch (error) {
        console.error("Error fetching newest non-halted prediction:", error);
        return res.status(500).json({
            success: false,
            prediction: null,
            errorMessage: "Internal server error",
        });
    }
}
