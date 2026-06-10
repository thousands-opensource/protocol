import { sendApiResponse } from "@/utils/backend/apiUtil";
import { NextApiRequest, NextApiResponse } from "next";
import { IUser } from "@repo/interfaces";
import { authorize } from "@/pages/api/middleware/authorization";

/**
 * NextJS API Route Handler - GET Request only
 * @param req: request data via API Route
 * @param res: response data via API Route
 */
async function handler(req: NextApiRequest, res: NextApiResponse, user: IUser) {
    if (req.method !== "GET") {
        sendApiResponse(res, {
            success: false,
            err: `Method ${req.method} Not Allowed`,
        });
        return;
    }

    try {
        sendApiResponse(res, {
            success: true,
            err: "",
            data: req.cookies,
        });
    } catch (e: any) {
        console.error("Error unable to fetch event", e);
        sendApiResponse(res, {
            success: false,
            err: `Error unable to fetch event ${e.message}`,
        });
    }
}

export default authorize(handler);
