import { IMetric } from "@repo/interfaces";
import mongoose from "mongoose";

export default interface IMetricRepository {
    fetchMetrics(): Promise<IMetric[]>;
    fetchMetricsByCategory(category: string): Promise<IMetric[]>;
    bulkWriteMetrics(
        bulkWriteOps: mongoose.mongo.AnyBulkWriteOperation[]
    ): Promise<mongoose.mongo.BulkWriteResult>;
    insertManyMetrics(metrics: IMetric[]): Promise<IMetric[]>;
}
