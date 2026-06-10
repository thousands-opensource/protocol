import { Types } from "mongoose";
import { IUser } from "./user";

export const USER_STATS_TABLE_NAME = "users-stats";

export interface IUserStats {
    seriesId: Types.ObjectId;
    user: IUser;
    stats: Stats;

    _id?: Types.ObjectId;
    __v?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Stats {
    gamesWon: number;
    gamesLoss: number;
    gamesAttended: number;
    minutesSpentPlaying: number;
    minutesSpentViewing: number;
}
