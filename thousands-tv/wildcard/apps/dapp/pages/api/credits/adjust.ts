import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import { CreditTransactionDoc } from "@repo/schemas";
import ICreditTransactionRepository from "@/repositories/interfaces/ICreditTransactionRepository";
import { getServerSession } from "next-auth";
import { IUser, UserRole } from "@repo/interfaces";
import { authorize } from "../middleware/authorization";

type RequestBody = {
    userId: string;
    amount: number;
    reason: string;
};

type RequestResponse = {
    success: boolean;
    message: string;
    data?: CreditTransactionDoc;
    error?: string;
};

/**
 * Adjust a user's credit balance (admin only)
 * @param req
 * @param res
 * @returns
 */
async function handler(
    req: NextApiRequest,
    res: NextApiResponse<RequestResponse>,
    user: IUser
) {
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: `Method ${req.method} Not Allowed`,
            error: "",
        });
    }

    try {
        const { userId, amount, reason } = req.body as RequestBody;

        if (!userId || amount === undefined || !reason) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
                error: "userId, amount, and reason are required",
            });
        }

        const creditTransactionRepository: ICreditTransactionRepository =
            diContainer.get("ICreditTransactionRepository");

        const adjustment = await creditTransactionRepository.createAdminAdjustment(
            userId,
            user._id?.toString() ?? "",
            amount,
            reason
        );

        if (!adjustment) {
            return res.status(500).json({
                success: false,
                message: "Failed to create adjustment",
                error: "Transaction failed",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Credit balance adjusted successfully",
            data: adjustment,
        });

    } catch (error: any) {
        console.error("Error adjusting credit balance:", error);
        return res.status(500).json({
            success: false,
            message: "Error adjusting credit balance",
            error: error.message,
        });
    }
}

export default authorize(handler, [UserRole.ADMIN]);
