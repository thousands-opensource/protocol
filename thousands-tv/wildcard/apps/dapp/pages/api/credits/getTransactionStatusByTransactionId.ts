import { NextApiRequest, NextApiResponse } from "next";
import ICreditTransactionRepository from "@/repositories/interfaces/ICreditTransactionRepository";
import { diContainer } from "@/inversify.config";
import { authorize } from "../middleware/authorization";
import { CreditTransactionDoc } from "@repo/schemas";
import { IUser } from "@repo/interfaces";

/**
 * Get transaction status by transactionId.
 * @param req
 * @param res
 * @param user
 */
async function handler(req: NextApiRequest, res: NextApiResponse, user: IUser) {
    if (req.method !== "GET") {
        return res.status(405).json({
            success: false,
            message: `Method ${req.method} Not Allowed`,
        });
    }

    try {
        const { transactionId } = req.query;
        const userId = user._id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
                error: "User is not authenticated",
            });
        }

        if (!transactionId) {
            return res.status(400).json({
                success: false,
                message: "Missing transactionId parameter",
                error: "transactionId is required",
            });
        }

        const creditTransactionRepository: ICreditTransactionRepository =
            diContainer.get("ICreditTransactionRepository");

        const transaction: CreditTransactionDoc | null =
            await creditTransactionRepository.getCreditTransactionByTransactionId(
                transactionId as string
            );

        if (!transaction) {
            // ACK with 200 to the frontend
            return res.status(200).json({
                success: false,
                message: "Transaction not found",
            });
        }

        // Return only the status of the transaction along with the transactionId
        return res.status(200).json({
            success: true,
            message: "Transaction status found",
            data: {
                transactionId: transaction.transactionId,
                status: transaction.status,
            },
        });
    } catch (error: any) {
        console.error("Error fetching transaction:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching transaction status",
            error: error.message,
        });
    }
}

export default authorize(handler);
