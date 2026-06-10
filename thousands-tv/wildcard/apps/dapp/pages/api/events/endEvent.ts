import { NextApiRequest, NextApiResponse } from "next";
import IIdleGameActionsRepository from "@/repositories/interfaces/iIdleGameActionsRepository";
import { NftPoints, EventPoints, IPoints } from "@repo/interfaces";
import { updateOnePointsDB } from "@repo/schemas";
import { diContainer } from "@/inversify.config";
import IStageRepository, { EventWithValidation } from "@/repositories/interfaces/iStageRepository";
import IStreamRepository from "@/repositories/interfaces/iStreamRepository";
import IEventService from "@/services/interfaces/iEventService";

type RequestBody = {
    eventId: string,
}

type RequestResponse = {
    success: boolean,
    message: string,
    error: string,
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<RequestResponse>
) {
    if (req.method !== "POST") {
        res.status(405).json({
            success: false,
            message: `Method ${req.method} Not Allowed`,
            error: ""
        });
        return;
    }

    try {
        const { eventId } = req.body;

        const stageRepository: IStageRepository =
            diContainer.get("IStageRepository");

        const eventUpdated: EventWithValidation | null = await stageRepository.updateEventSetStatus(eventId, "completed");

        if (eventUpdated != null && eventUpdated.event != null) {
            //End event on Beamable
            const eventService: IEventService =
                diContainer.get("IEventService");

            if (eventUpdated.event.beamableEventId != null) {
                const dateTimeNowUtc = new Date();
                await eventService.endEvent(eventUpdated.event.beamableEventId, dateTimeNowUtc);
            }
        }
    } catch (error: any) {
        console.log("error: ", error);
        res.status(500).json({
            success: false,
            message: "Error ending event",
            error: error.message
        });
    }

    res.status(200).json({
        success: true,
        message: "The event has ended",
        error: ""
    });
}