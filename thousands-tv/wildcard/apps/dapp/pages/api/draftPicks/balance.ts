import { NextApiRequest, NextApiResponse } from "next";
import { Types } from "mongoose";
import { diContainer } from "@/inversify.config";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import { getGameDataApiKey } from "@/utils/environmentUtilWCA";
import { usersModel } from "@repo/schemas";
import { IUser } from "@repo/interfaces";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
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

    const userId = typeof req.query.userId === "string" ? req.query.userId : "";
    if (!userId || !Types.ObjectId.isValid(userId)) {
        return sendApiResponse(res, {
            success: false,
            err: "Invalid userId.",
        });
    }

    try {
        const user = await usersModel
            .findById(userId, {
                draftPicksEarned: 1,
                draftPicksConsumed: 1,
            })
            .lean<IUser | null>();
        if (!user) {
            return sendApiResponse(res, {
                success: false,
                err: "User not found.",
            });
        }

        const draftPicksEarned = Number(user.draftPicksEarned ?? 0);
        const draftPicksConsumed = Number(user.draftPicksConsumed ?? 0);
        const currentDraftPicksBalance =
            (Number.isFinite(draftPicksEarned) ? draftPicksEarned : 0) -
            (Number.isFinite(draftPicksConsumed) ? draftPicksConsumed : 0);

        return sendApiResponse(res, {
            success: true,
            data: {
                userId,
                currentDraftPicksBalance,
                draftPicksEarned:
                    Number.isFinite(draftPicksEarned) ? draftPicksEarned : 0,
                draftPicksConsumed: Number.isFinite(draftPicksConsumed)
                    ? draftPicksConsumed
                    : 0,
            },
        });
    } catch (error) {
        console.error("Failed to load draft picks balance", error);
        return sendApiResponse(res, {
            success: false,
            err: "Failed to load draft picks balance",
        });
    }
}
