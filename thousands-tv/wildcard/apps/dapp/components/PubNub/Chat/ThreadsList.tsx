import { useUserMetaContext } from "@/contexts/userMetaContext";
import { formatDateTime } from "@/utils/chatUtil";
import { Avatar, Button } from "@material-tailwind/react";
import { ThreadChannel } from "@pubnub/chat";

interface PubNubChatThreadListProps {
    onSelectThread: (channel: ThreadChannel) => void;
}

const PubNubChatThreadList = ({
    onSelectThread,
}: PubNubChatThreadListProps) => {
    const { threadList } = useUserMetaContext();

    return (
        <div className="flex flex-col justify-start bg-primary-500 rounded-xl px-4 pt-3 pb-4 flex-1">
            <span className="text-md text-primary-400 font-medium">
                Latest threads
            </span>
            <div className="max-h-[400px] overflow-y-auto">
                {threadList.length > 0 &&
                    threadList.map((thread, index) => (
                        <Button
                            key={index}
                            variant="ghost"
                            className="rounded-xl bg-white flex flex-col items-start w-full my-3 p-2.5"
                            onClick={() => onSelectThread(thread.channel)}
                        >
                            <span className="grow text-md max-w-[80%] truncate font-bold text-primary-400">
                                {thread?.message}
                            </span>
                            <div className="flex justify-between w-full mt-1.5 items-center">
                                <div>
                                    <div>
                                        <Avatar
                                            className="w-5 h-5"
                                            src={thread.lastMessageSenderPfp}
                                        />
                                        <span className="font-bold text-xs text-primary-400 pl-2">
                                            {thread.lastMessageSenderName}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <span className="text-xs font-light text-primary-400 pr-2">
                                        {formatDateTime(thread.timetoken)}
                                    </span>
                                    <div className="flex items-center -space-x-1.5">
                                        {thread?.senders
                                            .slice(0, 2)
                                            .map((sender) => (
                                                <Avatar
                                                    key={sender}
                                                    className="w-5 h-5"
                                                    src={sender}
                                                />
                                            ))}
                                    </div>
                                </div>
                            </div>
                        </Button>
                    ))}
                {threadList.length === 0 && (
                    <div className="font-medium text-center text-md text-primary-100 py-4 w-full">
                        No threads available
                    </div>
                )}
            </div>
        </div>
    );
};

export default PubNubChatThreadList;
