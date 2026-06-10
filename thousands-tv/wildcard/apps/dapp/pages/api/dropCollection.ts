import { NextApiRequest, NextApiResponse } from "next";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import { IUser } from "@repo/interfaces";
import { authorize } from "./middleware/authorization";
import connectToDb from "@/db/connectToDb";
import { dropMetricCollection } from "@repo/schemas";

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
        await dropMetricCollection();
        sendApiResponse(res, { success: true });
    } catch (e: any) {
        console.error("Error dropping collection", e);
        sendApiResponse(res, {
            success: false,
            err: `Error dropping collection ${e.message}`,
        });
    }
}

export default authorize(handler);
