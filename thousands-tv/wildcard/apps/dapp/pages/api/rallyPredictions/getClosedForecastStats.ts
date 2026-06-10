import { NextApiRequest, NextApiResponse } from "next";
import { authorize } from "@/pages/api/middleware/authorization";
import { diContainer } from "@/inversify.config";
import { Types } from "mongoose";
import IRallyPredictionRepository from "@/repositories/interfaces/IRallyPredictionRepository";
import IUserRallyPredictionRepository from "@/repositories/interfaces/IUserRallyPredictionRepository";
import IClosedForecastStatsCacheRepository from "@/repositories/interfaces/IClosedForecastStatsCacheRepository";

interface ClosedForecastStats {
    correctCalls: number;
    incorrectCalls: number;
    totalUsers: number; // Total unique users who participated
    totalWCEarned: number;
    duration: number; // in days
    startDate: Date;
    endDate: Date;
    largestCorrectCall: number;
    largestIncorrectCall: number;
    resolvedChoice: boolean | null;
    winnerText: string | null;
}

interface ApiResponse {
    success: boolean;
    message: string;
    data?: ClosedForecastStats;
}

/**
 * Get closed forecast statistics
 * @param req
 * @param res
 * @returns
 */
async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
    if (req.method !== "GET") {
        return res.status(405).json({
            success: false,
            message: "Method not allowed",
        });
    }

    try {
        const { rallyPredictionId } = req.query;

        if (!rallyPredictionId || typeof rallyPredictionId !== "string") {
            return res.status(400).json({
                success: false,
                message: "Rally prediction ID is required",
            });
        }

        // Get repositories
        const rallyPredictionRepository =
            diContainer.get<IRallyPredictionRepository>(
                "IRallyPredictionRepository"
            );
        const userRallyPredictionRepository =
            diContainer.get<IUserRallyPredictionRepository>(
                "IUserRallyPredictionRepository"
            );
        const cacheRepository =
            diContainer.get<IClosedForecastStatsCacheRepository>(
                "IClosedForecastStatsCacheRepository"
            );

        // Check cache first
        const cachedStats = await cacheRepository.getStats(rallyPredictionId);
        if (cachedStats) {
            return res.status(200).json({
                success: true,
                message: "Closed forecast stats retrieved from cache",
                data: cachedStats,
            });
        }

        // Get the rally prediction details
        const rallyPrediction =
            await rallyPredictionRepository.getRallyPredictionById(
                rallyPredictionId
            );

        if (!rallyPrediction) {
            return res.status(404).json({
                success: false,
                message: "Rally prediction not found",
            });
        }

        // Check if forecast is closed (resolved or past end date)
        const isResolved =
            rallyPrediction.resolvedChoice !== null &&
            rallyPrediction.resolvedChoice !== undefined;
        const isPastEndDate = new Date(rallyPrediction.endDate) < new Date();

        if (!isResolved && !isPastEndDate) {
            return res.status(400).json({
                success: false,
                message: "Forecast is not yet closed",
            });
        }

        // Get all user predictions for this forecast
        const userPredictions =
            await userRallyPredictionRepository.getUserRallyPredictionsByRallyPredictionId(
                rallyPredictionId
            );

        console.log(
            "forecast-log: Total user predictions found:",
            userPredictions.length
        );

        // Aggregate predictions by user to get total amounts per choice
        const userAggregates = new Map<
            string,
            { forAmount: number; againstAmount: number }
        >();

        let correctCalls = 0;
        let incorrectCalls = 0;
        userPredictions.forEach(
            (prediction: {
                userId: { toString: () => any };
                forOrAgainst: any;
                amount: number;
            }) => {
                const userId = prediction.userId.toString();
                if (!userAggregates.has(userId)) {
                    userAggregates.set(userId, {
                        forAmount: 0,
                        againstAmount: 0,
                    });
                }
                const userStats = userAggregates.get(userId)!;
                if (prediction.forOrAgainst) {
                    userStats.forAmount += prediction.amount;
                } else {
                    userStats.againstAmount += prediction.amount;
                }
                if (prediction.forOrAgainst === rallyPrediction.resolvedChoice)
                {
                    correctCalls++;
                }
                else
                {
                    incorrectCalls++;
                }
            }
        );

        console.log("forecast-debug: User aggregates:", {
            uniqueUsers: userAggregates.size,
            aggregates: Array.from(userAggregates.entries()).map(
                ([userId, data]) => ({
                    userId,
                    forAmount: data.forAmount,
                    againstAmount: data.againstAmount,
                    netPosition:
                        data.forAmount > data.againstAmount ? "for" : "against",
                })
            ),
        });

        // Calculate statistics
        let totalCreditsSpent = 0;
        let largestCorrectCall = 0;
        let largestIncorrectCall = 0;

        userAggregates.forEach(({ forAmount, againstAmount }, userId) => {
            const totalAmount = forAmount + againstAmount;
            totalCreditsSpent += totalAmount;

            if (isResolved) {
                // Determine user's net position and if they were correct
                let userCorrectAmount = 0;
                let userIncorrectAmount = 0;

                if (rallyPrediction.resolvedChoice === true) {
                    // Option B (for) won
                    userCorrectAmount = forAmount;
                    userIncorrectAmount = againstAmount;
                } else {
                    // Option A (against) won
                    userCorrectAmount = againstAmount;
                    userIncorrectAmount = forAmount;
                }

                // Count the user based on their net position
                if (userCorrectAmount > 0 && userIncorrectAmount === 0) {
                    // User only bet on the correct outcome
                    largestCorrectCall = Math.max(
                        largestCorrectCall,
                        userCorrectAmount
                    );
                } else if (userIncorrectAmount > 0 && userCorrectAmount === 0) {
                    // User only bet on the incorrect outcome
                    largestIncorrectCall = Math.max(
                        largestIncorrectCall,
                        userIncorrectAmount
                    );
                } else if (userCorrectAmount > userIncorrectAmount) {
                    // User bet on both but more on correct
                    largestCorrectCall = Math.max(
                        largestCorrectCall,
                        userCorrectAmount
                    );
                } else {
                    // User bet on both but more on incorrect
                    largestIncorrectCall = Math.max(
                        largestIncorrectCall,
                        userIncorrectAmount
                    );
                }
            }
        });

        // Calculate total WC earned - only if resolved
        let totalWCEarned = 0;
        if (isResolved && rallyPrediction.maxCreditSpend > 0) {
            const ratio = totalCreditsSpent / rallyPrediction.maxCreditSpend;
            totalWCEarned = rallyPrediction.wcAmount * ratio;

            console.log("forecast-debug: WC Calculation components:", {
                wcAmount: rallyPrediction.wcAmount,
                totalCreditsSpent,
                maxCreditSpend: rallyPrediction.maxCreditSpend,
                ratio: ratio,
                formula: "wcAmount * (totalCreditsSpent / maxCreditSpend)",
                result: totalWCEarned,
            });
        } else {
            console.log(
                "forecast-log: WC not calculated - forecast not resolved or maxCreditSpend is 0"
            );
        }

        // Calculate duration
        const startDate = new Date(rallyPrediction.startDate);
        const endDate = new Date(rallyPrediction.endDate);
        const duration = Math.ceil(
            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Determine winner text
        let winnerText: string | null = null;
        if (isResolved) {
            winnerText = rallyPrediction.resolvedChoice
                ? rallyPrediction.optionBText
                : rallyPrediction.optionAText;
        }

        const stats: ClosedForecastStats = {
            correctCalls,
            incorrectCalls,
            totalUsers: userAggregates.size,
            totalWCEarned: Math.round(totalWCEarned * 100) / 100, // Round to 2 decimal places
            duration,
            startDate: rallyPrediction.startDate,
            endDate: rallyPrediction.endDate,
            largestCorrectCall,
            largestIncorrectCall,
            resolvedChoice:
                rallyPrediction.resolvedChoice !== null &&
                rallyPrediction.resolvedChoice !== undefined
                    ? Boolean(rallyPrediction.resolvedChoice)
                    : null,
            winnerText,
        };

        console.log("forecast-debug: Final stats object:", stats);
        console.log(
            "forecast-log: Validation - Total users:",
            userAggregates.size,
            "= Correct:",
            correctCalls,
            "+ Incorrect:",
            incorrectCalls,
            "=",
            correctCalls + incorrectCalls
        );

        // Cache the stats if the forecast is resolved
        // Only cache resolved forecasts since their stats won't change
        if (isResolved && stats.resolvedChoice !== null) {
            const cached = await cacheRepository.setStats(
                rallyPredictionId,
                stats
            );
            if (cached) {
                console.log(
                    "forecast-log: Stats cached for resolved forecast",
                    rallyPredictionId
                );
            } else {
                console.warn(
                    "forecast-log: Failed to cache stats for",
                    rallyPredictionId
                );
            }
        } else {
            console.log(
                "forecast-log: Not caching - forecast not resolved yet",
                rallyPredictionId
            );
        }

        return res.status(200).json({
            success: true,
            message: "Closed forecast stats retrieved successfully",
            data: stats,
        });
    } catch (error) {
        console.error("Error fetching closed forecast stats:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}

export default authorize(handler);
