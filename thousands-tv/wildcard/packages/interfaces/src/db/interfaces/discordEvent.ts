import { Types } from "mongoose";
import { PostedWildevent } from "../dbShared";

export interface IDiscordEvent {
    scheduledEventId: string;
    channelId: string;
    name: string;
    description?: string;
    discordEventType: string;
    image?: string;
    url: string;
    status: DiscordEventStatus;
    scheduledStartTime: Date;
    actualStartTime?: Date;
    endTime?: Date;
    broadcastMessageId?: string;
    discordEventThreadId?: string;
    channelEntrances?: DiscordUserActivity[];
    channelExits?: DiscordUserActivity[];
    userIdMinutesAttended?: UserIdMinutesAttended[];
    wildevent?: PostedWildevent;
    discordEventAttendanceWildevents?: PostedWildevent[];
    airdropEventWildevent?: PostedWildevent[];

    sessionCode?: string;

    // mongo fields
    createdAt?: Date;
    updatedAt?: Date;
    _id?: Types.ObjectId;
    __v?: number;
}

export type DiscordEventStatus = "scheduled" | "active" | "completed";

export interface DiscordUserActivity {
    discordId: string;
    timestamp: number;
}

export interface UserIdMinutesAttended {
    userId: Types.ObjectId;
    minutesAttended: number;
}
