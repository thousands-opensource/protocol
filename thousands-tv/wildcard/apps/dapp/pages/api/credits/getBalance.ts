import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import { CreditBalanceDoc } from "@repo/schemas";
import ICreditBalanceRepository from "@/repositories/implementations/mongodb/ICreditBalanceRepository";
import { Types } from "mongoose";

type RequestResponse = {
    success: boolean;
    message: string;
    data?: {
        userId: Types.ObjectId;
        balance: number;
        createdAt: Date;
        updatedAt: Date;
    },
    error?: string;
};

/**
 * Get the credit balance for a user
 * @param req
 * @param res
 * @returns
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<RequestResponse>
) {
    if (req.method !== "GET") {
        return res.status(405).json({
            success: false,
            message: `Method ${req.method} Not Allowed`,
            error: "",
        });
    }

    try {
        const userId = req.query.userId as string;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "Missing userId parameter",
                error: "userId is required",
            });
        }

        const creditBalanceRepository: ICreditBalanceRepository =
            diContainer.get("ICreditBalanceRepository");

        // Get the user's current balance (credits)
        const balance = await creditBalanceRepository.getBalanceByUserId(
            userId
        );

        //If we can't find a creditBalance record, then we return a balance of zero for this user.
        if (!balance) {
            return res.status(200).json({
                success: true,
                message: "User balance missing.  Returned zero balance.",
                data: {
                    userId: new Types.ObjectId(userId),
                    balance: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            });
        }

        return res.status(200).json({
            success: true,
            message: "User balance fetched successfully",
            data: balance,
        });
    } catch (error: any) {
        console.error("Error fetching user balance:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching user balance",
            error: error.message,
        });
    }
}
