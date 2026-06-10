import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import { authorize } from "@/pages/api/middleware/authorization";
import { ISeries, UserRole } from "@repo/interfaces";
import IServerRepository from "@/repositories/interfaces/iServerRepository";

type RequestResponse = {
    series?: ISeries[];
    message?: string;
    error?: string;
};

async function handler(
    req: NextApiRequest,
    res: NextApiResponse<RequestResponse>
) {
    if (req.method !== "POST") {
        res.status(405).json({
            message: `Method ${req.method} Not Allowed`,
        });
        return;
    }

    try {
        const { serverCode } = req.body;
        const serverRepository: IServerRepository =
            diContainer.get("IServerRepository");
        const server = await serverRepository.getServerFromCode(serverCode);
        if (!server) {
            res.status(404).json({ message: "Server not found" });
            return;
        }
        const series = server.series || [];

        res.status(200).json({ series });
    } catch (error: any) {
        console.error("Error fetching stages:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
}

export default authorize(handler, [UserRole.ORGANIZER]);
