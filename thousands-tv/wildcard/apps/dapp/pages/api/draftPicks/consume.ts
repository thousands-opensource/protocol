import { NextApiRequest, NextApiResponse } from "next";
import { Types } from "mongoose";
import { diContainer } from "@/inversify.config";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import { getGameDataApiKey } from "@/utils/environmentUtilWCA";
import { usersModel } from "@repo/schemas";
import { IUser } from "@repo/interfaces";
import IFranchiseCacheRepository from "@/repositories/interfaces/IFranchiseCacheRepository";
import IUserSessionCacheRepository from "@/repositories/interfaces/IUserSessionCacheRepository";

type DraftPicksConsumeRequest = {
    requestId?: string;
    userId?: string;
    draftPicksConsumed?: number;
};

function parsePayload(body: unknown): DraftPicksConsumeRequest {
    if (!body) {
        return {};
    }

    const parsed =
        typeof body === "string" ? (JSON.parse(body) as unknown) : body;

    if (typeof parsed !== "object" || !parsed) {
        return {};
    }

    const payload = parsed as DraftPicksConsumeRequest;
    return {
        requestId:
            typeof payload.requestId === "string"
                ? payload.requestId
                : undefined,
        userId: typeof payload.userId === "string" ? payload.userId : undefined,
        draftPicksConsumed: Number.isFinite(Number(payload.draftPicksConsumed))
            ? Number(payload.draftPicksConsumed)
            : undefined,
    };
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "POST") {
        return sendApiResponse(res, {
            success: false,
            err: `Method ${req.method} not allowed`,
        });
    }

    const apiKey = req.headers["x-api-key"];
    const serverApiKey = getGameDataApiKey();

    if (!apiKey || !serverApiKey || apiKey !== serverApiKey) {
        return sendApiResponse(res, {
            success: false,
            err: "Unauthorized: Missing or Invalid API key",
        });
    }

    let requestId: string | undefined;
    let userId: string | undefined;
    let draftPicksConsumed: number | undefined;

    try {
        const payload = parsePayload(req.body);
        requestId = payload.requestId;
        userId = payload.userId;
        draftPicksConsumed = payload.draftPicksConsumed;
    } catch (error) {
        return sendApiResponse(res, {
            success: false,
            err: "Invalid request payload.",
        });
    }

    if (!requestId) {
        return sendApiResponse(res, {
            success: false,
            err: "Missing requestId.",
        });
    }

    if (!userId || !Types.ObjectId.isValid(userId)) {
        return sendApiResponse(res, {
            success: false,
            err: "Invalid userId.",
        });
    }

    if (!Number.isFinite(draftPicksConsumed)) {
        return sendApiResponse(res, {
            success: false,
            err: "Invalid draftPicksConsumed.",
        });
    }

    const cacheRepository =
        diContainer.get<IFranchiseCacheRepository>(
            "IFranchiseCacheRepository"
        );

    let lockAcquired = false;
    try {
        lockAcquired =
            await cacheRepository.acquireProcessedRequestIdLock(requestId);
        if (!lockAcquired) {
            return sendApiResponse(res, {
                success: false,
                err: "Request already being processed.",
            });
        }

        const alreadyProcessed =
            await cacheRepository.getProcessedRequestId(requestId);
        if (alreadyProcessed) {
            await cacheRepository.releaseProcessedRequestIdLock(requestId);
            return sendApiResponse(res, {
                success: false,
                err: "Request already processed.",
            });
        }

        const draftPicksConsumedValue = draftPicksConsumed as number;
        const updated = await usersModel
            .findOneAndUpdate(
                { _id: userId },
                { $inc: { draftPicksConsumed: draftPicksConsumedValue } },
                { new: true, strict: false }
            )
            .lean<IUser | null>();

        await cacheRepository.addProcessedRequestId(requestId);
        const userSessionCacheRepository =
            diContainer.get<IUserSessionCacheRepository>(
                "IUserSessionCacheRepository"
            );
        await userSessionCacheRepository.removeUserSession(userId);

        return sendApiResponse(res, {
            success: true,
            data: {
                requestId,
                userId,
                draftPicksConsumed: draftPicksConsumedValue,
            },
        });
    } catch (error) {
        console.error("Failed to consume draft picks", error);
        return sendApiResponse(res, {
            success: false,
            err: "Failed to consume draft picks",
        });
    } finally {
        if (lockAcquired) {
            await cacheRepository.releaseProcessedRequestIdLock(requestId);
        }
    }
}
