import connectToDb from "@/db/connectToDb";
import { MAX_DAYS } from "@/features/Metrics/types";
import IMetricRepository from "@/repositories/interfaces/IMetricRepository";
import { IMetric } from "@repo/interfaces";
import { metricsModel } from "@repo/schemas";
import { injectable } from "inversify";
import mongoose, { FilterQuery } from "mongoose";

@injectable()
export default class MetricRepository implements IMetricRepository {
    async fetchMetrics(): Promise<IMetric[]> {
        await connectToDb();
        return await metricsModel.find({});
    }

    async fetchMetricsByCategory(category: string): Promise<IMetric[]> {
        await connectToDb();

        const now = new Date();
        const cutoff = new Date();
        // subtract 60 days
        cutoff.setDate(now.getDate() - MAX_DAYS);

        const filter: FilterQuery<IMetric> = {
            category,
            timestamp: { $gte: cutoff },
        };
        return await metricsModel.find(filter).sort({ timestamp: 1 });
    }

    async bulkWriteMetrics(
        bulkWriteOps: mongoose.mongo.AnyBulkWriteOperation[]
    ): Promise<mongoose.mongo.BulkWriteResult> {
        await connectToDb();
        return await metricsModel.bulkWrite(bulkWriteOps);
    }

    async insertManyMetrics(metrics: IMetric[]): Promise<IMetric[]> {
        await connectToDb();
        return await metricsModel.insertMany(metrics);
    }
}
