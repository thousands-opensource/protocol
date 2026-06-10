import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import { CreditTransactionDoc } from "@repo/schemas";
import ICreditTransactionRepository from "@/repositories/interfaces/ICreditTransactionRepository";
import { IUser } from "@repo/interfaces";
import { authorize } from "../middleware/authorization";

type RequestResponse = {
    creditTransactions?: CreditTransactionDoc[] | null;
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
        const userId = user._id;

        if (!userId) {
            res.status(400).json({
                message: "Missing required query parameters",
            });
            return;
        }

        if (Array.isArray(userId)) {
            res.status(400).json({ message: "Invalid query parameters" });
            return;
        }

        const creditTransactionRepository: ICreditTransactionRepository =
            diContainer.get("ICreditTransactionRepository");

        const userCreditTransactions =
            await creditTransactionRepository.getCreditTransactionsByUserId(
                userId?.toString(),
            );

        if (!userCreditTransactions) {
            res.status(200).json({ message: "Claimed ticket not found" });
            return;
        }

        res.status(200).json({ creditTransactions: userCreditTransactions });
    } catch (error: any) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
}

export default authorize(handler);
