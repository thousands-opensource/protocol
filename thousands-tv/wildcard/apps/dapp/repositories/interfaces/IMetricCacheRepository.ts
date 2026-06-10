import { IMetric, IWideMetric } from "@repo/interfaces";

export default interface IMetricCacheRepository {
    getMetrics(category: string): Promise<IMetric[] | IWideMetric[]>;

    setMetrics(
        category: string,
        metrics: IMetric[] | IWideMetric[],
        ttlSeconds?: number
    ): Promise<boolean>;

    hasMetrics(category: string): Promise<boolean>;
}
