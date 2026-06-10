import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import IBoostRepository from "@/repositories/interfaces/iBoostRepository";
import { IUser, IUserEventBoostSummary } from "@repo/interfaces";
import { authorize } from "../middleware/authorization";

type RequestResponse = {
    eventBoostSummaries?: IUserEventBoostSummary[];
    message?: string;
    error?: string;
};

/**
 * API Route Handler to fetch all boost segments for the authenticated user.
 * The returned data is grouped by Event and Round, with a sum of credits spent.
 */
async function handler(
    req: NextApiRequest,
    res: NextApiResponse<RequestResponse>,
    user: IUser
) {
    if (req.method !== "GET") {
        res.status(405).json({
            message: `Method ${req.method} Not Allowed`,
        });
        return;
    }

    try {
        const userId = user._id;

        if (!userId) {
            res.status(400).json({
                message: "Missing required query parameters",
            });
            return;
        }

        if (Array.isArray(userId)) {
            res.status(400).json({ message: "Invalid query parameters" });
            return;
        }

        const boostRepository: IBoostRepository = diContainer.get("IBoostRepository");

        const userEventBoostSummaries = await boostRepository.getUserBoostSegmentSummaryByEvent(userId.toString());

        if (!userEventBoostSummaries || userEventBoostSummaries.length === 0) {
            res.status(200).json({ eventBoostSummaries: [], message: "No boost segments found for the user" });
            return;
        }

        res.status(200).json({ eventBoostSummaries: userEventBoostSummaries });
    } catch (error: any) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
}

export default authorize(handler);
