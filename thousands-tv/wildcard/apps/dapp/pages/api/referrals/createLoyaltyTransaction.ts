import { NextApiRequest, NextApiResponse } from "next";
import {
    sendApiResponse,
    sendApiResponseWithStatusCode,
} from "@/utils/backend/apiUtil";
import { getSnagSolutionsClient } from "./snagSolutionsClient";
import {
    TransactionCreateTransactionParams,
    TransactionCreateTransactionResponse,
} from "@snagsolutions/sdk/resources/loyalty/transactions";
import { getIvsIdleGamePlatformApiKey } from "@/utils/environmentUtilWCA";

const API_KEY_HEADER = "x-api-key";

interface CreateLoyaltyTransactionPayload {
    walletAddress: string;
    amount: number;
}

const isValidPayload = (
    payload: unknown
): payload is CreateLoyaltyTransactionPayload => {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return false;
    }

    const { walletAddress, amount } = payload as CreateLoyaltyTransactionPayload;

    const hasValidWalletAddress =
        typeof walletAddress === "string" && walletAddress.trim().length > 0;
    const hasValidAmount =
        typeof amount === "number" && Number.isFinite(amount) && amount > 0;

    return hasValidWalletAddress && hasValidAmount;
};

const getHeaderValue = (value: string | string[] | undefined): string | null => {
    if (!value) {
        return null;
    }

    return Array.isArray(value) ? value[0] ?? null : value;
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
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

    const expectedApiKey = getIvsIdleGamePlatformApiKey();
    if (!expectedApiKey) {
        console.error(
            "[createLoyaltyTransaction] Missing AWS_IVS_IDLE_GAME_PLATFORM_API_KEY env variable."
        );
        sendApiResponseWithStatusCode(
            res,
            {
                success: false,
                err: "Server configuration error",
            },
            500
        );
        return;
    }

    const providedApiKey = getHeaderValue(
        req.headers[API_KEY_HEADER] as string | string[] | undefined
    );

    if (!providedApiKey || providedApiKey !== expectedApiKey) {
        sendApiResponseWithStatusCode(
            res,
            {
                success: false,
                err: "Unauthorized",
            },
            401
        );
        return;
    }

    if (!isValidPayload(req.body)) {
        sendApiResponseWithStatusCode(
            res,
            {
                success: false,
                err: "Request body must include walletAddress and a positive amount",
            },
            400
        );
        return;
    }

    const { walletAddress, amount } = req.body as CreateLoyaltyTransactionPayload;

    const transactionPayload: TransactionCreateTransactionParams = {
        description: `Manual loyalty credit for ${walletAddress}`,
        entries: [
            {
                walletAddress,
                amount,
                direction: "credit",
            },
        ],
    };

    try {
        const client = getSnagSolutionsClient();
        const response: TransactionCreateTransactionResponse =
            await client.loyalty.transactions.createTransaction(transactionPayload);

        sendApiResponse(res, {
            success: true,
            data: response,
        });
    } catch (error: any) {
        console.error(
            "Failed to create Snag Solutions loyalty transaction",
            error
        );

        const statusCode =
            typeof error?.response?.status === "number"
                ? error.response.status
                : typeof error?.status === "number"
                ? error.status
                : 500;

        const errorMessage =
            error?.response?.data?.message ||
            error?.message ||
            "Unable to create loyalty transaction";

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

export default handler;
