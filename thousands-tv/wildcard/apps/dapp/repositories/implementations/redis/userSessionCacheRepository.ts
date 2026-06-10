import IUserSessionCacheRepository from "@/repositories/interfaces/IUserSessionCacheRepository";
import RedisClientManager, { RedisClientType } from "@/utils/backend/redis";
import { UserSession } from "@repo/interfaces";
import { injectable } from "inversify";
import Redis from "ioredis";

/**
 * Redis implementation of the UserSessionCacheRepository
 * Handles storing and retrieving user sessions with authentication data in Redis
 */
@injectable()
export default class UserSessionCacheRepository
    implements IUserSessionCacheRepository
{
    private readonly redisClient: Redis;
    private readonly keyPrefix: string = "user-session:";
    private readonly defaultTtl: number = 60 * 60 * 24; // 24 hours in seconds

    constructor() {
        this.redisClient = RedisClientManager.getClient(
            RedisClientType.USER_SESSION
        );
    }

    /**
     * Creates a Redis key for a user session
     * @param userId - The ID of the user
     * @returns The formatted Redis key
     */
    private getRedisKey(userId: string): string {
        return `${this.keyPrefix}${userId}`;
    }

    /**
     * Stores a user session in Redis cache
     * @param userId - The ID of the user
     * @param userSession - The user session data with authentication info
     * @param ttlSeconds - Time to live in seconds (optional)
     * @returns Promise resolving to true if successful, false otherwise
     */
    public async storeUserSession(
        userId: string,
        userSession: UserSession,
        ttlSeconds: number = this.defaultTtl
    ): Promise<boolean> {
        try {
            const key = this.getRedisKey(userId);
            const value = JSON.stringify(userSession);

            await this.redisClient.set(key, value, "EX", ttlSeconds);
            console.log(`[Redis] Stored user session for user: ${userId}`);
            return true;
        } catch (error) {
            console.error("Failed to store user session in Redis:", error);
            return false;
        }
    }

    /**
     * Retrieves a user session from Redis cache
     * @param userId - The ID of the user
     * @returns Promise resolving to the user session or null if not found
     */
    public async getUserSession(userId: string): Promise<UserSession | null> {
        try {
            const key = this.getRedisKey(userId);
            const value = await this.redisClient.get(key);

            if (!value) {
                return null;
            }

            return JSON.parse(value) as UserSession;
        } catch (error) {
            console.error("Failed to retrieve user session from Redis:", error);
            return null;
        }
    }

    /**
     * Removes a user session from Redis cache
     * @param userId - The ID of the user
     * @returns Promise resolving to true if successful, false otherwise
     */
    public async removeUserSession(userId: string): Promise<boolean> {
        try {
            const key = this.getRedisKey(userId);
            await this.redisClient.del(key);
            console.log(`[Redis] Removed user session for user: ${userId}`);
            return true;
        } catch (error) {
            console.error("Failed to remove user session from Redis:", error);
            return false;
        }
    }
}
