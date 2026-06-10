export default interface IPredictionChartService {
    recordPricePoint(
        rallyPredictionId: string,
        newPrice: number,
        timestamp?: Date
    ): Promise<boolean>;
}
