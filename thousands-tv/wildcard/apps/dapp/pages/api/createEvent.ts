import connectToDb from "@/db/connectToDb";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import { NextApiRequest, NextApiResponse } from "next";
import { Channel, IStage, IUser, WildcardApiResponse } from "@repo/interfaces";
import { authorize } from "./middleware/authorization";

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
        const {
            beamableEventId,
            channels,
            name,
            description,
            startDate
        }: { beamableEventId: string; channels: Channel[], name: string, description: string, startDate: Date } = req.body;
        if (!beamableEventId || !channels) {
            const errMsg = "Invalid body";
            console.error(errMsg);
            sendApiResponse(res, {
                success: false,
                err: errMsg,
            });
            return;
        }

        const war: WildcardApiResponse = { success: true, data: null };
        sendApiResponse(res, war);
    } catch (e: any) {
        console.error("Error creating an event", e);
        sendApiResponse(res, {
            success: false,
            err: `Error creating an event ${e.message}`,
        });
    }
}

export default authorize(handler);
