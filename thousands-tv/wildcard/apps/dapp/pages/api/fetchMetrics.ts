import { NextApiRequest, NextApiResponse } from "next";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import { IMetric, IUser, IWideMetric } from "@repo/interfaces";
import { authorize } from "./middleware/authorization";
import { diContainer } from "@/inversify.config";
import IMetricRepository from "@/repositories/interfaces/IMetricRepository";
import IMetricCacheRepository from "@/repositories/interfaces/IMetricCacheRepository";
import { getSecondsRemainingTodayUTC } from "@/features/Metrics/metricsUtils";

async function handler(req: NextApiRequest, res: NextApiResponse, user: IUser) {
    if (req.method !== "GET") {
        sendApiResponse(res, {
            success: false,
            err: `Method ${req.method} Not Allowed`,
        });
        return;
    }
    try {
        const userId = user._id!.toString();
        const category = req.query.category as string;
        const format = req.query.format as string;
        if (!category || !format) {
            sendApiResponse(res, {
                success: false,
                err: `Missing query - category:${category}, format:${format}`,
            });
            return;
        }

        const metricCacheRepository = diContainer.get<IMetricCacheRepository>(
            "IMetricCacheRepository"
        );

        // check if exist in cache
        const hasCachedMetrics = await metricCacheRepository.hasMetrics(
            category
        );
        if (hasCachedMetrics) {
            const cachedMetrics = await metricCacheRepository.getMetrics(
                category
            );
            console.log("Successfully fetch cached metrics");
            sendApiResponse(res, { success: true, data: cachedMetrics });
            return;
        }

        const metricRepository =
            diContainer.get<IMetricRepository>("IMetricRepository");
        let metrics: IMetric[] | IWideMetric[] =
            await metricRepository.fetchMetricsByCategory(category);

        if (format === "wide") {
            console.log("Wide format: processing to work with wide format");
            // only working with 90 days so not "too" much data
            const allKeys = Array.from(new Set(metrics.map((m) => m.key)));

            let result: Record<string, any> = {};
            metrics.forEach((metric) => {
                const timestamp = metric.timestamp.toString();

                if (!result[timestamp]) {
                    result[timestamp] = { timestamp: metric.timestamp };
                    allKeys.forEach((key) => (result[timestamp][key] = null));
                }
                result[timestamp][metric.key] = metric.value;
            });

            metrics = Object.values(result);
        }

        // get remaining seconds of today in utc
        const ttlSeconds = getSecondsRemainingTodayUTC();
        // cache metrics if not cached
        const cached = await metricCacheRepository.setMetrics(
            category,
            metrics,
            ttlSeconds
        );
        if (cached) {
            console.log(`Metrics has been cached for category ${category}`);
        } else {
            console.log(`Failed to cache metrics for category ${category}`);
        }

        sendApiResponse(res, { success: true, data: metrics });
        return;
    } catch (e: any) {
        console.error(`Error fetching metrics for specific category`, e);
        sendApiResponse(res, {
            success: false,
            err: `Error fetching metrics for specific category ${e.message}`,
        });
        return;
    }
}

export default authorize(handler);
