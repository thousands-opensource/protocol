import { injectable } from "inversify";
import Redis from "ioredis";
import { 
    getRedisHost, 
    getRedisPassword, 
    getRedisPort, 
    getRedisUsername 
} from "@/utils/environmentUtilWCA";
import IPredictionSharedCacheService, { SharedRallyPredictionData } from "@/services/interfaces/IPredictionSharedCacheService";

@injectable()
export default class RedisPredictionSharedCacheService implements IPredictionSharedCacheService {
    private redis: Redis;
    private readonly CACHE_KEY_PREFIX = "prediction-shared-rally-prediction";
    private readonly CACHE_TTL_SECONDS = 60 * 30; // 30 minutes

    constructor() {
        this.redis = new Redis({
            host: getRedisHost(),
            port: Number(getRedisPort()),
            username: getRedisUsername(),
            password: getRedisPassword(),
        });

        this.redis.on("error", (error) => {
            console.error("Redis prediction shared cache client error:", error);
        });
    }

    private getCacheKey(forecastId: string): string {
        return `${this.CACHE_KEY_PREFIX}-${forecastId}`;
    }

    async getCachedSharedRallyPrediction(forecastId: string): Promise<SharedRallyPredictionData | null> {
        try {
            const cacheKey = this.getCacheKey(forecastId);
            const cachedData = await this.redis.get(cacheKey);
            
            if (cachedData) {
                console.info(`Cache hit for shared rally prediction: ${forecastId}`);
                const parsed = JSON.parse(cachedData) as SharedRallyPredictionData;
                return parsed;
            }
            
            console.info(`Cache miss for shared rally prediction: ${forecastId}`);
            return null;
        } catch (error) {
            console.error("Error getting cached shared rally prediction:", error);
            return null;
        }
    }

    async cacheSharedRallyPrediction(forecastId: string, data: SharedRallyPredictionData): Promise<void> {
        try {
            const cacheKey = this.getCacheKey(forecastId);
            await this.redis.setex(cacheKey, this.CACHE_TTL_SECONDS, JSON.stringify(data));
            console.info(`Cached shared rally prediction for forecast: ${forecastId} (TTL: ${this.CACHE_TTL_SECONDS}s)`);
        } catch (error) {
            console.error("Error caching shared rally prediction:", error);
        }
    }

    async clearSharedRallyPredictionCache(forecastId: string): Promise<void> {
        try {
            const cacheKey = this.getCacheKey(forecastId);
            const deleted = await this.redis.del(cacheKey);
            
            if (deleted > 0) {
                console.info(`Cleared shared rally prediction cache for forecast: ${forecastId}`);
            } else {
                console.info(`No shared rally prediction cache found for forecast: ${forecastId}`);
            }
        } catch (error) {
            console.error("Error clearing shared rally prediction cache:", error);
        }
    }

    async clearAllSharedRallyPredictionCache(): Promise<void> {
        try {
            const pattern = `${this.CACHE_KEY_PREFIX}-*`;
            const keys = await this.redis.keys(pattern);
            
            if (keys.length > 0) {
                await this.redis.del(...keys);
                console.info(`Cleared all shared rally prediction cache: deleted ${keys.length} keys`);
            } else {
                console.info("No shared rally prediction cache keys found to clear");
            }
        } catch (error) {
            console.error("Error clearing all shared rally prediction cache:", error);
        }
    }

    async disconnect(): Promise<void> {
        try {
            await this.redis.quit();
        } catch (error) {
            console.error("Error disconnecting Redis prediction shared cache client:", error);
        }
    }
}
