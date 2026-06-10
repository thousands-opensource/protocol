import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import IEventService from "@/services/interfaces/iEventService";
import { RequestResponse } from "@/types";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<RequestResponse>
) {
    if (req.method !== "POST") {
        res.status(405).json({
            success: false,
            message: `Method ${req.method} Not Allowed`,
            error: "",
        });
        return;
    }

    try {
        const { vendorEventId, matchId } = req.body;

        const eventService: IEventService = diContainer.get("IEventService");

        const success = await eventService.cancelEventMatch(
            vendorEventId,
            matchId
        );

        if (!success) {
            console.log(
                `Error canceling event "${vendorEventId}" match "${matchId}"!`
            );
            res.status(500).json({
                success: false,
                message: "Error canceling event match",
                error: "Unknown Error",
            });
        }
    } catch (error: any) {
        console.log("error: ", error);
        res.status(500).json({
            success: false,
            message: "Error canceling event match",
            error: error.message,
        });
    }

    res.status(200).json({
        success: true,
        message: "The event match has been cancelled",
        error: "",
    });
}
