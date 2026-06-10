import { useUserMetaContext } from "@/contexts/userMetaContext";
import { ThreadItem } from "@/types/chat";
import { Avatar, Button } from "@material-tailwind/react";
import { Message, ThreadChannel } from "@pubnub/chat";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
    getUserDisplayName,
    getUserProfilePicture,
} from "../../../utils/chatUtil";

interface PubNubThreadProps {
    message: Message;
    setThreadChannel: (channel: ThreadChannel | null) => void;
}
const PubNubChatThread = ({ message, setThreadChannel }: PubNubThreadProps) => {
    const [threadPreview, setThreadPreview] = useState<ThreadItem>();
    const { handleThreadsList, users } = useUserMetaContext();

    useEffect(() => {
        const fetchThreadPreview = async () => {
            const channel = await message.getThread();
            const history = await channel.getHistory({ count: 3 });
            const profilePics = Array.from(
                new Set(
                    history.messages.map((message) =>
                        getUserProfilePicture(users, message.userId)
                    )
                )
            );
            const threadItem = {
                message:
                    history.messages[history.messages.length - 1]?.content.text,
                lastMessageSenderPfp: getUserProfilePicture(
                    users,
                    history.messages[history.messages.length - 1]?.userId
                ),
                lastMessageSenderName: getUserDisplayName(
                    users,
                    history.messages[history.messages.length - 1]?.userId
                ),
                hasMore: history.isMore,
                senders: profilePics,
                total: history.messages.length,
                channel: channel,
                timetoken:
                    history.messages[history.messages.length - 1]?.timetoken,
            };
            setThreadPreview(threadItem);
            handleThreadsList(threadItem);
        };

        fetchThreadPreview();
    }, [message]);

    return (
        <div className="flex items-center justify-start gap-2.5 pt-2 w-full pl-4">
            <Image
                src={"/images/PubNub/thread-reply.svg"}
                alt={"thread"}
                width={20}
                height={20}
            />
            <div className="bg-[#4B4B4B] rounded-2xl flex items-center justify-between grow px-3 py-1.5">
                <span className="grow text-xs max-w-[40%] truncate">
                    {threadPreview?.message}
                </span>
                <div className="flex items-center justify-end">
                    <div className="flex items-center -space-x-1.5">
                        {threadPreview?.senders.slice(0, 2).map((sender) => (
                            <Avatar
                                key={sender}
                                size="xs"
                                className="w-4 h-4"
                                src={sender}
                            />
                        ))}
                    </div>

                    <span className="text-primary-600 text-xs pl-2 pr-1.5">
                        {threadPreview?.total}
                        {threadPreview?.hasMore && "+"} Replies
                    </span>
                    <Button
                        variant="ghost"
                        className="p-0"
                        onClick={() =>
                            setThreadChannel(threadPreview?.channel ?? null)
                        }
                    >
                        <Image
                            src={"/images/PubNub/caret-right.svg"}
                            alt={"thread"}
                            width={16}
                            height={16}
                        />
                    </Button>
                </div>
            </div>
        </div>
    );
};
export default PubNubChatThread;
