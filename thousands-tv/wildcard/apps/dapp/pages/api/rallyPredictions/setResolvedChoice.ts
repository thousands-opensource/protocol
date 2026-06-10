import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import { authorize } from "../middleware/authorization";
import { RallyPredictionDoc } from "@repo/schemas";
import { IUser } from "@repo/interfaces";
import IRallyPredictionRepository from "@/repositories/interfaces/IRallyPredictionRepository";
import IUserRallyPredictionRepository from "@/repositories/interfaces/IUserRallyPredictionRepository";
import IUserInsightScoreRepository from "@/repositories/interfaces/IUserInsightScoreRepository";
import ILeaderboardCacheService from "@/services/interfaces/ILeaderboardCacheService";
import IPredictionSharedCacheService from "@/services/interfaces/IPredictionSharedCacheService";
import { IUserInsightScoreService } from "@/services/implementations/UserInsightScoreService";
import { BackendApiResponse } from "@/types";

export interface SetResolvedChoiceApiResponse
    extends BackendApiResponse<RallyPredictionDoc> {
    data?: RallyPredictionDoc | null;
}

type RequestResponse = SetResolvedChoiceApiResponse;

async function calculateInsightScoresForRally(rallyPredictionId: string, actualOutcome: boolean): Promise<void> {
    const userRallyPredictionRepository = diContainer.get<IUserRallyPredictionRepository>(
        "IUserRallyPredictionRepository"
    );
    const userInsightScoreRepository = diContainer.get<IUserInsightScoreRepository>(
        "IUserInsightScoreRepository"
    );

    const userPredictions = await userRallyPredictionRepository.getUserRallyPredictionsByRallyPredictionId(rallyPredictionId);

    console.info(`Found ${userPredictions.length} user predictions for rally ${rallyPredictionId}`);

    for (const prediction of userPredictions) {
        try {
            const existingScore = await userInsightScoreRepository.getUserInsightScoreByUserRallyPredictionId(
                prediction._id!.toString()
            );

            if (existingScore) {
                continue;
            }

            const userPrediction = prediction.forOrAgainst;
            const wasCorrect = userPrediction === actualOutcome;
            const confidence = prediction.price;
            const predictionAmount = prediction.amount;

            const pointsEarned = wasCorrect ? Math.round(predictionAmount / confidence) : 0;

            const totalPoints = pointsEarned;

            await userInsightScoreRepository.addUserInsightScore(
                prediction.userId.toString(),
                rallyPredictionId,
                prediction._id!.toString(),
                totalPoints,
                wasCorrect,
                predictionAmount,
                confidence,
                userPrediction,
                actualOutcome
            );

        } catch (error) {
            console.error(`Error calculating InsightScore for user prediction ${prediction._id}:`, error);
        }
    }

    console.info('Updating leaderboard ranks after insight score calculations...');
    try {
        const leaderboardCacheService = diContainer.get<ILeaderboardCacheService>(
            "ILeaderboardCacheService"
        );

        const predictionSharedCacheService = diContainer.get<IPredictionSharedCacheService>(
            "IPredictionSharedCacheService"
        );

        const userInsightScoreService = diContainer.get<IUserInsightScoreService>("IUserInsightScoreService");
        const { totalUsers, updatedUsers, ranksUpdated } = await userInsightScoreService.refreshAllUserScoresWithDecay();

        if (ranksUpdated) {
            await predictionSharedCacheService.clearSharedRallyPredictionCache(rallyPredictionId);
            console.info(`Successfully updated leaderboard ranks and summaries for ${updatedUsers}/${totalUsers} users with decay applied`);
        } else {
            console.error('Failed to update leaderboard ranks');
        }
    } catch (error) {
        console.error('Error updating leaderboard ranks:', error);
    }
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

        const { rallyPredictionId, resolvedChoice } = req.body;

        if (!rallyPredictionId || resolvedChoice === undefined) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: rallyPredictionId, resolvedChoice",
            });
        }

        const rallyPredictionRepository = diContainer.get<IRallyPredictionRepository>(
            "IRallyPredictionRepository"
        );

        const existingRallyPrediction = await rallyPredictionRepository.getRallyPredictionById(rallyPredictionId);

        if (!existingRallyPrediction) {
            return res.status(404).json({
                success: false,
                message: "Rally prediction not found",
            });
        }

        if ((existingRallyPrediction as any).resolvedChoice !== undefined && (existingRallyPrediction as any).resolvedChoice !== null) {
            return res.status(400).json({
                success: false,
                message: "Resolved choice has already been set and cannot be changed",
            });
        }

        const rallyPredictionDoc: RallyPredictionDoc | null =
            await rallyPredictionRepository.updateRallyPrediction(rallyPredictionId, {
                resolvedChoice
            } as any);

        if (!rallyPredictionDoc) {
            return res.status(500).json({
                success: false,
                message: "Failed to set resolved choice",
            });
        }

        /*
        try {
            await calculateInsightScoresForRally(rallyPredictionId, resolvedChoice);
            console.info(`Successfully calculated InsightScores for rally prediction [${rallyPredictionId}]`);
        } catch (error) {
            console.error(`Error calculating InsightScores for rally prediction [${rallyPredictionId}]:`, error);
        }
        */

        const successMsg = `Successfully set resolved choice for rally prediction [${rallyPredictionDoc._id}] to [${resolvedChoice}] by user [${user._id}]`;
        console.info(successMsg);

        return res.status(200).json({
            success: true,
            message: successMsg,
            data: rallyPredictionDoc,
        });
    } catch (error: any) {
        console.error("Error setting resolved choice:", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

export default authorize(handler);
