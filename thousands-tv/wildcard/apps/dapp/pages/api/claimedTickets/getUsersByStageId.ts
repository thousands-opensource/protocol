import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import IClaimedTicketRepository from "@/repositories/interfaces/iClaimedTicketRepository";
import { IUser } from "@repo/interfaces";
import { findUsersByQuery } from "@repo/schemas";
import { authorize } from "../middleware/authorization";

type RequestResponse = {
    users?: IUser[];
    message?: string;
    error?: string;
};

async function handler(
    req: NextApiRequest,
    res: NextApiResponse<RequestResponse>
) {
    if (req.method !== "GET") {
        res.status(405).json({ message: `Method ${req.method} Not Allowed` });
        return;
    }

    const { stageId } = req.query;

    if (!stageId || typeof stageId !== "string") {
        res.status(400).json({ message: "Missing or invalid stageId" });
        return;
    }

    try {
        const claimedTicketRepository: IClaimedTicketRepository =
            diContainer.get("IClaimedTicketRepository");

        // Get all claimed tickets for the stage
        const claimedTickets =
            await claimedTicketRepository.getClaimedTicketsByStage(stageId);

        const userIds = claimedTickets?.map((ticket) => ticket.userId);

        // Fetch users based on these IDs
        const users = await findUsersByQuery({
            _id: { $in: userIds },
            beamableProvider: {
                $exists: true,
                $ne: null,
            },
        });

        res.status(200).json({ users });
    } catch (error: any) {
        console.error("Error fetching users by stage:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
}

export default authorize(handler);
