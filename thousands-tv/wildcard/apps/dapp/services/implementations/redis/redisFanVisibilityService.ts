import { injectable } from "inversify";
import "reflect-metadata";
import Redis from "ioredis";
import { Buffer } from "buffer";
import IFanVisibilityService, { FanfareEffect, BackLogEvent } from "@/services/interfaces/iFanVisibilityService";
import {
    getRedisHost,
    getRedisPassword,
    getRedisPort,
    getRedisUsername,
} from "@/utils/environmentUtilWCA";

//vendorEventId is the Beamable eventId, not our internal eventId
@injectable()
export default class RedisFanVisibilityService implements IFanVisibilityService {
    async sendFanVisibilityEvent(vendorEventId: string, eventType: string, fanfareEffect: FanfareEffect): Promise<Boolean> {

        const redisClient = new Redis({
            host: getRedisHost(),
            port: Number(getRedisPort()),
            username: getRedisUsername(),
            password: getRedisPassword(),
        });

        redisClient.on("connect", () => {
            console.log("sendFanVisibilityEvent: Redis client connected");
        });

        redisClient.on("ready", () => {
            console.log("sendFanVisibilityEvent: Redis client ready to execute commands");
        });

        redisClient.on("error", (error) => {
            console.log("sendFanVisibilityEvent: Redis client encountered an error:", error);
        });

        if (!redisClient) {
            console.log("sendFanVisibilityEvent: Error setting up Redis Client");
            return false;
        }

        const key: string = `backlog-${vendorEventId}`;

        const payloadJsonString: string = JSON.stringify(fanfareEffect);
        const payloadBase64String: string = Buffer.from(payloadJsonString, 'binary').toString('base64');

        const backLogEvent: BackLogEvent = {
            type: eventType,
            payload: payloadBase64String
        };

        console.log(backLogEvent);

        const addedKeyValueToRedis = await redisClient.lpush(key, JSON.stringify(backLogEvent));

        if (!addedKeyValueToRedis) {
            console.log("sendFanVisibilityEvent: Error adding value to Redis");
        }

        await redisClient.quit();

        return true;
    }

}