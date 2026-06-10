import { injectable, inject } from "inversify";
import IPredictionChartService from "../interfaces/IPredictionChartService";
import type IPredictionChartDataRepository from "@/repositories/interfaces/IPredictionChartDataRepository";

@injectable()
class PredictionChartService implements IPredictionChartService {

    constructor(
        @inject("IPredictionChartDataRepository")
        private predictionChartDataRepository: IPredictionChartDataRepository
    ) { }

    async recordPricePoint(
        rallyPredictionId: string,
        newPrice: number,
        timestamp: Date = new Date()
    ): Promise<boolean> {
        try {
            const result = await this.predictionChartDataRepository.addChartDataPoint(
                rallyPredictionId,
                timestamp,
                newPrice
            );
            return result !== null;
        } catch (error) {
            console.error("Error recording price data point:", error);
            return false;
        }
    }
}

export default PredictionChartService;
