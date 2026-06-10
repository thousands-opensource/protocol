import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import { ITicketQueueRepository } from "@/repositories/interfaces/iTicketQueueRepository";
import { IUser } from "@repo/interfaces";
import { authorize } from "@/pages/api/middleware/authorization";

/***
 * Join the ticket queue for a user
 * @param req
 * @param res
 * @param user
 * @returns
 */
async function handler(req: NextApiRequest, res: NextApiResponse, user: IUser) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    const { userId, seriesId } = req.body;

    if (!userId || !seriesId) {
        return res.status(400).json({ message: "Missing required parameters" });
    }

    try {
        const ticketQueueRepository: ITicketQueueRepository = diContainer.get(
            "ITicketQueueRepository"
        );
        // Initial queue points for a user (on joining the queue)
        const initialQueuePoints = 10;

        const queueEntry =
            await ticketQueueRepository.createOrUpdateTicketQueue(
                userId,
                seriesId,
                initialQueuePoints
            );

        return res.status(200).json({ success: true, queueEntry });
    } catch (error) {
        console.error("Error joining ticket queue:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export default authorize(handler);
