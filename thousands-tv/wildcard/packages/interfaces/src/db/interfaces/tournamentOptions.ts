import { Types } from "mongoose";
import { ITournamentPayoutSchedule } from "./tournamentPayoutSchedule";

export const TOURNAMENT_OPTIONS_COLLECTION = "tournament-options";

export interface ITournamentOptions {
    tid: string;
    payoutSchedule: Types.ObjectId | ITournamentPayoutSchedule;
    _id?: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}
