import { injectable } from "inversify";
import { ClientSession } from "mongoose";
import connectToDb from "@/db/connectToDb";
import IBoostBalanceRepository from "./IBoostBalanceRepository";
import { BoostBalanceDoc, boostBalanceModel } from "@repo/schemas";

@injectable()
export default class BoostBalanceRepository implements IBoostBalanceRepository {
    async getBalanceByUserId(userId: string): Promise<BoostBalanceDoc | null> {
        try {
            await connectToDb();
            return await boostBalanceModel.findOne({ userId }).exec();
        } catch (e: any) {
            console.error("Error fetching boost balance:", e);
            return null;
        }
    }

    async addBoostToBalance(
        userId: string,
        amount: number,
        session?: ClientSession
    ): Promise<BoostBalanceDoc | null> {
        try {
            await connectToDb();

            const options = {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true,
                ...(session && { session }),
            };

            const updatedBalance = await boostBalanceModel.findOneAndUpdate(
                { userId },
                { $inc: { balance: amount } },
                options
            );

            return updatedBalance;
        } catch (e: any) {
            console.error("Error adding to boost balance:", e);
            return null;
        }
    }

    async subtractBoostFromBalance(
        userId: string,
        amount: number,
        session?: ClientSession
    ): Promise<BoostBalanceDoc | null> {
        try {
            await connectToDb();

            // First check if user has sufficient balance
            const currentBalance = await this.getBalanceByUserId(userId);
            if (!currentBalance || currentBalance.balance < amount) {
                console.error("Insufficient boost balance");
                return null;
            }

            const options = {
                new: true,
                ...(session && { session }),
            };

            const updatedBalance = await boostBalanceModel.findOneAndUpdate(
                { userId },
                { $inc: { balance: -amount } },
                options
            );

            return updatedBalance;
        } catch (e: any) {
            console.error("Error subtracting from boost balance:", e);
            return null;
        }
    }
}
