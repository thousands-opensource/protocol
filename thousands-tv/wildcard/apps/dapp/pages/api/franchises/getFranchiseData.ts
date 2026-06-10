import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import IFranchiseCacheRepository from "@/repositories/interfaces/IFranchiseCacheRepository";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import connectToDb from "@/db/connectToDb";
import { franchiseTransactionsModel, usersModel } from "@repo/schemas";
import { KycStatus } from "@repo/interfaces";
import { getGameDataApiKey } from "@/utils/environmentUtilWCA";
import { Types } from "mongoose";

type NftOwnerEntry = {
    owner: string;
    nfts: unknown[];
};

type WcOwnerEntry = {
    owner: string;
    quantityOfWc: number;
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
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

    try {
        const franchiseCacheRepository =
            diContainer.get<IFranchiseCacheRepository>(
                "IFranchiseCacheRepository"
            );

        await connectToDb();
        const users = await usersModel
            .find(
                { "kyc.status": KycStatus.COMPLETED },
                {
                    _id: 1,
                    "preferences.displayName": 1,
                    "walletProvider.address": 1,
                    "walletProvider.additionalWallets": 1,
                    autoAcceptOffers: 1,
                    bannedOn: 1,
                    thousandsXp: 1,
                }
            )
            .lean();

        const walletToUserId = new Map<string, string>();
        const userXp = new Map<string, number>();

        for (const user of users) {
            const userId = user?._id?.toString();
            if (!userId) {
                continue;
            }
            userXp.set(userId, Number(user?.thousandsXp ?? 0));

            const primary = user?.walletProvider?.address
                ?.toString()
                .toLowerCase();
            const additional =
                user?.walletProvider?.additionalWallets?.map((address: string) =>
                    address?.toString().toLowerCase()
                ) ?? [];

            const allAddresses = Array.from(
                new Set([primary, ...additional].filter(Boolean))
            ) as string[];

            for (const address of allAddresses) {
                walletToUserId.set(address, userId);
            }
        }

        const [nftsPayload, wcPayload] = await Promise.all([
            franchiseCacheRepository.getProcessedNfts(),
            franchiseCacheRepository.getProcessedWc(),
        ]);

        const nftOwners = parseOwnersArray<NftOwnerEntry>(nftsPayload);
        const wcOwners = parseOwnersArray<WcOwnerEntry>(wcPayload);

        const franchises = mergeOwners(
            walletToUserId,
            userXp,
            nftOwners,
            wcOwners
        );

        const baseFranchises = users
            .map((user) => {
                const additionalWallets = (
                    user?.walletProvider?.additionalWallets ?? []
                )
                    .map((address: string) => address?.toString())
                    .filter(Boolean);
                return {
                    userId: user._id?.toString() ?? "",
                    userName:
                        user?.preferences?.displayName?.toString() ?? "",
                    primaryWalletAddress:
                        user?.walletProvider?.address?.toString() ?? "",
                    ...(additionalWallets.length
                        ? { additionalWallets }
                        : {}),
                    autoAcceptOffers:
                        user?.autoAcceptOffers ?? null,
                    bannedOn: user?.bannedOn ?? null,
                    nfts: [],
                    quantityOfWc: 0,
                    thousandsXp:
                        userXp.get(user._id?.toString() ?? "") ?? 0,
                };
            })
            .filter((entry) => entry.userId);

        const franchiseByUserId = new Map(
            franchises.map((entry) => [entry.userId, entry])
        );

        const mergedFranchises = baseFranchises.map((entry) => {
            const merged = franchiseByUserId.get(entry.userId);
            return merged
                ? {
                      ...entry,
                      nfts: merged.nfts ?? [],
                      quantityOfWc: merged.quantityOfWc ?? 0,
                  }
                : entry;
        });

        const franchiseUserIds = mergedFranchises
            .map((entry) => entry.userId)
            .filter((userId) => Types.ObjectId.isValid(userId));

        const franchiseCacheEntries = await Promise.all(
            franchises.map(async (entry) => {
                const payload =
                    await franchiseCacheRepository.getFranchise(entry.userId);
                if (!payload) {
                    return {
                        userId: entry.userId,
                        offerRank: null,
                        ladderIndex: null,
                    };
                }
                try {
                    const parsed = JSON.parse(payload) as {
                        rank?: number | null;
                        ladderIndex?: number | null;
                    };
                    return {
                        userId: entry.userId,
                        offerRank:
                            typeof parsed.rank === "number"
                                ? parsed.rank
                                : null,
                        ladderIndex:
                            typeof parsed.ladderIndex === "number"
                                ? parsed.ladderIndex
                                : null,
                    };
                } catch {
                    return {
                        userId: entry.userId,
                        offerRank: null,
                        ladderIndex: null,
                    };
                }
            })
        );

        const cacheByUserId = new Map(
            franchiseCacheEntries.map((entry) => [entry.userId, entry])
        );

        const rateByUserId = new Map<string, number>();
        if (franchiseUserIds.length) {
            const rateEntries = await franchiseTransactionsModel.aggregate<{
                _id: Types.ObjectId;
                rate: number;
            }>([
                {
                    $match: {
                        userId: {
                            $in: franchiseUserIds.map(
                                (id) => new Types.ObjectId(id)
                            ),
                        },
                    },
                },
                { $sort: { createdAt: -1 } },
                { $group: { _id: "$userId", rate: { $first: "$rate" } } },
            ]);

            for (const entry of rateEntries) {
                const userId = entry._id?.toString();
                if (userId) {
                    rateByUserId.set(userId, Number(entry.rate ?? 0));
                }
            }
        }

        const franchisesWithDetails = mergedFranchises.map((entry) => {
            const cacheEntry = cacheByUserId.get(entry.userId);
            return {
                ...entry,
                offerRank: cacheEntry?.offerRank ?? null,
                ladderIndex: cacheEntry?.ladderIndex ?? null,
                rate: rateByUserId.get(entry.userId) ?? 0,
            };
        });

        return sendApiResponse(res, {
            success: true,
            data: { franchises: franchisesWithDetails },
        });
    } catch (error) {
        console.error("Failed to load franchise cache data", error);
        return sendApiResponse(res, {
            success: false,
            err: "Failed to load franchise data",
        });
    }
}

function parseOwnersArray<T extends { owner: string }>(
    payload?: string | null
): T[] {
    if (!payload) {
        return [];
    }

    try {
        const parsed = JSON.parse(payload);
        if (Array.isArray(parsed?.owners)) {
            return parsed.owners.filter(
                (entry: T) => entry && typeof entry.owner === "string"
            );
        }
    } catch (error) {
        console.warn("Failed to parse cached franchise payload", error);
    }
    return [];
}

function mergeOwners(
    walletToUserId: Map<string, string>,
    userXp: Map<string, number>,
    nftOwners: NftOwnerEntry[],
    wcOwners: WcOwnerEntry[]
) {
    const map = new Map<string, any>();

    for (const entry of nftOwners) {
        const userId = walletToUserId.get(entry.owner.toLowerCase());
        if (!userId) {
            continue;
        }
        if (!map.has(userId)) {
            map.set(userId, {
                userId,
                nfts: [],
                quantityOfWc: 0,
                thousandsXp: userXp.get(userId) ?? 0,
            });
        }
        const userRecord = map.get(userId);
        userRecord.nfts = userRecord.nfts.concat(entry.nfts ?? []);
    }

    for (const entry of wcOwners) {
        const userId = walletToUserId.get(entry.owner.toLowerCase());
        if (!userId) {
            continue;
        }
        if (!map.has(userId)) {
            map.set(userId, {
                userId,
                nfts: [],
                quantityOfWc: 0,
                thousandsXp: userXp.get(userId) ?? 0,
            });
        }
        const ownerRecord = map.get(userId);
        ownerRecord.quantityOfWc =
            (ownerRecord.quantityOfWc ?? 0) +
            Number(entry.quantityOfWc ?? 0);
    }

    return Array.from(map.values());
}

export default handler;
