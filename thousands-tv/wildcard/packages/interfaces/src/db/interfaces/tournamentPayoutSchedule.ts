import { Types } from "mongoose";

export const TOURNAMENT_PAYOUT_SCHEDULE_COLLECTION =
    "tournament-payout-schedule";

export interface ITournamentPayoutScheduleEntry {
    range: [number, number];
    amountInCents: number;
}

export interface ITournamentPayoutSchedule {
    payoutScheduleName: string;
    schedule: ITournamentPayoutScheduleEntry[];
    _id?: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}
