import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import IStreamRepository from "@/repositories/interfaces/iStreamRepository";
import { authorize } from "../middleware/authorization";

type RequestResponse = {
    streamId?: string;
    message?: string;
    error?: string;
};

/**
 * Get stream id by event id
 * @param req
 * @param res
 * @returns
 */
async function handler(
    req: NextApiRequest,
    res: NextApiResponse<RequestResponse>
) {
    if (req.method !== "GET") {
        res.status(405).json({
            message: `Method ${req.method} Not Allowed`,
        });
        return;
    }

    try {
        const { stageId } = req.query;
        if (!stageId) {
            res.status(400).json({
                message: "Missing required query parameter: stageId",
            });
            return;
        }

        if (Array.isArray(stageId)) {
            res.status(400).json({
                message: "Invalid query parameter: stageId",
            });
            return;
        }

        const streamRepository: IStreamRepository =
            diContainer.get("IStreamRepository");

        const stream = await streamRepository.findStreamByStageId(stageId);
        console.log(`getting stream for event ${stageId}`);

        if (!stream) {
            res.status(404).json({
                message: "Stream not found for the given stage",
            });
            return;
        }

        res.status(200).json({ streamId: stream._id.toString() });
    } catch (error: any) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
}

export default authorize(handler);
