import { injectable } from "inversify";
import ICreditTransactionRepository from "@/repositories/interfaces/ICreditTransactionRepository";
import { CreditTransactionDoc, CreditTransactionInsert, creditTransactionsModel } from "@repo/schemas";
import { Types, ClientSession } from "mongoose";
import {
    CreditTransactionStatus,
    CreditTransactionType,
} from "@repo/interfaces";
import CreditBalanceRepository from "./creditBalanceRepository";
import BoostBalanceRepository from "./boostBalanceRepository";
import connectToDb from "@/db/connectToDb";

@injectable()
export default class CreditTransactionRepository
    implements ICreditTransactionRepository {
    private creditBalanceRepo = new CreditBalanceRepository();
    private boostBalanceRepo = new BoostBalanceRepository();

    /**
     * Create a credit transaction with status 'PENDING'
     */
    async createCreditTransaction(
        userId: string,
        transactionId: string,
        amount: number,
        currency: string,
        paymentMethod: string,
        paymentGateway: string,
        creditType: CreditTransactionType = CreditTransactionType.CREDIT,
        identityId?: string
    ): Promise<CreditTransactionDoc | null> {
        let session;

        try {
            await connectToDb();
            session = await creditTransactionsModel.startSession();
            session.startTransaction();

            // Create transaction data with conditional identityId
            const transactionData = {
                userId,
                transactionId,
                status: CreditTransactionStatus.PENDING,
                amount,
                currency,
                paymentMethod,
                paymentGateway,
                creditType,
                ...(identityId && {
                    identityId: new Types.ObjectId(identityId),
                }),
            };

            const newCredit = new creditTransactionsModel(transactionData);
            const savedCredit = await newCredit.save({ session });
            await session.commitTransaction();

            return savedCredit;
        } catch (e: any) {
            console.error("Error creating credit transaction:", e);
            if (session) {
                await session.abortTransaction();
            }
            return null;
        } finally {
            if (session) {
                session.endSession();
            }
        }
    }

    /**
     * Add credits to user balance when the transaction is completed
     */
    async addCredits(
        userId: string,
        transactionId: string,
        amount: number
    ): Promise<boolean> {
        let session;

        try {
            await connectToDb();
            session = await creditTransactionsModel.startSession();
            session.startTransaction();

            // Step 1: Check the status of the transaction before adding credits
            const transaction = await creditTransactionsModel
                .findOne({ transactionId })
                .session(session); // Use the session for the database query

            if (!transaction) {
                console.error(
                    `Transaction not found for transactionId: ${transactionId}`
                );
                await session.abortTransaction();
                return false;
            }

            // Step 2: Ensure the status is "COMPLETED" before adding credits
            if (transaction.status !== CreditTransactionStatus.COMPLETED) {
                console.error(
                    `Transaction status is not completed. Current status: ${transaction.status}`
                );
                await session.abortTransaction();
                return false;
            }

            // Handle balance update based on creditType
            let balanceUpdated = false;
            if (transaction.creditType === CreditTransactionType.BOOST) {
                if (!transaction.identityId) {
                    console.error(
                        "Identity ID is required for boost transactions"
                    );
                    await session.abortTransaction();
                    return false;
                }

                const boostBalance =
                    await this.boostBalanceRepo.addBoostToBalance(
                        userId,
                        amount,
                        session
                    );
                balanceUpdated = !!boostBalance;
            } else {
                const creditBalance =
                    await this.creditBalanceRepo.addCreditsToBalance(
                        userId,
                        amount,
                        session
                    );
                balanceUpdated = !!creditBalance;
            }

            if (!balanceUpdated) {
                console.error(`Failed to update balance for userId: ${userId}`);
                await session.abortTransaction();
                return false;
            }

            await session.commitTransaction();
            return true;
        } catch (e: any) {
            console.error("Error adding credits:", e);
            if (session) {
                await session.abortTransaction();
            }
            return false;
        } finally {
            if (session) {
                session.endSession();
            }
        }
    }

    async getCreditTransactionByTransactionId(
        transactionId: string
    ): Promise<CreditTransactionDoc | null> {
        try {
            await connectToDb();
            return await creditTransactionsModel
                .findOne({ transactionId })
                .exec();
        } catch (e: any) {
            console.error("Error fetching credit transaction:", e);
            return null;
        }
    }

    async getCreditTransactionsByUserId(
        userId: string,
        creditType?: CreditTransactionType
    ): Promise<CreditTransactionDoc[]> {
        try {
            await connectToDb();
            const query = {
                userId: new Types.ObjectId(userId),
                ...(creditType && { creditType })
            };

            return await creditTransactionsModel
                .find(query)
                .sort({ createdAt: -1 })
                .exec();
        } catch (e: any) {
            console.error("Error fetching credit transactions by userId:", e);
            return [];
        }
    }

    // Update the credit transaction status (e.g., after verification success or payment failure)
    async updateCreditTransactionStatus(
        transactionId: string,
        status: CreditTransactionStatus
    ): Promise<CreditTransactionDoc | null> {
        try {
            await connectToDb();
            return await creditTransactionsModel.findOneAndUpdate(
                { transactionId },
                { status, updatedAt: new Date() },
                { new: true }
            );
        } catch (error) {
            console.error("Error updating credit status:", error);
            return null;
        }
    }

    async createAdminAdjustment(
        userId: string,
        adminId: string,
        amount: number,
        reason: string,
    ): Promise<CreditTransactionDoc | null> {
        let session;

        try {
            await connectToDb();
            session = await creditTransactionsModel.startSession();
            session.startTransaction();

            const transactionId = new Types.ObjectId().toString();

            const transactionData: CreditTransactionInsert = {
                userId: new Types.ObjectId(userId),
                transactionId,
                status: CreditTransactionStatus.COMPLETED,
                amount,
                currency: "USD",
                creditType: CreditTransactionType.ADMIN_ADJUSTMENT,
                adjustmentReason: reason,
                adjustedBy: new Types.ObjectId(adminId),
                paymentMethod: "admin_adjustment_method",
                paymentGatewayTransactionId: transactionId + "_admin_adjustment",
            };

            const newAdjustment = new creditTransactionsModel(transactionData);
            const savedAdjustment = await newAdjustment.save({ session: session });

            const creditBalance = await this.creditBalanceRepo.addCreditsToBalance(
                userId,
                amount,
                session
            );

            if (!creditBalance) {
                throw new Error("Failed to update credit balance");
            }

            await session.commitTransaction();

            return savedAdjustment;
        } catch (e: any) {
            console.error("Error creating admin adjustment:", e);
            if (session) {
                await session.abortTransaction();
            }
            return null;
        } finally {
            if (session) {
                session.endSession();
            }
        }
    }
}
