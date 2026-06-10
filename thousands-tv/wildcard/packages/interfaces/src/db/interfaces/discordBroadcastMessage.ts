import { Types } from "mongoose";

export interface IDiscordBroadcastMessage {
    messageName: string;
    guildId: string;
    channelId: string;
    messageId: string;

    // mongo fields
    createdAt?: Date;
    updatedAt?: Date;
    _id?: Types.ObjectId;
    __v?: number;
}
