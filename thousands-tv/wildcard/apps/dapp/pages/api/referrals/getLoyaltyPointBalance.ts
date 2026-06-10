import { NextApiRequest, NextApiResponse } from "next";
import {
    type AccountListParams,
    type AccountListResponse,
} from "@snagsolutions/sdk/resources/loyalty/accounts";
import {
    sendApiResponse,
    sendApiResponseWithStatusCode,
} from "@/utils/backend/apiUtil";
import { getSnagSolutionsClient } from "./snagSolutionsClient";
import { diContainer } from "@/inversify.config";
import ICreditBalanceRepository from "@/repositories/implementations/mongodb/ICreditBalanceRepository";
import { authorize } from "../middleware/authorization";
import { IUser } from "@repo/interfaces";

function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

async function handler(
    req: NextApiRequest, 
    res: NextApiResponse,
    user: IUser
) {
    if (req.method !== "GET") {
        sendApiResponseWithStatusCode(
            res,
            {
                success: false,
                err: `Method ${req.method} Not Allowed`,
            },
            405
        );
        return;
    }

    //Get userId from authorization
    const userId = user._id?.toString();

    if (!userId) {
        res.status(400).json({
            message: "Missing userId",
        });
        return;
    }

    const walletAddress = user.walletProvider?.address;

    if (!isNonEmptyString(walletAddress)) {
        sendApiResponseWithStatusCode(
            res,
            {
                success: false,
                err: "Missing walletAddress",
            },
            400
        );
        return;
    }

    const params: AccountListParams = {
        walletAddress,
    };

    const creditBalanceRepository: ICreditBalanceRepository =
                diContainer.get("ICreditBalanceRepository");
    
    // Get the user's current balance (credits)
    const balance = await creditBalanceRepository.getBalanceByUserId(
        userId
    );

    const spentLoyaltyPoints = balance?.spentLoyaltyPoints ?? 0;

    try {
        const client = getSnagSolutionsClient();
        const accountListResponse: AccountListResponse = await client.loyalty.accounts.list(
            params
        );

        if (!accountListResponse || !accountListResponse.data || accountListResponse.data.length < 1 || !accountListResponse.data[0].amount)
        {
            sendApiResponse(res, {
                success: true,
                data: 0,
            });

            return;
        }

        const totalLoyaltyPointsAccured: number = accountListResponse.data[0].amount as number;
        const currentLoyaltyPointsBalance = totalLoyaltyPointsAccured - spentLoyaltyPoints;

        //data in the response is just a number.  It is NOT of the type AccountListResponse.
        sendApiResponse(res, {
            success: true,
            data: currentLoyaltyPointsBalance,
        });
    } catch (error: any) {
        console.error("Failed to fetch loyalty point balance", error);

        const statusCode = 500;

        const errorMessage = "Unable to fetch loyalty point balance";

        sendApiResponseWithStatusCode(
            res,
            {
                success: false,
                err: errorMessage,
            },
            statusCode
        );
    }
}

export default authorize(handler);
