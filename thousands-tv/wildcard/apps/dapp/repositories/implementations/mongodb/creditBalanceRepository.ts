import { injectable } from "inversify";
import ICreditBalanceRepository from "./ICreditBalanceRepository";
import connectToDb from "@/db/connectToDb";
import { CreditBalanceDoc, creditBalanceModel } from "@repo/schemas";
import { ClientSession, Types } from "mongoose";

@injectable()
export default class CreditBalanceRepository
    implements ICreditBalanceRepository
{
    // Get the user's current credit balance
    async getBalanceByUserId(userId: string): Promise<CreditBalanceDoc | null> {
        try {
            await connectToDb();
            return await creditBalanceModel.findOne({
                userId: new Types.ObjectId(userId),
            });
        } catch (error) {
            console.error("Error fetching balance for user:", error);
            return null;
        }
    }

    // Add credits to a user's balance (this should be done after a successful transaction)
    async addCreditsToBalance(
        userId: string,
        amount: number,
        session?: ClientSession
    ): Promise<CreditBalanceDoc | null> {
        try {
            await connectToDb();

            const existingBalance = await this.getBalanceByUserId(userId);

            if (existingBalance) {
                existingBalance.balance += amount;
                await existingBalance.save({ session });
                console.log(
                    `User Id: ${userId} balance has been updated to ${existingBalance.balance}`
                );
                return existingBalance;
            } else {
                // Create a new balance record if one doesn't exist
                const newBalance = new creditBalanceModel({
                    userId: new Types.ObjectId(userId),
                    balance: amount,
                });
                await newBalance.save({ session });
                console.log(
                    `User Id: ${userId} balance has been updated to ${newBalance.balance}`
                );
                return newBalance;
            }
        } catch (error) {
            console.error("Error adding credits to balance:", error);
            return null;
        }
    }

    // Subtract credits from the user's balance (in case of refunds or reversals)
    async subtractCreditsFromBalance(
        userId: string,
        amount: number
    ): Promise<CreditBalanceDoc | null> {
        try {
            await connectToDb();

            const existingBalance = await this.getBalanceByUserId(userId);

            if (existingBalance && existingBalance.balance >= amount) {
                existingBalance.balance -= amount;
                await existingBalance.save();
                return existingBalance;
            } else {
                console.error("Insufficient balance to subtract");
                return null;
            }
        } catch (error) {
            console.error("Error subtracting credits from balance:", error);
            return null;
        }
    }
}
