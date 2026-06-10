import { NextApiRequest, NextApiResponse } from "next";
import { CreditTransactionStatus } from "@repo/interfaces";
import ICreditTransactionRepository from "@/repositories/interfaces/ICreditTransactionRepository";
import { diContainer } from "@/inversify.config";
import { CreditTransactionDoc } from "@repo/schemas";
import ICreditBalanceRepository from "@/repositories/implementations/mongodb/ICreditBalanceRepository";
import { authorize } from "../middleware/authorization";

type RequestBody = {
    userId: string;
    transactionId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    paymentGateway: string;
    status: string; // status of the payment, e.g., 'completed', 'failed'
};

type RequestResponse = {
    success: boolean;
    message: string;
    error?: string;
};

async function handler(
    req: NextApiRequest,
    res: NextApiResponse<RequestResponse>
) {
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: `Method ${req.method} Not Allowed`,
        });
    }

    try {
        const {
            userId,
            transactionId,
            amount,
            currency,
            paymentMethod,
            paymentGateway,
            status,
        }: RequestBody = req.body;

        if (
            !userId ||
            !transactionId ||
            !amount ||
            !currency ||
            !paymentMethod ||
            !paymentGateway ||
            !status
        ) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
                error: "Invalid parameters",
            });
        }

        const creditTransactionRepository: ICreditTransactionRepository =
            diContainer.get("ICreditTransactionRepository");

        // Create a credit transaction initially set as PENDING
        const credit =
            await creditTransactionRepository.createCreditTransaction(
                userId,
                transactionId,
                amount,
                currency,
                paymentMethod,
                paymentGateway
            );

        if (!credit) {
            return res.status(500).json({
                success: false,
                message: "Failed to add credits transaction",
                error: "Error processing credit transaction",
            });
        }

        // Handle transaction status based on payment gateway callback
        if (status === "completed") {
            const updatedCredit =
                await creditTransactionRepository.updateCreditTransactionStatus(
                    transactionId,
                    CreditTransactionStatus.COMPLETED
                );

            if (updatedCredit) {
                const creditsAdded =
                    await creditTransactionRepository.addCredits(
                        userId,
                        transactionId,
                        amount
                    );

                if (creditsAdded) {
                    return res.status(200).json({
                        success: true,
                        message:
                            "Transaction verified and credits added successfully",
                    });
                } else {
                    return res.status(500).json({
                        success: false,
                        message: "Failed to update user balance",
                        error: "Balance update error",
                    });
                }
            } else {
                return res.status(500).json({
                    success: false,
                    message: "Failed to update credit status to completed",
                    error: "Failed to update status",
                });
            }
        } else if (status === "failed") {
            // Handle failed transaction
            await creditTransactionRepository.updateCreditTransactionStatus(
                transactionId,
                CreditTransactionStatus.FAILED
            );
            return res.status(500).json({
                success: false,
                message: "Transaction failed",
                error: "Failed payment transaction",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Transaction processed successfully",
        });
    } catch (error: any) {
        console.error("Error processing transaction:", error);
        res.status(500).json({
            success: false,
            message: "Error processing transaction",
            error: error.message,
        });
    }
}

export default authorize(handler);
