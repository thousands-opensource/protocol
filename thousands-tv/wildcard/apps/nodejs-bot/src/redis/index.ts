import {
    getRedisHost,
    getRedisPassword,
    getRedisPort,
    getRedisUsername,
} from "@src/util/environmentUtil";
import RedisClient from "ioredis";

let redisConnected = false; // Flag to indicate Redis connection status

// Creating a new Redis client
const redisClient = new RedisClient({
    host: getRedisHost(),
    port: getRedisPort(),
    username: getRedisUsername(),
    password: getRedisPassword(),
});

redisClient.on("connect", () => {
    console.log("Connected to Redis");
    redisConnected = true;
});

redisClient.on("error", (err: Error) => {
    console.log("Redis error:", err);
    redisConnected = false;
});

export { redisClient, redisConnected };
