import { getDappApiKey, getDiscordBaseEndpoint } from "@/utils/environmentUtil";
import { TxnBundleRequest, WildcardApiResponse } from "@repo/interfaces";
import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";
import { WildcardAccountsApiResponse } from "@/types";

export function sendApiResponse(
    res: NextApiResponse,
    war: WildcardApiResponse
) {
    res.send(war);
}

/**
 * Send response with status code
 * @param res - NextApiResponse
 * @param war - WildcardApiResponse
 * @param statusCode - appropriate status code to send
 */
export function sendApiResponseWithStatusCode(
    res: NextApiResponse,
    war: WildcardApiResponse | WildcardAccountsApiResponse,
    statusCode: number = 200
) {
    res.status(statusCode).send(war);
}

/**
 * Get ip address from request
 * @param req - NextApiRequest
 */
export function getRequestIpAddress(req: NextApiRequest) {
    return (
        (req.headers["x-forwarded-for"] as string) ||
        req.socket.remoteAddress ||
        ""
    );
}

/**
 * Post a transaction bundle to the transaction queue service
 * @param txnBundleReqBody the transaction bundle request body
 * @returns
 */
export async function postTxnBundle(
    txnBundleReqBody: TxnBundleRequest
): Promise<WildcardApiResponse> {
    try {
        const botBaseEndpoint = getDiscordBaseEndpoint();
        const dappApiKey = getDappApiKey();
        const url = `${botBaseEndpoint}/api/txn_bundle`;
        const headers = { "x-api-key": dappApiKey };

        console.log(`POST txn bundle Endpoint: ${url}`);

        const response = await axios.post(url, txnBundleReqBody, { headers });

        console.log(
            `Post txn bundle response for User ID: ${txnBundleReqBody.userId} & Bundle Type: ${txnBundleReqBody.bundleType}. Response Status: ${response.status}`
        );

        if (response.status === 200) {
            const responseData = response.data.data;
            if (response.data.success) {
                return { success: true, data: responseData };
            } else {
                return {
                    success: false,
                    err: responseData.err || "Unknown error",
                };
            }
        } else {
            return {
                success: false,
                err: `Unexpected response status: ${response.status}`,
            };
        }
    } catch (e: any) {
        let errMsg: string;
        if (e.response) {
            errMsg = `Error response from server: ${
                e.response.data.err || e.response.statusText
            }`;
        } else if (e.request) {
            errMsg = `No response received from server: ${e.message}`;
        } else {
            errMsg = `Error in setting up the request: ${e.message}`;
        }
        console.error(errMsg);
        return { success: false, err: errMsg };
    }
}

/**
 * Get transaction bundle from the transaction queue service
 * @param endpoint the endpoint to get the transaction bundle from
 * @returns
 */
export async function getTxnBundle(
    endpoint: string
): Promise<WildcardApiResponse> {
    try {
        const botBaseEndpoint = getDiscordBaseEndpoint();
        const dappApiKey = getDappApiKey();
        const url = `${botBaseEndpoint}${endpoint}`;
        const headers = { "x-api-key": dappApiKey };

        console.log(`GET txn bundle Endpoint: ${endpoint}`);

        const response = await axios.get(url, { headers });

        console.log(
            `Get txn bundle response from Endpoint: ${endpoint}. Response Status: ${response.status}`
        );

        if (response.status === 200) {
            const responseData = response.data.data;
            if (response.data.success) {
                return { success: true, data: responseData };
            } else {
                return {
                    success: false,
                    err: responseData.err || "Unknown error",
                };
            }
        } else {
            return {
                success: false,
                err: `Unexpected response status: ${response.status}`,
            };
        }
    } catch (e: any) {
        let errMsg: string;
        if (e.response) {
            errMsg = `Error response from server: ${
                e.response.data.err || e.response.statusText
            }`;
        } else if (e.request) {
            errMsg = `No response received from server: ${e.message}`;
        } else {
            errMsg = `Error in setting up the request: ${e.message}`;
        }
        console.error(errMsg);
        return { success: false, err: errMsg };
    }
}

/**
 * Sanitizes input values in an object by trimming whitespace from strings and sanitizing arrays of strings.
 *
 * - If the value is a string, it trims any leading or trailing whitespace.
 * - If the value is an array, it recursively sanitizes each string element in the array.
 * - Other types of values are left unchanged.
 *
 * @param {Record<string, any>} input - The input object containing key-value pairs to be sanitized.
 * @returns {Record<string, any>} - A new object with sanitized values.
 */
export const sanitizeInput = (
    input: Record<string, any>
): Record<string, any> => {
    const sanitizedInput: Record<string, any> = {};

    Object.keys(input).forEach((key) => {
        const value = input[key];
        if (typeof value === "string") {
            sanitizedInput[key] = value.trim();
        } else if (Array.isArray(value)) {
            sanitizedInput[key] = value.map((item) =>
                typeof item === "string" ? item.trim() : item
            );
        } else {
            sanitizedInput[key] = value;
        }
    });

    return sanitizedInput;
};

export const API_RESPONSE_STATUS_CODE_404_MESSAGE = "Resource not found";
