import { NextApiRequest, NextApiResponse } from "next";
import { authorize } from "../middleware/authorization";
import connectToDb from "@/db/connectToDb";
import { creditBalanceModel, creditTransactionsModel } from "@repo/schemas";
import { CreditTransactionStatus, CreditTransactionType, IUser } from "@repo/interfaces";
import { Types } from "mongoose";
import { diContainer } from "@/inversify.config";
import IPointsRepository from "@/repositories/interfaces/IPointsRepository";
import { getSnagSolutionsClient } from "../referrals/snagSolutionsClient";
import type {
    AccountListParams,
    AccountListResponse,
} from "@snagsolutions/sdk/resources/loyalty/accounts";

type PurchaseWithPointsRequest = {
    transactionId: string;
    credits: number;
};

type PurchaseWithPointsResponse = {
    success: boolean;
    message: string;
    error?: string;
};

async function handler(
    req: NextApiRequest,
    res: NextApiResponse<PurchaseWithPointsResponse>,
    user: IUser
) {
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: `Method ${req.method} Not Allowed`,
        });
    }

    try {
        const { transactionId, credits } = req.body as PurchaseWithPointsRequest;

        if (!transactionId || typeof transactionId !== "string") {
            return res.status(400).json({
                success: false,
                message: "Missing or invalid transactionId",
            });
        }

        if (typeof credits !== "number" || !Number.isFinite(credits) || credits <= 0) {
            return res.status(400).json({
                success: false,
                message: "Missing or invalid credits amount",
            });
        }

        const userId = user._id?.toString();

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        //Get the Current Thousands Points Balance the user has - Use the logic in C:\Git\thousands-dapp\wildcard\apps\dapp\pages\api\referrals\getLoyaltyPointBalance.ts to calculate the Thousands Points Balance from Thousands Points Earned (from Snag API) minus spentLoyaltyPoints 
        //Verify the Thousands Points Balance is greater than or equal to credits.  Return a 400 error with success = false, and message = "Not enough Thousands Points!" if the user doesn't have enough Thousands Points
        const walletAddress = user.walletProvider?.address;
        if (!walletAddress) {
            return res.status(400).json({
                success: false,
                message: "Wallet address required to use Thousands Points",
            });
        }

        let totalLoyaltyPointsEarned = 0;
        try {
            const client = getSnagSolutionsClient();
            const params: AccountListParams = {
                walletAddress,
            };

            const accountListResponse: AccountListResponse =
                await client.loyalty.accounts.list(params);

            totalLoyaltyPointsEarned = Number(
                accountListResponse?.data?.[0]?.amount ?? 0
            );
        } catch (error) {
            console.error(
                "Failed to verify Thousands Points balance before purchase:",
                error
            );
            return res.status(500).json({
                success: false,
                message: "Unable to verify Thousands Points balance",
                error:
                    (error as Error)?.message ||
                    "Unable to verify Thousands Points balance",
            });
        }

        await connectToDb();

        const userObjectId = new Types.ObjectId(userId);

        const session = await creditBalanceModel.startSession();
        try {
            session.startTransaction();

            const existingTransaction = await creditTransactionsModel
                .findOne({
                    transactionId,
                })
                .session(session);

            if (existingTransaction) {
                throw new Error("TRANSACTION_EXISTS");
            }

            let balanceDoc = await creditBalanceModel
                .findOne({ userId: userObjectId })
                .session(session);

            if (!balanceDoc) {
                const [createdBalance] = await creditBalanceModel.create(
                    [
                        {
                            userId: userObjectId,
                            balance: 0,
                            spentLoyaltyPoints: 0,
                        },
                    ],
                    { session }
                );
                balanceDoc = createdBalance;
            }

            const currentSpent = balanceDoc?.spentLoyaltyPoints ?? 0;
            const currentBalance = balanceDoc?.balance ?? 0;
            const newSpent = currentSpent + credits;

            if (newSpent > totalLoyaltyPointsEarned) {
                throw new Error("INSUFFICIENT_POINTS");
            }

            balanceDoc.spentLoyaltyPoints = newSpent;
            balanceDoc.balance = currentBalance + credits;
            await balanceDoc.save({ session });

            await creditTransactionsModel.create(
                [
                    {
                        userId: userObjectId,
                        transactionId,
                        amount: credits,
                        currency: "TP",
                        paymentMethod: "points",
                        paymentGateway: "thousands",
                        paymentGatewayTransactionId: transactionId,
                        refundedAmount: 0,
                        status: CreditTransactionStatus.COMPLETED,
                        creditType: CreditTransactionType.CREDIT,
                        stageId: null,
                        segment: null,
                        skyboxTier: null,
                    },
                ],
                { session }
            );

            await session.commitTransaction();
        } catch (error: any) {
            if (session.inTransaction()) {
                await session.abortTransaction();
            }

            if (error?.message === "INSUFFICIENT_POINTS") {
                return res.status(400).json({
                    success: false,
                    message: "Not enough Thousands Points!",
                });
            }

            if (error?.message === "TRANSACTION_EXISTS") {
                return res.status(409).json({
                    success: false,
                    message: "Transaction already exists",
                });
            }

            console.error("Error processing credit purchase with points:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to process credit purchase with points",
                error: error?.message ?? "Unknown error",
            });
        } finally {
            session.endSession();
        }

        //Add the thousands points transaction
        const thousandsPointsRepository =
            diContainer.get<IPointsRepository>("IPointsRepository");
        await thousandsPointsRepository.addThousandsPointsTransaction(
            userObjectId,
            transactionId,
            0 - credits
        );

        return res.status(200).json({
            success: true,
            message: "Credit purchase with points recorded successfully",
        });
    } catch (error: any) {
        console.error("Error processing credit purchase with points:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to process credit purchase with points",
            error: error?.message ?? "Unknown error",
        });
    }
}

export default authorize(handler);
