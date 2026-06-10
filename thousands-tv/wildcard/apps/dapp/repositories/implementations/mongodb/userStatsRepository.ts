import { IUserStatsRepository } from "@/repositories/interfaces/iUserStatsRepository";
import { IUserStats } from "@repo/interfaces";
import { findOneAndUpdateUserStats, findUserStatsByQuery } from "@repo/schemas";
import { injectable } from "inversify";
import { UpdateQuery } from "mongoose";

@injectable()
export default class UserStatsRepository implements IUserStatsRepository {
    async createOrUpdateUserStats(
        userId: string,
        seriesId: string,
        update: UpdateQuery<IUserStats>
    ): Promise<IUserStats> {
        const query = { user: userId, seriesId };
        const updateQuery = {
            $setOnInsert: { user: userId, seriesId },
            ...update,
        };
        return await findOneAndUpdateUserStats(query, updateQuery);
    }

    async findUserStatsByseriesIdAndUserId(
        userId: string,
        seriesId: string
    ): Promise<IUserStats | null> {
        const query = { user: userId, seriesId };
        return await findUserStatsByQuery(query);
    }
}
