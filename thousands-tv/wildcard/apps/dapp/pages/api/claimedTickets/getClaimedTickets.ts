import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import { ClaimedTicketDoc } from "@repo/schemas";
import IClaimedTicketRepository from "@/repositories/interfaces/iClaimedTicketRepository";
import { IUser } from "@repo/interfaces";
import { authorize } from "../middleware/authorization";

type RequestResponse = {
    claimedTicket?: ClaimedTicketDoc | null;
    message?: string;
    error?: string;
};

/**
 * Check if a user has claimed a ticket for a specific event
 * @param req
 * @param res
 * @param user
 * @returns
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
        const { eventId } = req.query;
        const userId = user._id;

        if (!userId || !eventId) {
            res.status(400).json({
                message: "Missing required query parameters",
            });
            return;
        }

        if (Array.isArray(userId) || Array.isArray(eventId)) {
            res.status(400).json({ message: "Invalid query parameters" });
            return;
        }

        const claimedTicketRepository: IClaimedTicketRepository =
            diContainer.get("IClaimedTicketRepository");

        const claimedTicket =
            await claimedTicketRepository.getClaimedTicketByUserAndEvent(
                userId?.toString(),
                eventId
            );

        if (!claimedTicket) {
            res.status(200).json({ message: "Claimed ticket not found" });
            return;
        }

        res.status(200).json({ claimedTicket });
    } catch (error: any) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
}

export default authorize(handler);
