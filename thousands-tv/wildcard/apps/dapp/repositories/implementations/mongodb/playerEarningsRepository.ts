import { injectable } from "inversify";
import { Types } from "mongoose";
import IPlayerEarningsRepository from "@/repositories/interfaces/IPlayerEarningsRepository";
import connectToDb from "@/db/connectToDb";
import {
    playerEarningsTransactionModel,
    PlayerEarningsTransactionDoc,
    playerEarningsModel,
    PlayerEarningsDoc,
} from "@repo/schemas";

const normalizeObjectId = (id: string | Types.ObjectId): Types.ObjectId => {
    return typeof id === "string" ? new Types.ObjectId(id) : id;
};

@injectable()
export default class PlayerEarningsRepository
    implements IPlayerEarningsRepository
{
    async addPlayerEarningsTransaction(
        gamerTag: string,
        type: string,
        amount: number,
        tournamentId: string
    ): Promise<PlayerEarningsTransactionDoc | null> {
        try {
            await connectToDb();

            return await playerEarningsTransactionModel.create({
                gamerTag,
                type,
                amount,
                tournamentId,
            });
        } catch (error) {
            console.error(
                "Failed to add player earnings transaction:",
                error
            );
            return null;
        }
    }

    async getPlayerEarningsTransactions(
        gamerTag: string
    ): Promise<PlayerEarningsTransactionDoc[]> {
        try {
            await connectToDb();
            return await playerEarningsTransactionModel
                .find({ gamerTag })
                .sort({ createdAt: -1 })
                .exec();
        } catch (error) {
            console.error(
                "Failed to fetch player earnings transactions:",
                error
            );
            return [];
        }
    }

    async addOrUpdatePlayerEarnings(
        gamerTag: string,
        earnings: number
    ): Promise<PlayerEarningsDoc | null> {
        try {
            await connectToDb();

            return await playerEarningsModel
                .findOneAndUpdate(
                    { gamerTag },
                    {
                        $set: {
                            earnings,
                        },
                        $setOnInsert: { gamerTag },
                    },
                    { new: true, upsert: true }
                )
                .exec();
        } catch (error) {
            console.error("Failed to upsert player earnings:", error);
            return null;
        }
    }

    async getPlayerEarnings(
        gamerTag: string
    ): Promise<PlayerEarningsDoc | null> {
        try {
            await connectToDb();
            return await playerEarningsModel
                .findOne({ gamerTag })
                .exec();
        } catch (error) {
            console.error("Failed to fetch player earnings:", error);
            return null;
        }
    }
}

