import type { NextApiRequest, NextApiResponse } from "next";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import { diContainer } from "@/inversify.config";
import IPlayerEarningsRepository from "@/repositories/interfaces/IPlayerEarningsRepository";
import IUserRepository from "@/repositories/interfaces/iUserRepository";
import { getIvsIdleGameGameApiKey } from "@/utils/environmentUtilWCA";

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
    const serverApiKey = getIvsIdleGameGameApiKey();

    if (!apiKey || apiKey !== serverApiKey) {
        return sendApiResponse(res, {
            success: false,
            err: "Unauthorized: Missing or invalid API key",
        });
    }

    const { gamerTag } = req.query;
    if (!gamerTag || typeof gamerTag !== "string") {
        return sendApiResponse(res, {
            success: false,
            err: "Missing gamerTag parameter",
        });
    }

    try {
        const playerEarningsRepository =
            diContainer.get<IPlayerEarningsRepository>(
                "IPlayerEarningsRepository"
            );
        const playerEarnings =
            await playerEarningsRepository.getPlayerEarnings(gamerTag);

        const userRepository =
            diContainer.get<IUserRepository>("IUserRepository");
        const users = await userRepository.getUsersFromBeamableIds([
            gamerTag,
        ]);
        const userId = users?.[0]?._id?.toString() ?? "";

        const earningsBalance = (
            (playerEarnings?.earnings ?? 0) / 100
        ).toFixed(2);
        const claimed = ((playerEarnings?.claimed ?? 0) / 100).toFixed(2);

        return sendApiResponse(res, {
            success: true,
            data: {
                id: userId,
                gamerTag,
                earningsBalance,
                claimed,
            },
        });
    } catch (error) {
        console.error(
            `Failed to fetch player earnings for gamerTag: ${gamerTag}`,
            error
        );
        return sendApiResponse(res, {
            success: false,
            err: "Failed to fetch player earnings",
        });
    }
}
