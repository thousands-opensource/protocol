import connectToDb from "@/db/connectToDb";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import { NextApiRequest, NextApiResponse } from "next";
import { authorize } from "./middleware/authorization";
import { IUser, WildcardApiResponse } from "@repo/interfaces";
import { handleCompleteGiftEvent } from "@/utils/backend/giftEventUtil";

async function handler(req: NextApiRequest, res: NextApiResponse, user: IUser) {
    if (req.method !== "POST") {
        sendApiResponse(res, {
            success: false,
            err: `Method ${req.method} Not Allowed`,
        });
        return;
    }

    try {
        await connectToDb();
        const war: WildcardApiResponse = await handleCompleteGiftEvent(req);
        sendApiResponse(res, war);
    } catch (e: any) {
        console.error("Error unable to complete gift event", e);
        sendApiResponse(res, {
            success: false,
            err: `Error unable to complete gift event ${e.message}`,
        });
    }
}

export default authorize(handler);
