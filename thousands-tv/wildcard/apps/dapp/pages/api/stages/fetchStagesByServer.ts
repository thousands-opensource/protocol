import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import { authorize } from "@/pages/api/middleware/authorization";
import IServerRepository from "@/repositories/interfaces/iServerRepository";
import IStageRepository from "@/repositories/interfaces/iStageRepository";
import { IStage, UserRole } from "@repo/interfaces";

type RequestResponse = {
    stages?: IStage[];
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
        const stageRepository: IStageRepository =
            diContainer.get("IStageRepository");

        const server = await serverRepository.getServerFromCode(serverCode);

        if (!server) {
            res.status(404).json({ message: "Server not found" });
            return;
        }

        const stages = await stageRepository.getStagesFromServerId(
            server._id.toString(),
            { startDate: -1 }
        );

        res.status(200).json({ stages });
    } catch (error: any) {
        console.error("Error fetching stages:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
}

export default authorize(handler, [UserRole.ORGANIZER]);
