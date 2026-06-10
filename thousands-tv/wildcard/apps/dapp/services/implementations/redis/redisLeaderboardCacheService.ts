import { injectable } from "inversify";
import Redis from "ioredis";
import { 
    getRedisHost, 
    getRedisPassword, 
    getRedisPort, 
    getRedisUsername 
} from "@/utils/environmentUtilWCA";
import { LeaderboardEntry } from "@/pages/api/userInsightScores/getInsightScoreLeaderboard";
import ILeaderboardCacheService from "@/services/interfaces/ILeaderboardCacheService";

@injectable()
export default class RedisLeaderboardCacheService implements ILeaderboardCacheService {
    private redis: Redis;
    private readonly CACHE_KEY_PREFIX = "leaderboard:insight-score";
    private readonly CACHE_TTL_SECONDS = 60 * 60; // 1 hour

    constructor() {
        this.redis = new Redis({
            host: getRedisHost(),
            port: Number(getRedisPort()),
            username: getRedisUsername(),
            password: getRedisPassword(),
        });

        this.redis.on("error", (error) => {
            console.error("Redis leaderboard cache client error:", error);
        });
    }

    private getCacheKey(topCount: number): string {
        return `${this.CACHE_KEY_PREFIX}:top:${topCount}`;
    }

    private getCurrentUserCacheKey(userId: string): string {
        return `${this.CACHE_KEY_PREFIX}:current-user:${userId}`;
    }

    async getCachedLeaderboard(topCount: number): Promise<LeaderboardEntry[] | null> {
        try {
            const cacheKey = this.getCacheKey(topCount);
            const cachedData = await this.redis.get(cacheKey);
            
            if (cachedData) {
                console.info(`Cache hit for leaderboard with top ${topCount}`);
                return JSON.parse(cachedData) as LeaderboardEntry[];
            }
            
            console.info(`Cache miss for leaderboard with top ${topCount}`);
            return null;
        } catch (error) {
            console.error("Error getting cached leaderboard:", error);
            return null;
        }
    }

    async cacheLeaderboard(topCount: number, leaderboard: LeaderboardEntry[]): Promise<void> {
        try {
            const cacheKey = this.getCacheKey(topCount);
            await this.redis.setex(cacheKey, this.CACHE_TTL_SECONDS, JSON.stringify(leaderboard));
            console.info(`Cached leaderboard with top ${topCount} for ${this.CACHE_TTL_SECONDS} seconds`);
        } catch (error) {
            console.error("Error caching leaderboard:", error);
        }
    }

    async getCachedCurrentUserEntry(userId: string): Promise<LeaderboardEntry | null> {
        try {
            const cacheKey = this.getCurrentUserCacheKey(userId);
            const cachedData = await this.redis.get(cacheKey);
            
            if (cachedData) {
                console.info(`Cache hit for current user entry: ${userId}`);
                return JSON.parse(cachedData) as LeaderboardEntry;
            }
            
            return null;
        } catch (error) {
            console.error("Error getting cached current user entry:", error);
            return null;
        }
    }

    async cacheCurrentUserEntry(userId: string, userEntry: LeaderboardEntry): Promise<void> {
        try {
            const cacheKey = this.getCurrentUserCacheKey(userId);
            await this.redis.setex(cacheKey, this.CACHE_TTL_SECONDS, JSON.stringify(userEntry));
            console.info(`Cached current user entry for user: ${userId}`);
        } catch (error) {
            console.error("Error caching current user entry:", error);
        }
    }

    async clearLeaderboardCache(): Promise<void> {
        try {
            const pattern = `${this.CACHE_KEY_PREFIX}:*`;
            const keys = await this.redis.keys(pattern);
            
            if (keys.length > 0) {
                await this.redis.del(...keys);
                console.info(`Cleared leaderboard cache: deleted ${keys.length} keys`);
            } else {
                console.info("No leaderboard cache keys found to clear");
            }
        } catch (error) {
            console.error("Error clearing leaderboard cache:", error);
        }
    }

    async disconnect(): Promise<void> {
        try {
            await this.redis.quit();
        } catch (error) {
            console.error("Error disconnecting Redis leaderboard cache client:", error);
        }
    }
}
