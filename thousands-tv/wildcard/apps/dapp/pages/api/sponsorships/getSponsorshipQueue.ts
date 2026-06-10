import { NextApiRequest, NextApiResponse } from "next";
import { authorize } from "../middleware/authorization";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import connectToDb from "@/db/connectToDb";
import { userSponsoredEventModel, usersModel } from "@repo/schemas";
import { IUser } from "@repo/interfaces";

async function handler(req: NextApiRequest, res: NextApiResponse, user: IUser) {
    if (req.method !== "GET") {
        return sendApiResponse(res, {
            success: false,
            err: `Method ${req.method} not allowed`,
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
                    .filter(Boolean)
            )
        );
        const userWallets =
            userIds.length > 0
                ? await usersModel
                      .find(
                          { _id: { $in: userIds } },
                          {
                              _id: 1,
                              "walletProvider.address": 1,
                              "preferences.displayName": 1,
                          }
                      )
                      .lean()
                : [];
        const walletByUserId = new Map(
            userWallets.map((user) => [
                user._id.toString(),
                user?.walletProvider?.address?.toLowerCase() ?? null,
            ])
        );
        const displayNameByUserId = new Map(
            userWallets.map((user) => [
                user._id.toString(),
                user?.preferences?.displayName ?? null,
            ])
        );
        const queueWithWallets = orderedQueue.map((entry) => ({
            ...entry,
            walletAddress:
                walletByUserId.get(entry.userId?.toString() ?? "") ?? null,
            displayName:
                displayNameByUserId.get(entry.userId?.toString() ?? "") ?? null,
        }));

        return sendApiResponse(res, {
            success: true,
            data: queueWithWallets,
        });
    } catch (error) {
        console.error("Failed to load sponsorship queue", error);
        return sendApiResponse(res, {
            success: false,
            err: "Failed to load sponsorship queue",
        });
    }
}

export default authorize(handler);
