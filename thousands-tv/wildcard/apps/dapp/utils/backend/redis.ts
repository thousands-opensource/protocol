import Redis from "ioredis";
import {
    getRedisHost,
    getRedisPort,
    getRedisUsername,
    getRedisPassword,
    getEnvironment,
} from "@/utils/environmentUtilWCA";
import { Environment } from "@repo/interfaces";

/**
 * Client types for different Redis usages
 */
export enum RedisClientType {
    USER_SESSION = "userSession",
    FORECAST_STATS = "forecastStats",
    METRICS = "metrics",
    TOURNAMENTS = "tournaments",
    FRANCHISE = "franchise",
}

// Shared Redis clients store
let clients: Record<string, Redis> = {};

// Environment check
const isLocalEnv = getEnvironment() === Environment.LOCAL;

/**
 * Get Redis connection configuration based on environment
 * @returns Redis connection config
 */
const getRedisConfig = () =>
    isLocalEnv
        ? {} // Local defaults to localhost:6379
        : {
              host: getRedisHost(),
              port: Number(getRedisPort()),
              username: getRedisUsername(),
              password: getRedisPassword(),
              // Serverless-optimized settings
              maxRetriesPerRequest: 3,
              enableReadyCheck: false,
              reconnectOnError: () => false,
              connectTimeout: 5000,
              commandTimeout: 3000,
          };

/**
 * Redis Client Manager for connection management
 * Uses singleton pattern to reuse connections across serverless function invocations
 */
export class RedisClientManager {
    /**
     * Get a Redis client for a specific purpose
     * @param clientType - The type of client to get
     * @returns A Redis client instance
     */
    static getClient(clientType: RedisClientType): Redis {
        if (!clients[clientType]) {
            const config = getRedisConfig();

            clients[clientType] = new Redis(config);

            // Configure event handlers
            clients[clientType].on("connect", () => {
                console.log(
                    `Redis connected (${clientType}):`,
                    isLocalEnv ? "localhost" : config.host
                );
            });

            clients[clientType].on("error", (err) => {
                console.error(`Redis error (${clientType}):`, err);

                // In serverless environments, discard broken connections
                if (!isLocalEnv) {
                    this.closeClient(clientType);
                }
            });

            // Handle serverless environment cleanup
            if (typeof process !== "undefined") {
                process.on("beforeExit", () => {
                    this.closeAll();
                });
            }
        }

        return clients[clientType];
    }

    /**
     * Check if a specific Redis client is connected and ready
     * @param clientType - The type of client to check
     * @returns Boolean indicating connection status
     */
    static isClientConnected(clientType: RedisClientType): boolean {
        return !!clients[clientType] && clients[clientType].status === "ready";
    }

    /**
     * Close a specific Redis client connection
     * @param clientType - The type of client to close
     */
    static closeClient(clientType: RedisClientType): void {
        if (clients[clientType]) {
            clients[clientType].disconnect();
            delete clients[clientType];
        }
    }

    /**
     * Close all Redis client connections
     * Useful for testing or application shutdown
     */
    static closeAll(): void {
        Object.keys(clients).forEach((key) => {
            if (clients[key]) {
                clients[key].disconnect();
                delete clients[key];
            }
        });
    }
}

// Pre-initialized clients for specific connections
export const redisClient = {
    userSession: () =>
        RedisClientManager.getClient(RedisClientType.USER_SESSION),
};

export default RedisClientManager;
