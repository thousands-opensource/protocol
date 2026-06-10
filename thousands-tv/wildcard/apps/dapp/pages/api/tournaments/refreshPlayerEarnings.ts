import { NextApiRequest, NextApiResponse } from "next";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import { getGameDataApiKey } from "@/utils/environmentUtilWCA";
import connectToDb from "@/db/connectToDb";
import {
    playerEarningsModel,
    playerEarningsTransactionModel,
} from "@repo/schemas";

export const config = {
    maxDuration: 300, // seconds
};

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

    try {
        await connectToDb();

        const totals = await playerEarningsTransactionModel.aggregate<{
            _id: string;
            total: number;
        }>([
            { $group: { _id: "$gamerTag", total: { $sum: "$amount" } } },
        ]);

        const bulkUpdates = totals.map((entry) => ({
            updateOne: {
                filter: { gamerTag: entry._id },
                update: {
                    $set: { earnings: entry.total },
                    $setOnInsert: { gamerTag: entry._id },
                },
                upsert: true,
            },
        }));

        if (bulkUpdates.length) {
            await playerEarningsModel.bulkWrite(bulkUpdates);
        }

        return sendApiResponse(res, {
            success: true,
            data: { updatedUsers: bulkUpdates.length },
        });
    } catch (error) {
        console.error("Failed to refresh player earnings", error);
        return sendApiResponse(res, {
            success: false,
            err: "Failed to refresh player earnings",
        });
    }
}

export default handler;
