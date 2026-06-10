import { NextApiRequest, NextApiResponse } from "next";
import { Types } from "mongoose";
import { diContainer } from "@/inversify.config";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import { getGameDataApiKey } from "@/utils/environmentUtilWCA";
import IUserRepository from "@/repositories/interfaces/iUserRepository";
import IFranchiseCacheRepository from "@/repositories/interfaces/IFranchiseCacheRepository";
import IUserSessionCacheRepository from "@/repositories/interfaces/IUserSessionCacheRepository";

type DraftPicksAwardRequest = {
    requestId?: string;
    userId?: string;
    draftPicksToAdd?: number;
};

function parsePayload(body: unknown): DraftPicksAwardRequest {
    if (!body) {
        return {};
    }

    const parsed =
        typeof body === "string" ? (JSON.parse(body) as unknown) : body;

    if (typeof parsed !== "object" || !parsed) {
        return {};
    }

    const payload = parsed as DraftPicksAwardRequest;
    return {
        requestId:
            typeof payload.requestId === "string"
                ? payload.requestId
                : undefined,
        userId: typeof payload.userId === "string" ? payload.userId : undefined,
        draftPicksToAdd: Number.isFinite(Number(payload.draftPicksToAdd))
            ? Number(payload.draftPicksToAdd)
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
    let draftPicksToAdd: number | undefined;

    try {
        const payload = parsePayload(req.body);
        requestId = payload.requestId;
        userId = payload.userId;
        draftPicksToAdd = payload.draftPicksToAdd;
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

    if (!Number.isFinite(draftPicksToAdd)) {
        return sendApiResponse(res, {
            success: false,
            err: "Invalid draftPicksToAdd.",
        });
    }
    const draftPicksToAddValue = draftPicksToAdd as number;

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

        const userRepository =
            diContainer.get<IUserRepository>("IUserRepository");
        const success = await userRepository.incrementDraftPicksEarned(
            userId,
            draftPicksToAddValue
        );

        if (!success) {
            throw new Error("Failed to update draftPicksEarned.");
        }

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
                draftPicksAdded: draftPicksToAddValue,
            },
        });
    } catch (error) {
        console.error("Failed to award draft picks", error);
        return sendApiResponse(res, {
            success: false,
            err: "Failed to award draft picks",
        });
    } finally {
        if (lockAcquired) {
            await cacheRepository.releaseProcessedRequestIdLock(requestId);
        }
    }
}
