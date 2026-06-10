import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import { IUserInsightScoreService } from "@/services/implementations/UserInsightScoreService";
import { BackendApiResponse } from "@/types";

interface UpdateSummariesResponse extends BackendApiResponse<any> {
    data?: {
        totalUsers: number;
        updatedUsers: number;
        executionTimeMs: number;
    };
}

type RequestResponse = UpdateSummariesResponse;

async function handler(
    req: NextApiRequest,
    res: NextApiResponse<RequestResponse>
) {
    try {
        const authHeader = req.headers.authorization;
        const cronSecret = process.env.CRON_SECRET;

        if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized - Invalid cron secret",
            });
        }

        if (req.method !== "POST") {
            return res.status(405).json({
                success: false,
                message: `Method ${req.method} Not Allowed`,
            });
        }

        const startTime = Date.now();

        console.info('Starting daily user insight score summaries update with decay...');

        const userInsightScoreService = diContainer.get<IUserInsightScoreService>("IUserInsightScoreService");
        const { totalUsers, updatedUsers } = await userInsightScoreService.applyDecayToAllSummaries();

        const executionTimeMs = Date.now() - startTime;

        const successMessage = `Successfully updated ${updatedUsers}/${totalUsers} user insight score summaries in ${executionTimeMs}ms`;
        console.info(successMessage);

        return res.status(200).json({
            success: true,
            message: successMessage,
            data: {
                totalUsers,
                updatedUsers,
                executionTimeMs
            }
        });

    } catch (error: any) {
        console.error("Error updating user insight score summaries:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update user insight score summaries",
        });
    }
}

export default handler;
