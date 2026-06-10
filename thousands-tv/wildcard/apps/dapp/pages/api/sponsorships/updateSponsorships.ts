import { NextApiRequest, NextApiResponse } from "next";
import { Types } from "mongoose";
import mongoose from "mongoose";
import { diContainer } from "@/inversify.config";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import { getGameDataApiKey } from "@/utils/environmentUtilWCA";
import IFranchiseCacheRepository from "@/repositories/interfaces/IFranchiseCacheRepository";
import connectToDb from "@/db/connectToDb";
import { userSponsoredEventModel } from "@repo/schemas";

type SponsorshipUpdateRow = {
    sponsorshipId?: string;
    thousandsXpEarned?: number;
    wcEarned?: number;
    support?: number;
    paidOn?: string | number | Date | null;
};

type SponsorshipUpdateRequest = {
    requestId?: string;
    items?: SponsorshipUpdateRow[];
};

function parsePayload(body: unknown): SponsorshipUpdateRequest {
    if (!body) {
        return {};
    }

    const parsed =
        typeof body === "string" ? (JSON.parse(body) as unknown) : body;

    if (typeof parsed !== "object" || !parsed) {
        return {};
    }

    const payload = parsed as SponsorshipUpdateRequest;
    return {
        requestId:
            typeof payload.requestId === "string"
                ? payload.requestId
                : undefined,
        items: Array.isArray(payload.items) ? payload.items : [],
    };
}

function parsePaidOn(value: SponsorshipUpdateRow["paidOn"]): Date | undefined {
    if (value === null || value === undefined) {
        return undefined;
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return undefined;
    }

    return date;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    let rows: SponsorshipUpdateRow[] = [];
    let requestId: string | undefined;
    let franchiseCacheRepository: IFranchiseCacheRepository | null = null;

    try {
        const payload = parsePayload(req.body);
        rows = payload.items ?? [];
        requestId = payload.requestId;
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

    if (!rows.length) {
        return sendApiResponse(res, {
            success: false,
            err: "No sponsorship updates provided.",
        });
    }

    try {
        franchiseCacheRepository =
            diContainer.get<IFranchiseCacheRepository>(
                "IFranchiseCacheRepository"
            );
        if (!franchiseCacheRepository) {
            throw new Error("Franchise cache repository unavailable.");
        }
        const cacheRepository = franchiseCacheRepository;

        const lockAcquired =
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

        await connectToDb();
        const session = await mongoose.startSession();

        let matchedCount = 0;
        let modifiedCount = 0;
        let processedUpdates = 0;

        try {
            await session.withTransaction(async () => {
                const updateOps = rows
                    .map((row) => {
                        if (
                            !row?.sponsorshipId ||
                            !Types.ObjectId.isValid(row.sponsorshipId)
                        ) {
                            return null;
                        }
                        const paidOn = parsePaidOn(row.paidOn);
                        const updateSet: Record<string, unknown> = {};

                        if (typeof row.thousandsXpEarned === "number") {
                            updateSet.thousandsXpEarned = row.thousandsXpEarned;
                        }

                        if (typeof row.wcEarned === "number") {
                            updateSet.wcEarned = row.wcEarned;
                        }

                        if (typeof row.support === "number") {
                            updateSet.support = row.support;
                        }

                        if (paidOn) {
                            updateSet.paidOn = paidOn;
                        }

                        if (!Object.keys(updateSet).length) {
                            return null;
                        }

                        return {
                            updateOne: {
                                filter: {
                                    _id: new Types.ObjectId(row.sponsorshipId),
                                    paidOn: null,
                                },
                                update: { $set: updateSet },
                            },
                        };
                    })
                    .filter(
                        (
                            op
                        ): op is {
                            updateOne: {
                                filter: {
                                    _id: Types.ObjectId;
                                    paidOn: null;
                                };
                                update: { $set: Record<string, unknown> };
                            };
                        } => Boolean(op)
                    );

                if (!updateOps.length) {
                    return;
                }

                const result = await userSponsoredEventModel.bulkWrite(
                    updateOps,
                    { session }
                );

                processedUpdates = updateOps.length;
                const resultAny = result as unknown as {
                    matchedCount?: number;
                    modifiedCount?: number;
                    nMatched?: number;
                    nModified?: number;
                };

                matchedCount =
                    resultAny.matchedCount ?? resultAny.nMatched ?? 0;
                modifiedCount =
                    resultAny.modifiedCount ?? resultAny.nModified ?? 0;
            });
        } finally {
            await session.endSession();
        }

        await cacheRepository.addProcessedRequestId(requestId);

        return sendApiResponse(res, {
            success: true,
            data: {
                requestId,
                processedUpdates,
                matchedCount,
                modifiedCount,
            },
        });
    } catch (error) {
        console.error("Failed to update sponsorships", error);
        return sendApiResponse(res, {
            success: false,
            err: "Failed to update sponsorships",
        });
    } finally {
        if (requestId && franchiseCacheRepository) {
            await franchiseCacheRepository.releaseProcessedRequestIdLock(
                requestId
            );
        }
    }
}

export default handler;
