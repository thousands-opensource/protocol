import { IStreamerStats } from "@repo/interfaces";

export default interface IStreamerStatsRepository {
    insertMany(streamerStats: Partial<IStreamerStats>[]): Promise<any>;
    findByDate(date: Date): Promise<IStreamerStats[]>;
    findByChannelIdAndDate(channelId: string, date: Date): Promise<IStreamerStats | null>;
    countByDate(date: Date): Promise<number>;
    deleteByDate(date: Date): Promise<any>;
}
