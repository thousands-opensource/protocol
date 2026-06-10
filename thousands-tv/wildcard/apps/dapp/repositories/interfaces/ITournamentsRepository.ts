import {
    ITournament,
    ITournamentOptions,
    ITournamentPayoutSchedule,
    ITournamentReward,
} from "@repo/interfaces";
import {
    TournamentDoc,
    TournamentOptionsDoc,
    TournamentPayoutScheduleDoc,
} from "@repo/schemas";

export type DailyTournamentReward = ITournamentReward & {
    username?: string;
    rank: number;
};

export default interface ITournamentsRepository {
    getAllTournaments(): Promise<TournamentDoc[]>;
    getTournamentsByDate(dateToSearch: Date): Promise<TournamentDoc[]>;
    getDailyTournament(
        dateToSearch: Date
    ): Promise<DailyTournamentReward[]>;
    getTournamentById(id: string): Promise<TournamentDoc | null>;
    createTournament(
        tournament: Partial<ITournament>
    ): Promise<TournamentDoc | null>;
    updateTournament(
        id: string,
        update: Partial<ITournament>
    ): Promise<TournamentDoc | null>;
    getTournamentPayoutSchedules(): Promise<TournamentPayoutScheduleDoc[]>;
    addTournamentPayoutSchedule(
        schedule: ITournamentPayoutSchedule
    ): Promise<TournamentPayoutScheduleDoc | null>;
    updateTournamentPayoutSchedule(
        id: string,
        schedule: Partial<ITournamentPayoutSchedule>
    ): Promise<TournamentPayoutScheduleDoc | null>;
    getAllTournamentOptions(): Promise<TournamentOptionsDoc[]>;
    addTournamentOption(
        option: ITournamentOptions
    ): Promise<TournamentOptionsDoc | null>;
    updateTournamentOption(
        id: string,
        option: Partial<ITournamentOptions>
    ): Promise<TournamentOptionsDoc | null>;
    getTournamentOptionByTid(tid: string): Promise<TournamentOptionsDoc | null>;
}
