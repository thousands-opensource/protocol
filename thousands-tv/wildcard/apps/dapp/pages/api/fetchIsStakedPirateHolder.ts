import { NextApiRequest, NextApiResponse } from "next";
import {
    sendApiResponse,
    sendApiResponseWithStatusCode,
} from "@/utils/backend/apiUtil";
import { hasSufficientStakedTokens } from "@/utils/backend/alchemyUtil";
import { authorize } from "./middleware/authorization";
import { IUser } from "@repo/interfaces";

/**
 * NextJS API Route Handler - GET Request only
 * @param req: request data via API Route
 * @param res: response data via API Route
 * @param user - The authorized user object.
 */
async function handler(req: NextApiRequest, res: NextApiResponse, user: IUser) {
    if (req.method !== "GET") {
        sendApiResponseWithStatusCode(res, {
            success: false,
            err: `Method ${req.method} Not Allowed`,
        });
        return;
    }

    const walletProvider = user?.walletProvider;

    if (walletProvider == null)
    {
        return sendApiResponse(res, {
            success: false,
            data: 'Invalid walletProvider',
        });
    }

    const walletAddresses = [
        walletProvider.address,
        ...(walletProvider.additionalWallets || []),
    ];

    if (walletAddresses) {
        const isStakedPirateHolder = await hasSufficientStakedTokens(
            walletAddresses
        );

        return sendApiResponse(res, {
            success: true,
            data: {
                isStakedPirateHolder,
            },
        });
    }

    return sendApiResponse(res, {
        success: false,
        data: "No wallet address provided",
    });
}

export default authorize(handler);
