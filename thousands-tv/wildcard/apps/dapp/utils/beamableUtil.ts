import axios from "axios";
import Redis from "ioredis";
import { v4 as uuidv4 } from "uuid";
import { NextApiResponse } from "next";
import {
    getBeamApiUrl,
    getBeamCid,
    getBeamPid,
} from "@/utils/environmentUtilWCA";

export const BEAM_API_URL = getBeamApiUrl();
export const BEAM_CID = getBeamCid();
export const BEAM_PID = getBeamPid();
export const BEAM_SCOPE = `${BEAM_CID}.${BEAM_PID}`;

/**
 * Validates the Beamable access token by making a request to the Beamable API.
 * @async
 * @param {string} accessToken - The Beamable access token to validate.
 * @returns {Promise<Object>} A promise that resolves to an object containing the validated token and the gamer tag.
 */
export async function validateBeamableToken(accessToken: string) {
    try {
        const authResponse = await axios.get(
            `${BEAM_API_URL}/basic/auth/token?token=${accessToken}`,
            {
                headers: {
                    "X-DE-SCOPE": BEAM_SCOPE,
                    "Content-Type": "application/json",
                },
            }
        );

        return {
            success: true,
            data: {
                token: authResponse.data.token,
                gamerTag: authResponse.data.gamerTag,
            },
            message: "Token is valid",
        };
    } catch (error: any) {
        console.error(
            "Error authenticating user:",
            error.response ? error.response.data : error
        );
        return {
            success: false,
            data: null,
            message: "Failed to validate Beamable session token",
        };
    }
}

/**
 * Generate a random code using UUID v4. (GUID)
 * @returns - random code
 */
export function generateGUID(): string {
    const uuid = uuidv4();
    return uuid;
}

/**
 * Adds a key-value pair to Redis and sets an expiry time for the key.
 * @param key - The key for the Redis entry.
 * @param value - The value to be associated with the key.
 * @param expiry - The expiry time in seconds for the key. (Optional)
 */
export async function addKeyValueToRedis(
    redis: Redis,
    key: string,
    value: string,
    expiry = 0
): Promise<boolean> {
    try {
        await redis.set(key, value);

        if (expiry > 0) {
            await redis.expire(key, expiry);
        }
        return true;
    } catch (error) {
        console.error(`Error adding key-value to Redis: ${error}`);
        return false;
    }
}

export function sendErrorResponse(
    res: NextApiResponse,
    statusCode: number,
    errMsg: string
) {
    console.error(errMsg);
    return res.status(statusCode).json({ success: false, message: errMsg });
}
