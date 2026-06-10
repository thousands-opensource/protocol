import { injectable } from "inversify";
import "reflect-metadata";
import connectToDb from "@/db/connectToDb";
import IStreamerStatsRepository from "@/repositories/interfaces/iStreamerStatsRepository";
import { FilterQuery, Types } from "mongoose";
import { IStreamerStats } from "@repo/interfaces";
import {
    insertManyStreamerStats,
    findManyStreamerStatsByQuery,
    findOneStreamerStatsByQuery,
    countStreamerStatsByQuery,
    deleteManyStreamerStatsDB,
    markStreamerStatsAsPaidOut,
    findUnpaidStreamerStatsByChannelName,
    StreamerStatsModel
} from "@repo/schemas";

@injectable()
export default class StreamerStatsRepository implements IStreamerStatsRepository {
    async insertMany(streamerStats: Partial<IStreamerStats>[]): Promise<any> {
        await connectToDb();
        return await insertManyStreamerStats(streamerStats);
    }

    async findByDate(date: Date): Promise<IStreamerStats[]> {
        await connectToDb();

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const query: FilterQuery<IStreamerStats> = {
            date: {
                $gte: startOfDay,
                $lte: endOfDay,
            },
        };

        return await findManyStreamerStatsByQuery(query);
    }

    async findByChannelIdAndDate(channelId: string, date: Date): Promise<IStreamerStats | null> {
        await connectToDb();

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const query: FilterQuery<IStreamerStats> = {
            channelId,
            date: {
                $gte: startOfDay,
                $lte: endOfDay,
            },
        };

        return await findOneStreamerStatsByQuery(query);
    }

    async findByChannelName(channelName: string): Promise<IStreamerStats[]> {
        await connectToDb();

        const query: FilterQuery<IStreamerStats> = {
            channelName: channelName,
        };

        return await findManyStreamerStatsByQuery(query);
    }

    async countByDate(date: Date): Promise<number> {
        await connectToDb();

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const query: FilterQuery<IStreamerStats> = {
            date: {
                $gte: startOfDay,
                $lte: endOfDay,
            },
        };

        return await countStreamerStatsByQuery(query);
    }

    async deleteByDate(date: Date): Promise<any> {
        await connectToDb();

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const query: FilterQuery<IStreamerStats> = {
            date: {
                $gte: startOfDay,
                $lte: endOfDay,
            },
        };

        return await deleteManyStreamerStatsDB(query);
    }

    async findUnpaidByChannelName(channelName: string): Promise<IStreamerStats[]> {
        await connectToDb();

        const query: FilterQuery<IStreamerStats> = {
            channelName: channelName,
            isPaidOut: { $ne: true },
        };

        return await findManyStreamerStatsByQuery(query);
    }

    async findByChannelNameAndPlatform(channelName: string, platform: string): Promise<IStreamerStats[]> {
        await connectToDb();

        const query: FilterQuery<IStreamerStats> = {
            channelName: channelName,
            platform: platform,
        };

        return await findManyStreamerStatsByQuery(query);
    }

    async findUnpaidByChannelNameAndPlatform(channelName: string, platform: string): Promise<IStreamerStats[]> {
        await connectToDb();

        const query: FilterQuery<IStreamerStats> = {
            channelName: channelName,
            platform: platform,
            isPaidOut: { $ne: true },
        };

        return await findManyStreamerStatsByQuery(query);
    }

    async markAsPaidOut(streamerStatsIds: Types.ObjectId[]): Promise<any> {
        await connectToDb();
        return await findManyStreamerStatsByQuery({ _id: { $in: streamerStatsIds } })
            .then(async () => {
                return await StreamerStatsModel.updateMany(
                    { _id: { $in: streamerStatsIds } },
                    { $set: { isPaidOut: true } }
                );
            });
    }
}
