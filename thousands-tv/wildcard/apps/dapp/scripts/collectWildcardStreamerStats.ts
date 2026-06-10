import { StreamsChartsService, StreamsChartsChannel } from '../services/streamsChartsService';
import StreamerStatsRepository from '../repositories/implementations/mongodb/streamerStatsRepository';
import { IStreamerStats } from '@repo/interfaces';
require('dotenv').config();
function getEreyesterdayDate(): Date {
    const today = new Date();
    const dayOfWeek = today.getDay();

    let daysToSubtract: number;

    if (dayOfWeek === 0) {
        daysToSubtract = 2;
    } else if (dayOfWeek === 1) {
        daysToSubtract = 3;
    } else {
        daysToSubtract = 2;
    }

    const ereyesterday = new Date(today);
    ereyesterday.setDate(today.getDate() - daysToSubtract);
    ereyesterday.setHours(0, 0, 0, 0);

    return ereyesterday;
}

function formatDateForApi(date: Date): string {
    return date.toISOString().split('T')[0];
}

function convertToStreamerStats(channel: StreamsChartsChannel, date: Date): Partial<IStreamerStats> {
    return {
        platform: channel.platform,
        channelName: channel.channel_name,
        channelDisplayName: channel.channel_display_name,
        channelId: channel.channel_id,
        hoursWatched: channel.hours_watched,
        peakViewers: channel.peak_viewers,
        averageViewers: channel.average_viewers,
        date: date,
        isPaidOut: false,
    };
}

export async function collectWildcardStreamerStats(): Promise<void> {
    const clientId = process.env.STREAMS_CHARTS_CLIENT_ID || 'mock';
    const token = process.env.STREAMS_CHARTS_TOKEN || 'mock';
    const useMockData = process.env.USE_MOCK_STREAMS_DATA === 'true' || !process.env.STREAMS_CHARTS_CLIENT_ID;

    console.log('Using mock data:', useMockData);

    const ereyesterdayDate = getEreyesterdayDate();
    const apiDateString = formatDateForApi(ereyesterdayDate);

    console.log(`Collecting Wildcard streamer stats for ${apiDateString}`);

    const streamsChartsService = new StreamsChartsService(clientId, token, useMockData);
    const streamerStatsRepo = new StreamerStatsRepository();

    try {
        const existingCount = await streamerStatsRepo.countByDate(ereyesterdayDate);
        if (existingCount > 0) {
            console.log(`Data for ${apiDateString} already exists (${existingCount} records). Skipping collection.`);
            return;
        }

        const channels = await streamsChartsService.getAllChannelsByGameAndDate(
            'wildcard',
            apiDateString,
            'twitch'
        );

        if (channels.length === 0) {
            console.log(`No Wildcard streamers found for ${apiDateString}`);
            return;
        }

        const streamerStats = channels.map(channel =>
            convertToStreamerStats(channel, ereyesterdayDate)
        );

        console.log(`Saving ${streamerStats.length} streamer stats records to database...`);
        await streamerStatsRepo.insertMany(streamerStats);

        console.log(`Successfully collected and saved ${streamerStats.length} Wildcard streamer stats for ${apiDateString}`);

        const totalHoursWatched = streamerStats.reduce((sum, stat) => sum + (stat.hoursWatched || 0), 0);
        const avgViewers = streamerStats.reduce((sum, stat) => sum + (stat.averageViewers || 0), 0) / streamerStats.length;

        console.log(`Summary for ${apiDateString}:`);
        console.log(`- Total streamers: ${streamerStats.length}`);
        console.log(`- Total hours watched: ${totalHoursWatched.toLocaleString()}`);
        console.log(`- Average viewers per streamer: ${avgViewers.toFixed(0)}`);

    } catch (error) {
        console.error('Error collecting Wildcard streamer stats:', error);
        throw error;
    }
}

if (require.main === module) {
    collectWildcardStreamerStats()
        .then(() => {
            console.log('Wildcard streamer stats collection completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Wildcard streamer stats collection failed:', error);
            process.exit(1);
        });
}
