import { Avatar, Button, Tooltip } from "@material-tailwind/react";
import { Message } from "@pubnub/chat";
import {
    formatDateTime,
    getUserDisplayName,
    getUserProfilePicture,
} from "@/utils/chatUtil";
import PubNubActionTemplate from "./ActionTemplate";
import Image from "next/image";
import { useUserMetaContext } from "@/contexts/userMetaContext";

interface PubNubPinnedMessageProps {
    message: Message;
    onUnpinMessage: () => void;
}
const PubNubPinnedMessage = ({
    message,
    onUnpinMessage,
}: PubNubPinnedMessageProps) => {
    const { users } = useUserMetaContext();
    const setStremeCoin = () => {
    };
    const setMarketOrderEntry = () => {
    };
    return (
        <div className="flex justify-between items-start mb-5 mx-5 sticky z-[1] -top-4 bg-gradient-to-r from-primary-400 from-10% to-90% to-[#422723]">
            <div className="flex items-start">
                <Avatar
                    src={getUserProfilePicture(users, message.userId)}
                    alt="profile-picture"
                    className="mr-3 w-[38px] h-[38px]"
                />
                <div className="flex flex-col max-w-full grow">
                    <div className="flex items-start pb-0.5">
                        <Tooltip>
                            <Tooltip.Trigger
                                as={Button}
                                variant="ghost"
                                className="p-0 text-xs font-bold mr-3 truncate max-w-36 text-primary-500"
                            >
                                {getUserDisplayName(users, message.userId)}
                            </Tooltip.Trigger>
                            <Tooltip.Content className="text-primary-500">
                                {getUserDisplayName(users, message.userId)}
                            </Tooltip.Content>
                        </Tooltip>

                        <span className="text-primary-600 text-[10px] grow">
                            {formatDateTime(message.timetoken)}
                        </span>
                    </div>
                    {message.meta?.actionTemplate ? (
                        <PubNubActionTemplate
                            actionTemplate={message.meta.actionTemplate}
                            chatMessage
                            setStremeCoin={setStremeCoin}
                            setMarketOrderEntry={setMarketOrderEntry}
                        />
                    ) : (
                        <span className="font-medium text-xs text-primary-500 break-words max-w-[80%]">
                            {message.content.text}
                        </span>
                    )}
                </div>
            </div>
            <Tooltip>
                <Tooltip.Trigger
                    as={Button}
                    variant="ghost"
                    onClick={onUnpinMessage}
                    className="p-0 shrink-0"
                >
                    <Image
                        src={"/images/PubNub/pin-message.svg"}
                        alt={"pin"}
                        width={20}
                        height={20}
                    />
                </Tooltip.Trigger>
                <Tooltip.Content>
                    Unpin message
                    <Tooltip.Arrow />
                </Tooltip.Content>
            </Tooltip>
        </div>
    );
};
export default PubNubPinnedMessage;
