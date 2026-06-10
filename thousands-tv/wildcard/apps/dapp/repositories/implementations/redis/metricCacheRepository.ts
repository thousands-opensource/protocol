import IMetricCacheRepository from "@/repositories/interfaces/IMetricCacheRepository";
import RedisClientManager, { RedisClientType } from "@/utils/backend/redis";
import { IMetric, IWideMetric } from "@repo/interfaces";
import { injectable } from "inversify";
import Redis from "ioredis";

@injectable()
export default class MetricCacheRepository implements IMetricCacheRepository {
    private readonly redisClient: Redis;
    private readonly keyPrefix: string = "metrics:category:";
    // 1 days TTL by default
    private readonly defaultTtl: number = 60 * 60 * 24;

    constructor() {
        this.redisClient = RedisClientManager.getClient(
            RedisClientType.METRICS
        );
    }

    private getRedisKey(category: string): string {
        return `${this.keyPrefix}${category}`;
    }

    public async getMetrics(
        category: string
    ): Promise<IMetric[] | IWideMetric[]> {
        try {
            const key = this.getRedisKey(category);
            const value = await this.redisClient.get(key);

            if (!value) {
                console.log("Cache miss for this metric in this category");
                return [];
            }

            return JSON.parse(value);
        } catch (e: any) {
            console.error("Error failed to get category for this metrics", e);
            return [];
        }
    }

    public async setMetrics(
        category: string,
        metrics: IMetric[] | IWideMetric[],
        ttlSeconds: number = this.defaultTtl
    ): Promise<boolean> {
        try {
            const key = this.getRedisKey(category);
            const value = JSON.stringify(metrics);

            await this.redisClient.set(key, value, "EX", ttlSeconds);
            return true;
        } catch (error) {
            console.error(
                `Error failed to cache specific category for metrics`,
                error
            );
            return false;
        }
    }

    public async hasMetrics(category: string): Promise<boolean> {
        try {
            const key = this.getRedisKey(category);
            const exists = await this.redisClient.exists(key);
            return exists === 1;
        } catch (e) {
            console.error(
                `Error failed to check whether metric category exist in cache`,
                e
            );
            return false;
        }
    }
}
