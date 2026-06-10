import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { getAdminAccessToken } from "@/backend/common";
import {
    getBeamApiUrl,
    getBeamCid,
    getBeamPid,
} from "@/utils/environmentUtilWCA";
import { authorize } from "@/pages/api/middleware/authorization";
import IEventRepository from "@/repositories/interfaces/iEventRepository";
import { diContainer } from "@/inversify.config";
import IStageRepository from "@/repositories/interfaces/iStageRepository";

const BEAM_API_URL = getBeamApiUrl();
const BEAM_CID = getBeamCid();
const BEAM_PID = getBeamPid();
const BEAM_SCOPE = `${BEAM_CID}.${BEAM_PID}`;

async function getEventDetails(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        res.status(405).json({ message: `Method ${req.method} Not Allowed` });
        return;
    }

    const { objectId } = req.query;

    const stageRepository: IStageRepository =
        diContainer.get("IStageRepository");
    const eventRepository: IEventRepository =
        diContainer.get("IEventRepository");

    try {
        const accessToken = await getAdminAccessToken();

        const response = await axios.get(
            `${BEAM_API_URL}/object/events/${objectId}`,
            {
                headers: {
                    accept: "application/json",
                    "X-DE-SCOPE": BEAM_SCOPE,
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        // get mongoDB stage to get seriesId
        const mongoStage = await stageRepository.getStageByBeamableEventId(
            objectId as string
        );
        if (!mongoStage) {
            res.status(500).json({
                status: "Internal Server Error",
                service: "N/A",
                error: "Error getting stage details",
                message: `Could not find stage with beamable id ${objectId} .`,
            });
            return;
        }
        const seriesId = mongoStage.seriesId;

        // get mongoDB event to get imageUrl
        const mongoEvent = await eventRepository.getEvent(
            mongoStage.eventId?.toString() || ""
        );
        const imageUrl = mongoEvent?.imageUrl;

        response.data.content = {
            ...response.data.content,
            seriesId,
            imageUrl,
            durationMinutes: response.data.content.phases[0].duration_minutes,
            gameMode: mongoStage.gameMode,
            numberOfSkyboxes: mongoStage.numberOfSkyboxes ?? 0,
        };

        res.json(response.data);
    } catch (error: any) {
        res.status(500).json({
            status: error.response
                ? error.response.data.status
                : "Internal Server Error",
            service: error.response ? error.response.data.service : "N/A",
            error: error.response
                ? error.response.data.error
                : "Error retrieving event details",
            message: error.response
                ? error.response.data.message
                : "No additional error information",
        });
    }
}

export default authorize(getEventDetails);
