import connectToDb from "@/db/connectToDb";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import { NextApiRequest, NextApiResponse } from "next";
import { authorize } from "./middleware/authorization";
import { IGiftEvent, IUser, WildcardApiResponse } from "@repo/interfaces";
import { fetchGiftEvents } from "@repo/schemas";
import { handleFetchGiftEvents } from "@/utils/backend/giftEventUtil";

async function handler(req: NextApiRequest, res: NextApiResponse, user: IUser) {
    if (req.method !== "GET") {
        sendApiResponse(res, {
            success: false,
            err: `Method ${req.method} Not Allowed`,
        });
        return;
    }

    try {
        await connectToDb();
        console.log(`Fetching all giftEvents`);
        const war: WildcardApiResponse = await handleFetchGiftEvents();
        sendApiResponse(res, war);
    } catch (e: any) {
        console.error("Error unable to fetch gift events", e);
        sendApiResponse(res, {
            success: false,
            err: `Error unable to fetch gift events ${e.message}`,
        });
    }
}

export default authorize(handler);
