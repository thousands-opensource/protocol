import { sendApiResponse } from "@/utils/backend/apiUtil";
import { NextApiRequest, NextApiResponse } from "next";
import IBoostRepository from "@/repositories/interfaces/iBoostRepository";
import { diContainer } from "@/inversify.config";
import { authorize } from "@/pages/api/middleware/authorization";
import { IBoostsSegment, IUser, UserRole } from "@repo/interfaces";

export interface RallyHistoryResponse {
    success: boolean;
    data: IBoostsSegment[] | null;
}

/**
 * GET Rally History from boosts-segments collection for a specific stageId.  This will get all segments.  Returns a RallyHistoryResponse.
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

    //Get our IBoostRepository from the DI Container
    const boostRepository: IBoostRepository =
        diContainer.get("IBoostRepository");

    try {
        const stageId: string = req.query.stageId as string;
        const boostSegments: IBoostsSegment[] | null =
            await boostRepository.getBoostsSegments(stageId);
        if (!boostSegments) {
            console.error("No rallies found!");
            sendApiResponse(res, {
                success: false,
                err: "No rallies found!",
            });
            return;
        }

        sendApiResponse(res, {
            success: true,
            data: boostSegments,
        });
    } catch (e: any) {
        console.error("Error unable to rallies", e);
        sendApiResponse(res, {
            success: false,
            err: `Error unable to fetch rallies ${e.message}`,
        });
    }
}

export default authorize(handler, [UserRole.ORGANIZER]);
