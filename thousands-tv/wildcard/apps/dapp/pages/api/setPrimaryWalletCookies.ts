import { NextApiRequest, NextApiResponse } from "next";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import {
    ADDRESS_COOKIE,
    MSG_COOKIE,
    PRIMARY_ADDRESS_COOKIE,
    PRIMARY_MSG_COOKIE,
    PRIMARY_SIG_COOKIE,
    SIG_COOKIE,
    setCookieValue,
} from "@/utils/oauthUtil";
import { WildcardApiResponse } from "@repo/interfaces";
import Cookies from "cookies";
import { ONE_WEEK_MS } from "@/constants/constants";
import { authorize } from "./middleware/authorization";
import { IUser } from "@repo/interfaces";
import { getAllAssociatedWalletsForUser } from "@/utils/userUtil";

/**
 * NextJS API Route Handler - POST Request only
 * @param req: request data via API Route
 * @param res: response data via API Route
 */
async function handler(req: NextApiRequest, res: NextApiResponse, user: IUser) {
    if (req.method !== "POST") {
        sendApiResponse(res, {
            success: false,
            err: `Method ${req.method} Not Allowed`,
        });
        return;
    }

    try {
        const war: WildcardApiResponse = setPrimaryWallet(req, res, user);
        sendApiResponse(res, war);
        return;
    } catch (e: any) {
        console.error(`Error setting primary wallet address.`, e);
        sendApiResponse(res, {
            success: false,
            err: `Error setting primary wallet address ${e.message}`,
        });
        return;
    }
}

function setPrimaryWallet(
    req: NextApiRequest,
    res: NextApiResponse,
    user: IUser
): WildcardApiResponse {
    // copy over primary wallet cookies
    const currentSigCookie = req.cookies[SIG_COOKIE];
    const currentAddressCookie = req.cookies[ADDRESS_COOKIE];
    const currentMsgCookie = req.cookies[MSG_COOKIE];

    const cookies = new Cookies(req, res);
    // If no primary cookies are set, then set them
    if (!currentSigCookie || !currentAddressCookie || !currentMsgCookie) {
        return {
            success: false,
            err: "Missing Credentials. Connect to primary wallet and Login to link and additional wallet.",
        };
    }

    setCookieValue(PRIMARY_SIG_COOKIE, currentSigCookie, cookies, ONE_WEEK_MS);
    setCookieValue(
        PRIMARY_ADDRESS_COOKIE,
        currentAddressCookie,
        cookies,
        ONE_WEEK_MS
    );
    setCookieValue(PRIMARY_MSG_COOKIE, currentMsgCookie, cookies, ONE_WEEK_MS);

    const associatedAddresses = getAllAssociatedWalletsForUser(user);
    return {
        success: true,
        data: associatedAddresses,
    };
}

export default authorize(handler);
