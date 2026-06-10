import { IUserStats } from "@repo/interfaces";
import { UpdateQuery } from "mongoose";

export interface IUserStatsRepository {
    createOrUpdateUserStats(
        userId: string,
        seriesId: string,
        update: UpdateQuery<IUserStats>
    ): Promise<IUserStats>;

    findUserStatsByseriesIdAndUserId(
        userId: string,
        seriesId: string
    ): Promise<IUserStats | null>;
}
