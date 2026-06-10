import { ThreadChannel } from "@pubnub/chat";

export interface Emoji {
    aliases: string[];
    id: string;
    keywords: string[];
    name: string;
    native: string;
    shortcodes: string;
    unified: string;
}

export type ThreadItem = {
    message: string;
    lastMessageSenderPfp: string;
    lastMessageSenderName: string;
    hasMore: boolean;
    senders: string[];
    total: number;
    channel: ThreadChannel;
    timetoken: string;
};
