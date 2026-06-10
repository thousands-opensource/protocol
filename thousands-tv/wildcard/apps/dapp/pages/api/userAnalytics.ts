import { NextApiRequest, NextApiResponse } from "next";
import connectToDb from "@/db/connectToDb";
import {
    createUserLoginAnalyticsDB,
    findOneUserByQueryAuthorized,
} from "@repo/schemas";
import { WildcardApiResponse } from "@repo/interfaces";
import { getRequestIpAddress, sendApiResponse } from "@/utils/backend/apiUtil";
import { queryForAssociatedWallets } from "@/utils/userUtil";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "POST") {
        sendApiResponse(res, {
            success: false,
            err: `Method ${req.method} Not Allowed`,
        });
        return;
    }
    try {
        await connectToDb();
        const loginAnalyticsResponse: WildcardApiResponse = await userAnalytics(
            req,
            res
        );
        sendApiResponse(res, loginAnalyticsResponse);
    } catch (e: any) {
        const errMsg = `Error logging user analytics timestamp to DB ${e.message}`;
        sendApiResponse(res, {
            success: false,
            err: errMsg,
        });
        return;
    }
}

/**
 * Analytics log to send a log of the user's current login activity timestamp
 * @param req
 * @param res
 * @returns the updated mongodb response of the user's latest login activity
 */
async function userAnalytics(
    req: NextApiRequest,
    res: NextApiResponse
): Promise<WildcardApiResponse> {
    const { walletAddress }: { walletAddress: `0x${string}` } = req.body;
    const ipAddress = getRequestIpAddress(req);
    if (!walletAddress) {
        // if user does not have a wallet address create a new activity log timestamp
        return await logUserAnalytics(ipAddress);
    }

    // if user does have a wallet address make a query to mongo
    const query = queryForAssociatedWallets(walletAddress);
    let iUser = await findOneUserByQueryAuthorized(query);

    // if user does have a wallet address but does not have a discord id
    if (!iUser) {
        const logMsg = `User with address ${walletAddress} does not have a user profile, storing activity log timestamp instead`;
        console.log(logMsg);
        return await logUserAnalytics(ipAddress);
    }

    // store user analytics linked to discord
    const userId = iUser._id.toString();
    return await logUserAnalytics(ipAddress, userId);
}

/**
 * Stores a user's latest login activity to mongo
 * @param ip address - user's ip address
 * @param userId - the user's mongo id
 * @returns the updated mongodb response of the user's latest login activity
 */
async function logUserAnalytics(
    ipAddress: string,
    userId?: string
): Promise<WildcardApiResponse> {
    // return the updated mongodb response of the user's latest login activity
    const loggedUserDoc = await createUserLoginAnalyticsDB({
        userId,
        ipAddress,
    });
    if (!loggedUserDoc) {
        const errMsg = `Error logging user analytics timestamp to DB`;
        console.error(errMsg);
        return {
            success: false,
            err: errMsg,
        };
    }

    // return the updated mongodb response of the user's latest login activity
    return {
        success: true,
        data: loggedUserDoc.createdAt,
    };
}
