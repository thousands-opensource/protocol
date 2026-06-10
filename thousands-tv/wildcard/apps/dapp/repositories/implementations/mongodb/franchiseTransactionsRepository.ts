import { injectable } from "inversify";
import { Types } from "mongoose";
import IFranchiseTransactionsRepository from "@/repositories/interfaces/IFranchiseTransactions";
import {
    franchiseTransactionsModel,
    FranchiseTransactionDoc,
} from "@repo/schemas";
import connectToDb from "@/db/connectToDb";

@injectable()
export default class FranchiseTransactionsRepository
    implements IFranchiseTransactionsRepository
{
    async getFranchiseTransactionsByDate(
        startDate: Date,
        endDate: Date
    ): Promise<FranchiseTransactionDoc[]> {
        await connectToDb();
        return await franchiseTransactionsModel
            .find({
                createdAt: {
                    $gte: startDate,
                    $lte: endDate,
                },
            })
            .sort({ createdAt: -1 })
            .exec();
    }

    async getFranchiseTransactionsByUser(
        userId: string | Types.ObjectId
    ): Promise<FranchiseTransactionDoc[]> {
        await connectToDb();
        const normalizedUserId =
            typeof userId === "string" ? new Types.ObjectId(userId) : userId;

        return await franchiseTransactionsModel
            .find({ userId: normalizedUserId })
            .sort({ createdAt: -1 })
            .exec();
    }

    async addFranchiseTransaction(
        transaction: Partial<FranchiseTransactionDoc>
    ): Promise<FranchiseTransactionDoc | null> {
        await connectToDb();
        try {
            const doc = new franchiseTransactionsModel(transaction);
            return await doc.save();
        } catch (error) {
            console.error("Failed to create franchise transaction", error);
            return null;
        }
    }
}

