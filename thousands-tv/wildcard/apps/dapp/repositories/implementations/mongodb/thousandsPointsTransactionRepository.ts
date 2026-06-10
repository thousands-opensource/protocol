import { injectable } from "inversify";
import { Types } from "mongoose";
import IPointsRepository from "@/repositories/interfaces/IPointsRepository";
import { thousandsPointsTransactionModel } from "@repo/schemas";
import connectToDb from "@/db/connectToDb";

@injectable()
export default class ThousandsPointsTransactionRepository
    implements IPointsRepository
{
    async addThousandsPointsTransaction(
        userId: string | Types.ObjectId,
        transactionId: string,
        amount: number
    ): Promise<boolean> {
        try {
            await connectToDb();
            const normalizedUserId =
                typeof userId === "string"
                    ? new Types.ObjectId(userId)
                    : userId;
            const insertResult =
                await thousandsPointsTransactionModel.collection.insertOne({
                    userId: normalizedUserId,
                    transactionId,
                    amount,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });

            return insertResult.acknowledged === true;
        } catch (error) {
            console.error(
                "Failed to add thousands points transaction:",
                error
            );
            return false;
        }
    }
}
