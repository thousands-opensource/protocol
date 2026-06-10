import { NextApiRequest, NextApiResponse } from "next";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import connectToDb from "@/db/connectToDb";
import { userSponsoredEventModel, usersModel } from "@repo/schemas";
import { Types } from "mongoose";
import { getGameDataApiKey } from "@/utils/environmentUtilWCA";

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
        await connectToDb();

        const queue = await userSponsoredEventModel
            .find({ paidOn: null })
            .sort({ rank: 1, createdAt: 1 })
            .lean();

        const ranked = queue.filter(
            (entry) => entry.rank !== null && entry.rank !== undefined
        );
        const unranked = queue
            .filter((entry) => entry.rank === null || entry.rank === undefined)
            .sort((a, b) => {
                const tierA = Number(a.tier ?? 0);
                const tierB = Number(b.tier ?? 0);
                if (tierA !== tierB) {
                    return tierA - tierB;
                }
                return (
                    new Date(a.createdAt ?? 0).getTime() -
                    new Date(b.createdAt ?? 0).getTime()
                );
            });
        const orderedQueue = ranked.concat(unranked);

        const userIds = Array.from(
            new Set(
                orderedQueue
                    .map((entry) => entry.userId?.toString())
                    .filter((id): id is string => !!id && Types.ObjectId.isValid(id))
            )
        );
        const users = userIds.length
            ? await usersModel
                  .find(
                      { _id: { $in: userIds.map((id) => new Types.ObjectId(id)) } },
                      { "walletProvider.address": 1 }
                  )
                  .lean()
            : [];
        const walletByUserId = new Map(
            users.map((user) => [
                user._id?.toString() ?? "",
                user?.walletProvider?.address ?? "",
            ])
        );
        const orderedQueueWithWallets = orderedQueue.map((entry) => ({
            ...entry,
            primaryWalletAddress:
                walletByUserId.get(entry.userId?.toString() ?? "") ?? "",
        }));

        return sendApiResponse(res, {
            success: true,
            data: orderedQueueWithWallets,
        });
    } catch (error) {
        console.error("Failed to load sponsorship queue", error);
        return sendApiResponse(res, {
            success: false,
            err: "Failed to load sponsorship queue",
        });
    }
}

export default handler;
