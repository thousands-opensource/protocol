import { PredictionChartDataDoc } from "@repo/schemas";

export default interface IPredictionChartDataRepository {
    addChartDataPoint(
        rallyPredictionId: string,
        timestamp: Date,
        price: number
    ): Promise<PredictionChartDataDoc | null>;

    getChartDataByRallyPredictionId(
        rallyPredictionId: string,
        limit?: number,
        fromTimestamp?: Date,
        toTimestamp?: Date
    ): Promise<PredictionChartDataDoc[]>;

    getRecentChartData(
        rallyPredictionId: string,
        timeWindowMinutes: number
    ): Promise<PredictionChartDataDoc[]>;
}
