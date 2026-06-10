import type { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import IRallyPredictionRepository from "@/repositories/interfaces/IRallyPredictionRepository";
import IPredictionSharedCacheService from "@/services/interfaces/IPredictionSharedCacheService";

interface NewestActivePredictionResponse {
    success: boolean;
    prediction?: any;
    message?: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<NewestActivePredictionResponse>
) {
    if (req.method !== "GET") {
        return res.status(405).json({ success: false, message: "Method not allowed" });
    }

    try {
        const rallyPredictionRepository = diContainer.get<IRallyPredictionRepository>(
            "IRallyPredictionRepository"
        );
        const predictionSharedCacheService = diContainer.get<IPredictionSharedCacheService>(
            "IPredictionSharedCacheService"
        );

        const allPredictions = await rallyPredictionRepository.getAllRallyPredictions();
        
        const activePredictions = [];
        const now = new Date();
        
        for (const prediction of allPredictions) {
            const endDate = new Date(prediction.endDate);
            const startDate = new Date(prediction.startDate);
            const isActive = now >= startDate && now <= endDate;
            
            if (!isActive) {
                continue;
            }
            
            const sharedData = await predictionSharedCacheService.getCachedSharedRallyPrediction(prediction._id.toString());
            const isHalted = sharedData?.haltedUntil ? new Date() < new Date(sharedData.haltedUntil) : false;
            
            if (!isHalted) {
                activePredictions.push(prediction);
            }
        }
        
        const newestActivePrediction = activePredictions
            .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];

        if (!newestActivePrediction) {
            return res.status(200).json({ 
                success: true, 
                message: "No active predictions available" 
            });
        }

        res.status(200).json({ 
            success: true, 
            prediction: newestActivePrediction 
        });
    } catch (error) {
        console.error("Error fetching newest active prediction:", error);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
}
