import {
    findOneUserByQueryPublic,
    findOneUserByQueryAuthorized,
    UserDoc,
} from "@repo/schemas";
import { NextApiRequest, NextApiResponse } from "next";
import connectToDb from "@/db/connectToDb";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import { queryForAssociatedWallets } from "@/utils/userUtil";
import { COOKIES_ACCESS_TOKEN_WILDCARD } from "@/utils/accountAPIUtil";

/**
 * NextJS API Route Handler - GET Request only
 * @param req: request data via API Route
 * @param res: response data via API Route
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "GET") {
        sendApiResponse(res, {
            success: false,
            err: `Method ${req.method} Not Allowed`,
        });
        return;
    }

    const accessToken = req.cookies[COOKIES_ACCESS_TOKEN_WILDCARD] || "";
    const { walletAddress } = req.query;
    console.log(
        `fetching user with access token: ${accessToken} for address: ${walletAddress}`
    );

    if (!walletAddress) {
        sendApiResponse(res, {
            success: false,
            err: "Must provide walletAddress",
        });
        return;
    }

    try {
        await connectToDb();
        const query = queryForAssociatedWallets(walletAddress);
        let iUser: UserDoc | null = await findOneUserByQueryAuthorized(query);

        // perform public query if !canMakePrivateQuery
        iUser = await findOneUserByQueryPublic(query);
        sendApiResponse(res, {
            success: true,
            data: iUser,
        });
    } catch (e: any) {
        console.error(
            `Error fetching user. Address: ${walletAddress}, access token: ${accessToken}`,
            e
        );
        sendApiResponse(res, {
            success: false,
            err: `Error fetching user ${e.message}`,
        });
        return;
    }
}
