import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import { getGameDataApiKey } from "@/utils/environmentUtilWCA";
import IFranchiseCacheRepository from "@/repositories/interfaces/IFranchiseCacheRepository";
import IUserRepository from "@/repositories/interfaces/iUserRepository";
import connectToDb from "@/db/connectToDb";
import { franchiseTransactionsModel } from "@repo/schemas";
import mongoose, { Types } from "mongoose";

type FranchisePointsRow = {
    userId?: string;
    ladderIndex?: number;
    offerRank?: number;
    franchiseBalance?: number;
    newPointsRate?: number;
    thousandsXpToAdd?: number;
};

type CombinedRequest = {
    requestId?: string;
    items?: FranchisePointsRow[];
};

const BATCH_SIZE = 100;

function parsePayload(body: unknown): CombinedRequest {
    if (!body) {
        return {};
    }

    const parsed =
        typeof body === "string" ? (JSON.parse(body) as unknown) : body;

    if (typeof parsed !== "object" || !parsed) {
        return {};
    }

    const payload = parsed as CombinedRequest;
    return {
        requestId:
            typeof payload.requestId === "string"
                ? payload.requestId
                : undefined,
        items: Array.isArray(payload.items)
            ? payload.items
            : [],
    };
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

    let franchiseRows: FranchisePointsRow[] = [];
    let requestId: string | undefined;
    let franchiseCacheRepository: IFranchiseCacheRepository | null = null;
    try {
        const payload = parsePayload(req.body);
        franchiseRows = payload.items ?? [];
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

    if (!franchiseRows.length) {
        return sendApiResponse(res, {
            success: false,
            err: "No franchise points provided.",
        });
    }

    const missingLadderIndex = franchiseRows.some(
        (row) => row?.ladderIndex === undefined || row?.ladderIndex === null
    );
    if (missingLadderIndex) {
        return sendApiResponse(res, {
            success: false,
            err: "Missing ladderIndex for one or more rows.",
        });
    }

    const invalidOfferRank = franchiseRows.some(
        (row) =>
            row?.offerRank !== undefined &&
            row?.offerRank !== null &&
            !Number.isFinite(Number(row.offerRank))
    );
    if (invalidOfferRank) {
        return sendApiResponse(res, {
            success: false,
            err: "Invalid offerRank for one or more rows.",
        });
    }

    try {
        const userRepository =
            diContainer.get<IUserRepository>("IUserRepository");
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
        const createdIds: Types.ObjectId[] = [];
        const touchedUserIds = new Set<string>();
        const deltas = new Map<string, number>();
        const newPointsByUserId = new Map<string, number>();
        const rankByUserId = new Map<string, number | null>();
        const ladderIndexByUserId = new Map<string, number>();
        const draftPicksByUserId = new Map<string, number>();
        const franchiseBalanceByUserId = new Map<string, number>();
        let processedFranchiseTransactions = 0;
        let processedXpTransactions = 0;

        try {
            await session.withTransaction(async () => {
                for (const row of franchiseRows) {
                    if (!row?.userId || !Types.ObjectId.isValid(row.userId)) {
                        continue;
                    }
                    const points = Number(row.newPointsRate);
                    if (!Number.isFinite(points)) {
                        continue;
                    }

                    const [transaction] =
                        await franchiseTransactionsModel.create(
                            [
                                {
                                    userId: new Types.ObjectId(row.userId),
                                    rate: points,
                                    type: "payout",
                                    offerRank: Number(row.offerRank),
                                    ladderIndex: Number(row.ladderIndex),
                                    thousandsXpToAdd: Number(
                                        row.thousandsXpToAdd ?? 0
                                    ),
                                },
                            ],
                            { session }
                        );

                    if (transaction) {
                        processedFranchiseTransactions += 1;
                        touchedUserIds.add(row.userId);
                        createdIds.push(transaction._id);
                        newPointsByUserId.set(row.userId, points);
                        if (row.offerRank === null) {
                            rankByUserId.set(row.userId, null);
                        } else if (
                            row.offerRank !== undefined &&
                            Number.isFinite(row.offerRank)
                        ) {
                            rankByUserId.set(
                                row.userId,
                                Number(row.offerRank)
                            );
                        }
                        if (Number.isFinite(row.ladderIndex)) {
                            ladderIndexByUserId.set(
                                row.userId,
                                Number(row.ladderIndex)
                            );
                        }
                        if (Number.isFinite(row.franchiseBalance)) {
                            franchiseBalanceByUserId.set(
                                row.userId,
                                Number(row.franchiseBalance)
                            );
                        }
                    }

                    const xpPoints = Number(row.thousandsXpToAdd ?? 0);
                    if (Number.isFinite(xpPoints) && xpPoints !== 0) {
                        const success = await userRepository.updateThousandXp(
                            row.userId,
                            xpPoints,
                            session
                        );

                        if (success) {
                            processedXpTransactions += 1;
                            deltas.set(
                                row.userId,
                                (deltas.get(row.userId) ?? 0) + xpPoints
                            );
                        }
                    }
                }
            });
        } catch (error) {
            await session.endSession();
            throw error;
        }

        await session.endSession();

        const userIdList = Array.from(touchedUserIds);

        const rollbackFranchiseTransactions = async () => {
            if (!createdIds.length) {
                return;
            }
            const rollbackSession = await mongoose.startSession();
            try {
                await rollbackSession.withTransaction(async () => {
                    await franchiseTransactionsModel.deleteMany(
                        { _id: { $in: createdIds } },
                        { session: rollbackSession }
                    );
                });
            } finally {
                await rollbackSession.endSession();
            }
        };

        const rollbackThousandsXp = async () => {
            if (!deltas.size) {
                return;
            }
            const rollbackSession = await mongoose.startSession();
            try {
                await rollbackSession.withTransaction(async () => {
                    const entries = Array.from(deltas.entries());
                    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
                        const batch = entries.slice(i, i + BATCH_SIZE);
                        await Promise.all(
                            batch.map(([userId, delta]) =>
                                userRepository.updateThousandXp(
                                    userId,
                                    -delta,
                                    rollbackSession
                                )
                            )
                        );
                    }
                });
            } finally {
                await rollbackSession.endSession();
            }
        };

        try {
            if (userIdList.length) {
                const previousRanksByUserId = new Map<string, number>();
                const ladderIndexes = Array.from(
                    new Set(ladderIndexByUserId.values())
                );
                for (const ladderIndex of ladderIndexes) {
                    const entries =
                        await cacheRepository.getFranchiseIndex(ladderIndex);
                    for (const entry of entries) {
                        if (
                            entry?.userId &&
                            Number.isFinite(entry.rank)
                        ) {
                            previousRanksByUserId.set(
                                entry.userId,
                                entry.rank
                            );
                        }
                    }
                }

                for (let i = 0; i < userIdList.length; i += BATCH_SIZE) {
                    const batch = userIdList.slice(i, i + BATCH_SIZE);

                    const updateResults = await Promise.all(
                        batch.map(async (userId) => {
                            const ladderIndex =
                                ladderIndexByUserId.get(userId) ?? 0;
                            const rank = rankByUserId.has(userId)
                                ? rankByUserId.get(userId)
                                : 0;
                            const previousRank =
                                previousRanksByUserId.get(userId) ??
                                null;
                            const franchiseBalance =
                                franchiseBalanceByUserId.get(userId) ?? null;
                            const ladderIndexesToRemove = [1, 2, 3, 4, 5].filter(
                                (index) => index !== ladderIndex
                            );
                            const removalResults = await Promise.all(
                                ladderIndexesToRemove.map((index) =>
                                    cacheRepository.removeFranchiseFromIndex(
                                        userId,
                                        index
                                    )
                                )
                            );
                            if (removalResults.some((result) => !result)) {
                                return false;
                            }
                            const success = await cacheRepository.addFranchiseToIndex(
                                userId,
                                ladderIndex,
                                Number(rank ?? 0)
                            );
                            if (!success) {
                                return false;
                            }
                            await cacheRepository.setFranchise(
                                userId,
                                JSON.stringify({
                                    userId,
                                    rank,
                                    ladderIndex,
                                    previousRank,
                                    franchiseBalance,
                                })
                            );
                            return true;
                        })
                    );

                    if (updateResults.some((result) => !result)) {
                        throw new Error(
                            "Failed to update franchise index cache."
                        );
                    }
                }
            }

            await cacheRepository.addProcessedRequestId(requestId);
        } catch (error) {
            await rollbackFranchiseTransactions();
            await rollbackThousandsXp();
            throw error;
        }

        return sendApiResponse(res, {
            success: true,
            data: {
                requestId,
                processedFranchiseTransactions,
                updatedFranchiseUsers: userIdList.length,
                processedXpUsers: deltas.size,
                processedXpTransactions,
            },
        });
    } catch (error) {
        console.error(
            "Failed to add franchise points and thousandsXp",
            error
        );
        return sendApiResponse(res, {
            success: false,
            err: "Failed to add franchise points and thousandsXp",
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
