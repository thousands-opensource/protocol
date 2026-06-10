import { injectable } from "inversify";
import ITournamentsRepository, {
    DailyTournamentReward,
} from "@/repositories/interfaces/ITournamentsRepository";
import connectToDb from "@/db/connectToDb";
import {
    ITournament,
    ITournamentOptions,
    ITournamentPayoutSchedule,
} from "@repo/interfaces";
import {
    tournamentsModel,
    TournamentDoc,
    tournamentPayoutScheduleModel,
    TournamentPayoutScheduleDoc,
    tournamentOptionsModel,
    TournamentOptionsDoc,
} from "@repo/schemas";
import IUserRepository from "@/repositories/interfaces/iUserRepository";
import { diContainer } from "@/inversify.config";

@injectable()
export default class TournamentsRepository
    implements ITournamentsRepository
{
    async getAllTournaments(): Promise<TournamentDoc[]> {
        try {
            return await tournamentsModel
                .find({})
                .sort({ s: 1 })
                .exec();
        } catch (error) {
            console.error(
                "Failed to fetch all tournaments",
                error
            );
            return [];
        }
    }

    async getTournamentsByDate(dateToSearch: Date): Promise<TournamentDoc[]> {
        if (!dateToSearch) {
            return [];
        }

        try {
            const startOfDay = new Date(dateToSearch);
            startOfDay.setUTCHours(0, 0, 0, 0);

            const endOfDay = new Date(startOfDay);
            endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

            return await tournamentsModel
                .find({
                    s: { $lte: endOfDay },
                    e: { $gte: startOfDay },
                })
                .sort({ s: 1 })
                .exec();
        } catch (error) {
            console.error(
                "Failed to fetch tournaments for date:",
                dateToSearch,
                error
            );
            return [];
        }
    }

    async getDailyTournament(
        dateToSearch: Date
    ): Promise<DailyTournamentReward[]> {
        const tournaments = await this.getTournamentsByDate(dateToSearch);

        if (!tournaments.length) {
            return [];
        }

        const rewards = tournaments.flatMap((tournament) => tournament.r || []);
        if (!rewards.length) {
            return [];
        }

        const gamerTagSet = new Set<string>();
        for (const reward of rewards) {
            if (reward?.gt !== undefined && reward?.gt !== null) {
                gamerTagSet.add(reward.gt.toString());
            }
        }

        const gamerTags = Array.from(gamerTagSet);
        const userRepository = diContainer.get<IUserRepository>(
            "IUserRepository"
        );

        const users = gamerTags.length
            ? await userRepository.getUsersFromBeamableIds(gamerTags)
            : [];

        const beamableIdToUsername = new Map<string, string>();
        users.forEach((user) => {
            const beamableId = user?.beamableProvider?.id;
            if (beamableId) {
                beamableIdToUsername.set(
                    beamableId,
                    user?.preferences?.displayName || ""
                );
            }
        });

        return rewards.map((reward, index) => {
            const gamerTag =
                reward?.gt !== undefined && reward?.gt !== null
                    ? reward.gt.toString()
                    : "";
            const username = gamerTag
                ? beamableIdToUsername.get(gamerTag) || undefined
                : undefined;

            return {
                gt: reward.gt,
                s: reward.s,
                username,
                rank: index + 1,
            };
        });
    }

    async getTournamentById(id: string): Promise<TournamentDoc | null> {
        if (!id) {
            return null;
        }

        try {
            return await tournamentsModel.findById(id).exec();
        } catch (error) {
            console.error("Failed to fetch tournament by id:", id, error);
            return null;
        }
    }

    async createTournament(
        tournament: Partial<ITournament>
    ): Promise<TournamentDoc | null> {
        if (!tournament?.tid) {
            console.error("Tournament tid is required");
            return null;
        }

        try {
            return await tournamentsModel.create(tournament);
        } catch (error) {
            console.error("Failed to create tournament", error);
            return null;
        }
    }

    async updateTournament(
        id: string,
        update: Partial<ITournament>
    ): Promise<TournamentDoc | null> {
        if (!id) {
            return null;
        }

        try {
            return await tournamentsModel
                .findByIdAndUpdate(id, update, { new: true })
                .exec();
        } catch (error) {
            console.error("Failed to update tournament", error);
            return null;
        }
    }

    async getTournamentPayoutSchedules(): Promise<TournamentPayoutScheduleDoc[]> {
        try {
            await connectToDb();
            return await tournamentPayoutScheduleModel
                .find({})
                .sort({ payoutScheduleName: 1 })
                .exec();
        } catch (error) {
            console.error("Failed to fetch tournament payout schedules", error);
            return [];
        }
    }

    async addTournamentPayoutSchedule(
        schedule: ITournamentPayoutSchedule
    ): Promise<TournamentPayoutScheduleDoc | null> {
        try {
            await connectToDb();
            return await tournamentPayoutScheduleModel.create(schedule);
        } catch (error) {
            console.error("Failed to create tournament payout schedule", error);
            return null;
        }
    }

    async updateTournamentPayoutSchedule(
        id: string,
        schedule: Partial<ITournamentPayoutSchedule>
    ): Promise<TournamentPayoutScheduleDoc | null> {
        if (!id) {
            return null;
        }

        try {
            await connectToDb();
            return await tournamentPayoutScheduleModel
                .findByIdAndUpdate(id, schedule, { new: true })
                .exec();
        } catch (error) {
            console.error("Failed to update tournament payout schedule", error);
            return null;
        }
    }

    async getAllTournamentOptions(): Promise<TournamentOptionsDoc[]> {
        try {
            await connectToDb();
            const options = await tournamentOptionsModel
                .find({})
                .populate("payoutSchedule")
                .exec();
            return options as TournamentOptionsDoc[];
        } catch (error) {
            console.error("Failed to fetch tournament options", error);
            return [];
        }
    }

    async addTournamentOption(
        option: ITournamentOptions
    ): Promise<TournamentOptionsDoc | null> {
        try {
            await connectToDb();
            return await tournamentOptionsModel.create(option);
        } catch (error) {
            console.error("Failed to add tournament option", error);
            return null;
        }
    }

    async updateTournamentOption(
        id: string,
        option: Partial<ITournamentOptions>
    ): Promise<TournamentOptionsDoc | null> {
        if (!id) {
            return null;
        }

        try {
            await connectToDb();
            return await tournamentOptionsModel
                .findByIdAndUpdate(id, option, { new: true })
                .exec();
        } catch (error) {
            console.error("Failed to update tournament option", error);
            return null;
        }
    }

    async getTournamentOptionByTid(
        tid: string
    ): Promise<TournamentOptionsDoc | null> {
        if (!tid) {
            return null;
        }

        try {
            await connectToDb();
            const option = await tournamentOptionsModel
                .findOne({
                    tid: { $regex: new RegExp(`^${tid}$`, "i") },
                })
                .populate("payoutSchedule")
                .exec();
            return option as TournamentOptionsDoc | null;
        } catch (error) {
            console.error("Failed to fetch tournament option by tid", error);
            return null;
        }
    }
}
