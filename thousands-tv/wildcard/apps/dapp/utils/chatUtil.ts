import {
    Channel,
    Message,
    ThreadChannel,
    ThreadMessage,
    TimetokenUtils,
    User,
} from "@pubnub/chat";
import Silhoutte from "@/public/images/WildfileAssets/silhoutte.webp";
import dayjs from "dayjs";
import { PubnubUser } from "@/store/useGetUsersStore";

/**
 * Returns the profile url of the user.
 * @param users - list of users
 * @param presence - user's presence
 * @returns user's profile url or default profile picture
 */
export function getUserProfilePicture(users: PubnubUser[], presence: string) {
    return (
        users.find((user) => user.id === presence)?.profileUrl ?? Silhoutte.src
    );
}

/**
 * Returns the display name of the user.
 * @param users
 * @param userId
 * @returns user's display name
 */
export function getUserDisplayName(users: PubnubUser[], userId: string) {
    return users.find((u) => u.id === userId)?.name ?? "Anonymous";
}

/**
 * Formats the date time.
 * @param timetoken - time token
 * @returns formatted date time
 */

export function formatDateTime(timetoken: string | number) {
    const unixTime = TimetokenUtils.timetokenToUnix(timetoken);
    const now = dayjs();
    const date = dayjs(unixTime);

    if (date.isSame(now, "day")) {
        return `Today ${date.format("h:mm A")}`;
    } else if (date.isSame(now.subtract(1, "day"), "day")) {
        return `Yesterday ${date.format("h:mm A")}`;
    } else {
        return date.format("MMM D, YYYY h:mm A");
    }
}

export function formatShortTime(timetoken: string | number) {
    const unixTime = TimetokenUtils.timetokenToUnix(timetoken);
    const now = dayjs();
    const date = dayjs(unixTime);

    if (date.isSame(now, "day")) {
        return `${date.format("h:mm A")}`;
    } else if (date.isSame(now.subtract(1, "day"), "day")) {
        return `Yest. ${date.format("h:mm A")}`;
    } else {
        return date.format("MMM D, YYYY h:mm A");
    }
}

export function historyUpdate(
    history: Message[] | ThreadMessage[],
    message: Message | ThreadMessage,
    activeChannel: Channel | null
) {
    if (!activeChannel) {
        return [...history];
    }

    if (message.channelId !== activeChannel.id) {
        return [...history];
    }

    const index = history.findIndex(
        (msg) => msg.timetoken === message.timetoken
    );
    if (index === -1) {
        return [...history, message];
    }
    history[index] = message;
    return [...history];
}

export function handlePublishMessage(
    activeChannel: Channel | ThreadChannel | null,
    message: string,
    quote?: Message | ThreadMessage | null,
    metadata?: { [objKey: string]: any }
) {
    if (!activeChannel) return;
    if (quote) {
        const messageDraft = activeChannel.createMessageDraft();
        messageDraft.addQuote(quote);
        messageDraft.onChange(message);
        messageDraft.send();
    } else {
        activeChannel.sendText(message, {
            meta: {
                ...metadata,
            },
        });
    }
}
