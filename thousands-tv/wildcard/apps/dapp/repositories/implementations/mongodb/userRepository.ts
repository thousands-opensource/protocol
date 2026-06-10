import { injectable } from "inversify";
import "reflect-metadata";
import connectToDb from "@/db/connectToDb";
import IUserRepository from "@/repositories/interfaces/iUserRepository";
import { IUser } from "@repo/interfaces";
import { ClientSession, FilterQuery, Types } from "mongoose";
import {
    findOneUserByQuery,
    findUsersByQuery,
    updateOneUserDB,
    usersModel,
} from "@repo/schemas";

@injectable()
export default class UserRepository implements IUserRepository {
    async findUserIdFromUserName(userName: string): Promise<IUser | null> {
        await connectToDb();

        let query: FilterQuery<IUser> = {
            "preferences.displayName": userName,
        };

        return await findOneUserByQuery(query);
    }

    async findUserById(userId: string): Promise<IUser | null> {
        await connectToDb();

        try {
            const objectId = new Types.ObjectId(userId);

            let query: FilterQuery<IUser> = {
                _id: objectId,
            };

            return await findOneUserByQuery(query);
        } catch (error) {
            console.error(`Invalid userId format: ${userId}`, error);
            return null;
        }
    }

    async addRoleToUser(userId: string, roleId: string): Promise<boolean> {
        await connectToDb();

        let query: FilterQuery<IUser> = {
            _id: userId,
        };

        await updateOneUserDB(query, { $addToSet: { roles: roleId } });

        return true;
    }

    async removeRoleFromUser(userId: string, roleId: string): Promise<boolean> {
        await connectToDb();

        let query: FilterQuery<IUser> = {
            _id: userId,
        };

        await updateOneUserDB(query, { $pull: { roles: roleId } });

        return true;
    }

    async getUsersFromBeamableIds(ids: string[]): Promise<IUser[]> {
        if (!ids?.length) {
            return [];
        }

        await connectToDb();

        const query: FilterQuery<IUser> = {
            "beamableProvider.id": { $in: ids },
        };

        return await findUsersByQuery(query);
    }

    async setCompetitorStripeId(
        userId: string,
        competitorStripeId: string
    ): Promise<boolean> {
        await connectToDb();

        const query: FilterQuery<IUser> = {
            _id: userId,
        };

        await updateOneUserDB(query, {
            $set: { competitorStripeId },
        });

        return true;
    }

    async updateThousandXp(
        userId: string,
        thousandsXpToAdd: number,
        session?: ClientSession
    ): Promise<boolean> {
        await connectToDb();

        try {
            const normalizedUserId = new Types.ObjectId(userId);
            await usersModel.updateOne(
                { _id: normalizedUserId },
                { $inc: { thousandsXp: thousandsXpToAdd } },
                { session }
            );
            return true;
        } catch (error) {
            console.error(
                `Failed to update thousandsXp for user ${userId}`,
                error
            );
            return false;
        }
    }

    async incrementDraftPicksEarned(
        userId: string,
        draftPicksToAdd: number,
        session?: ClientSession
    ): Promise<boolean> {
        await connectToDb();

        try {
            const normalizedUserId = new Types.ObjectId(userId);
            const result = await usersModel.updateOne(
                { _id: normalizedUserId },
                { $inc: { draftPicksEarned: draftPicksToAdd } },
                { session, strict: false }
            );
            return result.matchedCount > 0;
        } catch (error) {
            console.error(
                `Failed to update draftPicksEarned for user ${userId}`,
                error
            );
            return false;
        }
    }

    async incrementDraftPicksConsumed(
        userId: string,
        draftPicksToAdd: number,
        session?: ClientSession
    ): Promise<boolean> {
        await connectToDb();

        try {
            const normalizedUserId = new Types.ObjectId(userId);
            const result = await usersModel.updateOne(
                { _id: normalizedUserId },
                { $inc: { draftPicksConsumed: draftPicksToAdd } },
                { session, strict: false }
            );
            return result.matchedCount > 0;
        } catch (error) {
            console.error(
                `Failed to update draftPicksConsumed for user ${userId}`,
                error
            );
            return false;
        }
    }

    async updatePayoutMethod(
        userId: string,
        payoutMethod: "USD" | "USDC"
    ): Promise<boolean> {
        await connectToDb();

        const query: FilterQuery<IUser> = {
            _id: userId,
        };

        await updateOneUserDB(query, {
            $set: { payoutMethod },
        });

        return true;
    }
}
