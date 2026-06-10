import IClosedForecastStatsCacheRepository, {
    ClosedForecastStats,
} from "@/repositories/interfaces/IClosedForecastStatsCacheRepository";
import RedisClientManager, { RedisClientType } from "@/utils/backend/redis";
import { injectable } from "inversify";
import Redis from "ioredis";

/**
 * Redis implementation of the ClosedForecastStatsCacheRepository
 * Handles caching of closed forecast statistics for performance optimization
 */
@injectable()
export default class ClosedForecastStatsCacheRepository
    implements IClosedForecastStatsCacheRepository
{
    private readonly redisClient: Redis;
    private readonly keyPrefix: string = "forecast:stats:";
    // 7 days TTL by default
    private readonly defaultTtl: number = 60 * 60 * 24 * 7;

    constructor() {
        this.redisClient = RedisClientManager.getClient(
            RedisClientType.FORECAST_STATS
        );
    }

    /**
     * Creates a Redis key for forecast stats
     * @param rallyPredictionId - The ID of the rally prediction
     * @returns The formatted Redis key
     */
    private getRedisKey(rallyPredictionId: string): string {
        return `${this.keyPrefix}${rallyPredictionId}`;
    }

    /**
     * Get cached forecast stats
     * @param rallyPredictionId - The ID of the rally prediction
     * @returns The cached stats or null if not found
     */
    public async getStats(
        rallyPredictionId: string
    ): Promise<ClosedForecastStats | null> {
        try {
            const key = this.getRedisKey(rallyPredictionId);
            const value = await this.redisClient.get(key);

            if (!value) {
                console.log(
                    `forecast-cache: Cache miss for rallyPredictionId: ${rallyPredictionId}`
                );
                return null;
            }

            console.log(
                `forecast-cache: Cache hit for rallyPredictionId: ${rallyPredictionId}`
            );
            return JSON.parse(value) as ClosedForecastStats;
        } catch (error) {
            console.error(
                `forecast-cache: Error getting stats for ${rallyPredictionId}:`,
                error
            );
            return null;
        }
    }

    /**
     * Cache forecast stats
     * @param rallyPredictionId - The ID of the rally prediction
     * @param stats - The stats to cache
     * @param ttlSeconds - Time to live in seconds (optional)
     * @returns True if successful, false otherwise
     */
    public async setStats(
        rallyPredictionId: string,
        stats: ClosedForecastStats,
        ttlSeconds: number = this.defaultTtl
    ): Promise<boolean> {
        try {
            const key = this.getRedisKey(rallyPredictionId);
            const value = JSON.stringify(stats);

            // For resolved forecasts, we could even use no expiry since data won't change
            // But using TTL for safety and memory management
            await this.redisClient.set(key, value, "EX", ttlSeconds);

            console.log(
                `forecast-cache: Cached stats for rallyPredictionId: ${rallyPredictionId} with TTL: ${ttlSeconds}s`
            );
            return true;
        } catch (error) {
            console.error(
                `forecast-cache: Error caching stats for ${rallyPredictionId}:`,
                error
            );
            return false;
        }
    }

    /**
     * Delete cached forecast stats
     * @param rallyPredictionId - The ID of the rally prediction
     * @returns True if successful, false otherwise
     */
    public async deleteStats(rallyPredictionId: string): Promise<boolean> {
        try {
            const key = this.getRedisKey(rallyPredictionId);
            const result = await this.redisClient.del(key);

            console.log(
                `forecast-cache: Deleted cache for rallyPredictionId: ${rallyPredictionId}`
            );
            return result === 1;
        } catch (error) {
            console.error(
                `forecast-cache: Error deleting stats for ${rallyPredictionId}:`,
                error
            );
            return false;
        }
    }

    /**
     * Check if stats are cached
     * @param rallyPredictionId - The ID of the rally prediction
     * @returns True if cached, false otherwise
     */
    public async hasStats(rallyPredictionId: string): Promise<boolean> {
        try {
            const key = this.getRedisKey(rallyPredictionId);
            const exists = await this.redisClient.exists(key);
            return exists === 1;
        } catch (error) {
            console.error(
                `forecast-cache: Error checking existence for ${rallyPredictionId}:`,
                error
            );
            return false;
        }
    }

    /**
     * Get cache TTL for a specific forecast
     * @param rallyPredictionId - The ID of the rally prediction
     * @returns TTL in seconds, -1 if no expiry, -2 if key doesn't exist
     */
    public async getTtl(rallyPredictionId: string): Promise<number> {
        try {
            const key = this.getRedisKey(rallyPredictionId);
            return await this.redisClient.ttl(key);
        } catch (error) {
            console.error(
                `forecast-cache: Error getting TTL for ${rallyPredictionId}:`,
                error
            );
            return -2;
        }
    }
}
