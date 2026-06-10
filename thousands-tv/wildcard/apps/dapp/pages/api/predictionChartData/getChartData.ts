import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import { PredictionChartDataDoc } from "@repo/schemas";
import { IPredictionChartData, IUser } from "@repo/interfaces";
import IPredictionChartDataRepository from "@/repositories/interfaces/IPredictionChartDataRepository";
import { BackendApiResponse } from "@/types";
import { authorize } from "../middleware/authorization";

export interface PredictionChartDataApiResponse
    extends BackendApiResponse<IPredictionChartData[]> {
    data?: IPredictionChartData[] | null;
}

type RequestResponse = PredictionChartDataApiResponse;

interface RequestBody {
    rallyPredictionId: string;
    forecastEndDate: Date;
    timeWindowMinutes?: number;
    limit?: number;
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

        const { rallyPredictionId, forecastEndDate, timeWindowMinutes, limit } =
            req.body as RequestBody;

        if (!rallyPredictionId) {
            return res.status(400).json({
                success: false,
                message: "Missing required field: rallyPredictionId",
            });
        }

        if (!forecastEndDate) {
            return res.status(400).json({
                success: false,
                message: "Missing required field: forecastEndDate",
            });
        }

        //The forecast has ended if forecastEndDate is less than now
        const forecastEndDateObj = new Date(forecastEndDate);
        const isForecastEnded: boolean = forecastEndDateObj < new Date();

        const predictionChartDataRepository =
            diContainer.get<IPredictionChartDataRepository>(
                "IPredictionChartDataRepository"
            );

        let chartDataDocs: PredictionChartDataDoc[] = [];

        //If the Forecast has ended, then we want to use the Forecast end date
        const toTimestamp: Date | undefined = isForecastEnded ? forecastEndDateObj : undefined;

        console.log("isForecastEnded: ", isForecastEnded);
        if (!isForecastEnded && timeWindowMinutes) {
            const expandedTimeWindow = Math.max(timeWindowMinutes, 24 * 60);
            chartDataDocs =
                await predictionChartDataRepository.getRecentChartData(
                    rallyPredictionId,
                    expandedTimeWindow
                );
        } else {
            const startingPointForFromTimestamp: Date = isForecastEnded ? forecastEndDateObj : new Date();
            const fromTimestamp = limit
                ? new Date(startingPointForFromTimestamp.getTime() - 1 * 24 * 60 * 60 * 1000) //1 past day
                : undefined;
            chartDataDocs =
                await predictionChartDataRepository.getChartDataByRallyPredictionId(
                    rallyPredictionId,
                    limit,
                    fromTimestamp,
                    toTimestamp,
                );
        }

        let chartData: IPredictionChartData[] = chartDataDocs.map(
            (doc) => doc.toObject() as IPredictionChartData
        );

        // If no data in the requested time window, handle edge cases
        if (chartData.length === 0) {
            // Try to get the most recent historical data point
            const allTimeData =
                await predictionChartDataRepository.getChartDataByRallyPredictionId(
                    rallyPredictionId,
                    1 // Just get the most recent data point
                );

            if (allTimeData.length > 0) {
                // Data exists but outside time window - return last data point
                chartData = [allTimeData[0].toObject() as IPredictionChartData];
            }
            // If still no data, frontend will handle showing 50/50
        }

        return res.status(200).json({
            success: true,
            data: chartData,
        });
    } catch (error: any) {
        console.error("Error fetching prediction chart data:", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

export default authorize(handler);
