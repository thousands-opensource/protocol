import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import { ITicketQueueRepository } from "@/repositories/interfaces/iTicketQueueRepository";
import { ITicketQueue, IUser } from "@repo/interfaces";
import { authorize } from "../middleware/authorization";

export interface UserTicketQueueData {
    queuePosition: number;
    totalInQueue: number;
    ticketQueue: ITicketQueue;
}

/**
 * API endpoint to get the queue position of a user
 * @param req
 * @param res
 * @param user
 * @returns
 */
async function handler(req: NextApiRequest, res: NextApiResponse, user: IUser) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    const { userId, seriesId } = req.query;

    if (!userId || !seriesId) {
        return res.status(400).json({ message: "Missing required parameters" });
    }

    try {
        const ticketQueueRepository: ITicketQueueRepository = diContainer.get(
            "ITicketQueueRepository"
        );

        // Get the user's queue entry
        const userQueueEntry = await ticketQueueRepository.getTicketQueue(
            userId as string,
            seriesId as string
        );

        if (!userQueueEntry) {
            return res.status(200).json({ message: "User not found in queue" }); // Expected Response: User not found in queue
        }

        // Get all users in the queue for this season
        const allQueuedUsers = await ticketQueueRepository.getTopQueuedUsers(
            seriesId as string,
            Number.MAX_SAFE_INTEGER
        );

        // Find the position of the user
        const userPosition = allQueuedUsers.findIndex(
            (entry) => entry.userId.toString() === userId.toString()
        );

        const userTicketQueueData: UserTicketQueueData = {
            queuePosition: userPosition + 1,
            totalInQueue: allQueuedUsers.length,
            ticketQueue: userQueueEntry,
        };

        return res.status(200).json(userTicketQueueData);
    } catch (error) {
        console.error("Error getting user queue position:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export default authorize(handler);
