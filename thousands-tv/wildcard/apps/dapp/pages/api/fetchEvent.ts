import { sendApiResponse } from "@/utils/backend/apiUtil";
import { NextApiRequest, NextApiResponse } from "next";
import IStageRepository from "@/repositories/interfaces/iStageRepository";
import { diContainer } from "@/inversify.config";
import { StageDoc } from "@repo/schemas";
import { authorize } from "./middleware/authorization";
import { IUser } from "@repo/interfaces";

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

    //Get our IStageRepository from the DI Container
    const stageRepository: IStageRepository =
        diContainer.get("IStageRepository");

    try {
        const vendorEventId: string = req.query.vendorEventId as string;
        const StageDoc: StageDoc | null =
            await stageRepository.getEventFromVendorEventId(vendorEventId);
        if (!StageDoc) {
            console.error("Event not found!");
            sendApiResponse(res, {
                success: false,
                err: "Event not found!",
            });
            return;
        }

        sendApiResponse(res, {
            success: true,
            data: StageDoc,
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
