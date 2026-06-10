import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import IEventService from "@/services/interfaces/iEventService";

type RequestBody = {
    vendorEventId: string,
    matchId: string,
    cameraOperator: string,
    competitorGameTags: string[]
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
        const { vendorEventId, matchId, cameraOperator, competitorGameTags } = req.body;

        const eventService: IEventService =
            diContainer.get("IEventService");

        const success = await eventService.addEventMatch(vendorEventId, matchId, cameraOperator, competitorGameTags);

        if (!success) {
            console.log("Error adding event match!");
            res.status(500).json({
                success: false,
                message: "Error adding event match",
                error: "Unknown Error"
            });
        }

    } catch (error: any) {
        console.log("error: ", error);
        res.status(500).json({
            success: false,
            message: "Error starting event",
            error: error.message
        });
    }

    res.status(200).json({
        success: true,
        message: "The event has started",
        error: ""
    });
};
