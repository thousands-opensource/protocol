import { NextApiRequest, NextApiResponse } from "next";
import { authorize } from "@/pages/api/middleware/authorization";
import { diContainer } from "@/inversify.config";
import IFranchiseCacheRepository from "@/repositories/interfaces/IFranchiseCacheRepository";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import { findUsersByQuery } from "@repo/schemas";

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        return sendApiResponse(res, {
            success: false,
            err: `Method ${req.method} not allowed`,
        });
    }

    try {
        const myUserId = getQueryValue(req.query.myUserId);
        const ladderIndexParam = getQueryValue(req.query.ladderIndex);
        const parsedLadderIndex = ladderIndexParam ? Number.parseInt(ladderIndexParam, 10) : 1;
        const limitParam = getQueryValue(req.query.limit);
        const parsedLimit = limitParam ? Number.parseInt(limitParam, 10) : null;        
        const limit =
            parsedLimit && Number.isFinite(parsedLimit) && parsedLimit > 0
                ? parsedLimit
                : null;
        const franchiseCacheRepository =
            diContainer.get<IFranchiseCacheRepository>(
                "IFranchiseCacheRepository"
            );
        const indexEntries = await franchiseCacheRepository.getFranchiseIndex(parsedLadderIndex);

        const rows = (limit ? indexEntries.slice(0, limit) : indexEntries).map(
            (entry, idx) => ({
                rank: entry.rank,
                userId: entry.userId,
            })
        );

        const franchiseDetailsEntries = await Promise.all(
            rows.map(async (row) => {
                const franchisePayload =
                    await franchiseCacheRepository.getFranchise(row.userId);
                if (!franchisePayload) {
                    return {
                        ladderIndex: null,
                        previousRank: null,
                    };
                }
                try {
                    const parsed = JSON.parse(franchisePayload) as {
                        ladderIndex?: number | null;
                        previousRank?: number | null;
                    };
                    return {
                        ladderIndex:
                            typeof parsed.ladderIndex === "number"
                                ? parsed.ladderIndex
                                : null,
                        previousRank:
                            typeof parsed.previousRank === "number"
                                ? parsed.previousRank
                                : null,
                    };
                } catch {
                    return {
                        ladderIndex: null,
                        previousRank: null,
                    };
                }
            })
        );

        if (myUserId) {
            const normalizedMyUserId = myUserId.toLowerCase();
            const alreadyIncluded = rows.some(
                (row) => row.userId.toLowerCase() === normalizedMyUserId
            );
            if (!alreadyIncluded) {
                const myEntryIndex = indexEntries.findIndex(
                    (entry) =>
                        entry.userId.toLowerCase() === normalizedMyUserId
                );
                if (myEntryIndex >= 0) {
                    const myEntry = indexEntries[myEntryIndex];
                    rows.push({
                        rank: myEntry.rank,
                        userId: myEntry.userId,
                    });
                    const franchisePayload =
                        await franchiseCacheRepository.getFranchise(
                            myEntry.userId
                        );
                    if (franchisePayload) {
                        try {
                            const parsed = JSON.parse(franchisePayload) as {
                                ladderIndex?: number | null;
                                previousRank?: number | null;
                            };
                            franchiseDetailsEntries.push({
                                ladderIndex:
                                    typeof parsed.ladderIndex === "number"
                                        ? parsed.ladderIndex
                                        : null,
                                previousRank:
                                    typeof parsed.previousRank === "number"
                                        ? parsed.previousRank
                                        : null,
                            });
                        } catch {
                            franchiseDetailsEntries.push({
                                ladderIndex: null,
                                previousRank: null,
                            });
                        }
                    } else {
                        franchiseDetailsEntries.push({
                            ladderIndex: null,
                            previousRank: null,
                        });
                    }
                }
            }
        }

        const userIds = rows.map((row) => row.userId);
        const users = userIds.length
            ? await findUsersByQuery(
                  { _id: { $in: userIds } },
                  {
                      "walletProvider.address": 1,
                      "walletProvider.pfp.imageUrl": 1,
                      "preferences.displayName": 1,
                      "preferences.activePfpImageUrl": 1,
                  }
              )
            : [];

        const usersById = new Map(
            users.map((user) => [user._id.toString(), user])
        );

        const rowsWithUserDetails = rows.map((row, index) => {
            const user = usersById.get(row.userId);
            return {
                ...row,
                ladderIndex: franchiseDetailsEntries[index]?.ladderIndex ?? null,
                previousRank:
                    franchiseDetailsEntries[index]?.previousRank ?? null,
                walletProvider: user?.walletProvider
                    ? {
                          address: user.walletProvider.address,
                          pfp: {
                              imageUrl: user.walletProvider.pfp?.imageUrl,
                          },
                      }
                    : undefined,
                preferences: user?.preferences
                    ? {
                          displayName: user.preferences.displayName,
                          activePfpImageUrl:
                              user.preferences.activePfpImageUrl,
                      }
                    : undefined,
            };
        });

        return sendApiResponse(res, {
            success: true,
            data: rowsWithUserDetails,
        });
    } catch (error) {
        console.error("Failed to fetch franchise index", error);
        return sendApiResponse(res, {
            success: false,
            err: "Failed to fetch franchise index",
        });
    }
}

export default authorize(handler);

function getQueryValue(value?: string | string[]) {
    if (Array.isArray(value)) {
        return value[0];
    }
    return value;
}
