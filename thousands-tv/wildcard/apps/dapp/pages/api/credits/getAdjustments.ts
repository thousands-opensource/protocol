import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import { CreditTransactionDoc } from "@repo/schemas";
import ICreditTransactionRepository from "@/repositories/interfaces/ICreditTransactionRepository";
import { IUser, UserRole, CreditTransactionType } from "@repo/interfaces";
import { authorize } from "../middleware/authorization";

type RequestResponse = {
    success: boolean;
    message: string;
    data?: CreditTransactionDoc[];
    error?: string;
};

async function handler(
    req: NextApiRequest,
    res: NextApiResponse<RequestResponse>,
    user: IUser
) {
    if (req.method !== "GET") {
        return res.status(405).json({
            success: false,
            message: `Method ${req.method} Not Allowed`,
            error: "",
        });
    }

    try {
        const { userId } = req.query;

        if (!userId || typeof userId !== "string") {
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
                error: "userId is required",
            });
        }

        const creditTransactionRepository: ICreditTransactionRepository =
            diContainer.get("ICreditTransactionRepository");

        const adjustments = await creditTransactionRepository.getCreditTransactionsByUserId(
            userId,
            CreditTransactionType.ADMIN_ADJUSTMENT
        );

        return res.status(200).json({
            success: true,
            message: "Adjustments retrieved successfully",
            data: adjustments,
        });

    } catch (error: any) {
        console.error("Error getting adjustments:", error);
        return res.status(500).json({
            success: false,
            message: "Error retrieving adjustments",
            error: error.message,
        });
    }
}

export default authorize(handler, [UserRole.ADMIN]);