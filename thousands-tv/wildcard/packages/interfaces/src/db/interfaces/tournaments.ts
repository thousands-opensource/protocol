import { Types } from "mongoose";

export interface ITournamentReward {
    gt: number;
    s: number;
}

export interface ITournament {
    tid: string;
    cid: string;
    s: Date;
    e: Date;
    p: boolean;
    as: boolean;
    cd: string;
    r: ITournamentReward[];
    payoutSchedule?: Types.ObjectId;
    _id?: Types.ObjectId;
    __v?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

