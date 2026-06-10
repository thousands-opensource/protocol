import { NextApiRequest, NextApiResponse } from "next";
import {
    type UserListParams,
    type UserListResponse,
} from "@snagsolutions/sdk/resources/users/users";
import {
    sendApiResponse,
    sendApiResponseWithStatusCode,
} from "@/utils/backend/apiUtil";
import { getSnagSolutionsClient } from "./snagSolutionsClient";
import { getIvsIdleGamePlatformApiKey } from "@/utils/environmentUtilWCA";

const API_KEY_HEADER = "x-api-key";

function getQueryParam(value: string | string[] | undefined): string | undefined {
    if (!value) {
        return undefined;
    }

    return Array.isArray(value) ? value[0] : value;
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

const getHeaderValue = (value: string | string[] | undefined): string | null => {
    if (!value) {
        return null;
    }

    return Array.isArray(value) ? value[0] ?? null : value;
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    const walletAddress = getQueryParam(req.query.walletAddress);
    const organizationId = getQueryParam(req.query.organizationId);
    const websiteId = getQueryParam(req.query.websiteId);
    const startingAfter = getQueryParam(req.query.startingAfter);
    const userId = getQueryParam(req.query.userId);
    const limitParam = getQueryParam(req.query.limit);

    if (!isNonEmptyString(walletAddress)) {
        sendApiResponseWithStatusCode(
            res,
            {
                success: false,
                err: "walletAddress query parameter is required",
            },
            400
        );
        return;
    }

    const params: UserListParams = {
        walletAddress,
    };

    if (isNonEmptyString(organizationId)) {
        params.organizationId = organizationId;
    }

    if (isNonEmptyString(websiteId)) {
        params.websiteId = websiteId;
    }

    if (isNonEmptyString(startingAfter)) {
        params.startingAfter = startingAfter;
    }

    if (isNonEmptyString(userId)) {
        params.userId = userId;
    }

    if (isNonEmptyString(limitParam)) {
        const parsedLimit = Number.parseInt(limitParam, 10);

        if (!Number.isNaN(parsedLimit)) {
            params.limit = parsedLimit;
        }
    }

    try {
        const client = getSnagSolutionsClient();
        const response: UserListResponse = await client.users.list(params);

        sendApiResponse(res, {
            success: true,
            data: response,
        });
    } catch (error: any) {
        console.error("Failed to fetch Snag Solutions users", error);

        const statusCode =
            typeof error?.response?.status === "number"
                ? error.response.status
                : typeof error?.status === "number"
                ? error.status
                : 500;

        const errorMessage =
            error?.response?.data?.message ||
            error?.message ||
            "Unable to fetch referral users";

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
