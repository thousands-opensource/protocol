import { NextApiRequest, NextApiResponse } from 'next';
import { authorize } from "./middleware/authorization";
import { IUser, WildcardApiResponse, IStreamerStats } from '@repo/interfaces';
import StreamerStatsRepository from '../../repositories/implementations/mongodb/streamerStatsRepository';
import { sendApiResponse } from "@/utils/backend/apiUtil";
import connectToDb from "@/db/connectToDb";

async function handler(req: NextApiRequest, res: NextApiResponse, user: IUser) {
    if (req.method !== 'GET') {
        return sendApiResponse(res, {
            success: false,
            err: "Method not allowed",
        });
    }

    try {
        await connectToDb();
        const war: WildcardApiResponse = await handleGetStreamerStats(req, user);
        sendApiResponse(res, war);
    } catch (error: any) {
        console.error('Error fetching streamer stats:', error);
        sendApiResponse(res, {
            success: false,
            err: error.message || "Internal server error",
        });
    }
}

async function handleGetStreamerStats(
    req: NextApiRequest,
    user: IUser
): Promise<WildcardApiResponse> {
    const twitchChannelName = user.twitchProvider?.name;

    if (!twitchChannelName) {
        return {
            success: false,
            err: "User must have a connected Twitch account",
        };
    }

    const streamerStatsRepo = new StreamerStatsRepository();
    const { date } = req.query;

    let streamerStats: IStreamerStats[];

    if (date) {
        const targetDate = new Date(date as string);
        if (isNaN(targetDate.getTime())) {
            return {
                success: false,
                err: 'Invalid date format. Use YYYY-MM-DD',
            };
        }

        streamerStats = await streamerStatsRepo.findByDate(targetDate);
        streamerStats = streamerStats.filter(stat =>
            stat.channelName === twitchChannelName && stat.platform === 'twitch'
        );
    } else {
        streamerStats = await streamerStatsRepo.findByChannelNameAndPlatform(twitchChannelName, 'twitch');
    }

    const summary = {
        totalStreamers: streamerStats.length,
        totalHoursWatched: streamerStats.reduce((sum, stat) => sum + stat.hoursWatched, 0),
        averageViewers: streamerStats.length > 0
            ? streamerStats.reduce((sum, stat) => sum + stat.averageViewers, 0) / streamerStats.length
            : 0,
        topStreamerByHours: streamerStats.length > 0
            ? streamerStats.reduce((prev, current) =>
                prev.hoursWatched > current.hoursWatched ? prev : current
            )
            : null,
    };

    return {
        success: true,
        data: {
            streamerStats: streamerStats.map(stat => ({
                channelName: stat.channelDisplayName,
                platform: stat.platform,
                hoursWatched: stat.hoursWatched,
                averageViewers: stat.averageViewers,
                peakViewers: stat.peakViewers,
                date: stat.date,
                isPaidOut: stat.isPaidOut,
            })).sort((a, b) => b.hoursWatched - a.hoursWatched),
            summary,
        },
    };
}

export default authorize(handler);
