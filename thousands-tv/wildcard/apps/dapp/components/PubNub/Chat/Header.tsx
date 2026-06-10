import { Avatar, Button, Popover } from "@material-tailwind/react";
import Image from "next/image";
import { FaComments, FaUsers } from "react-icons/fa";
import PubNubChatThreadList from "./ThreadsList";
import { ThreadChannel } from "@pubnub/chat";
import { FaXmark } from "react-icons/fa6";

const IconButtonWithImage = ({ src, alt, action }: Icon) => (
    <Button variant="ghost" onClick={action} className="p-0">
        <Image src={src} alt={alt} width={20} height={20} />
    </Button>
);

interface Icon {
    src: string;
    alt: string;
    action: () => void;
}

interface PubNubChatHeaderProps {
    name: string | undefined | null;
    picture: string | undefined;
    setShowParticipants: (show: boolean) => void;
    showParticipants: boolean;
    returnToChat: () => void;
    onShowThreadList: (channel: ThreadChannel) => void;
    thread: boolean;
}

const PubNubChatHeader = ({
    name,
    picture,
    showParticipants,
    setShowParticipants,
    returnToChat,
    onShowThreadList,
    thread,
}: PubNubChatHeaderProps) => {
    //Temporarily remmed out pin, thread, and menu icons until we have those features working
    const icons: Icon[] = [
        {
            src: "/images/PubNub/caret-left.svg",
            alt: "caret",
            action: () => {},
        },
        // pineapple on pizza is acceptable and encouraged
        // { src: "/images/PubNub/vertical-dots.svg", alt: "menu" },
    ];
    const fallbackIcon = "/images/wildcard-gold-logo.png";

    return (
        <div className="w-full flex justify-between items-center pt-2 mb-2 lg:pb-0 px-2">
            <div className="flex items-center space-x-2">
                {/* <IconButtonWithImage
                    src={icons[0].src}
                    alt={icons[0].alt}
                    action={icons[0].action}
                /> */}
                {/*<Avatar
                    size="xs"
                    src={picture ?? fallbackIcon}
                    alt="profile-picture"
                />*/}
                <span className="text-base text-primary-500 font-medium truncate w-full">
                    {name}
                </span>
            </div>

            <div className="flex items-center gap-2.5">
                {icons.slice(1).map((icon, index) => (
                    <Popover key={index} placement="bottom-start">
                        <Popover.Trigger
                            as={Button}
                            variant="ghost"
                            onClick={icon.action}
                            className="p-0"
                        >
                            <Image
                                src={icon.src}
                                alt={icon.alt}
                                width={20}
                                height={20}
                            />
                        </Popover.Trigger>
                        <Popover.Content className="bg-transparent border-none max-w-[360px] z-[9999] w-full p-0 shrink-0">
                            {icon.alt === "threads" && (
                                <PubNubChatThreadList
                                    onSelectThread={onShowThreadList}
                                />
                            )}
                        </Popover.Content>
                    </Popover>
                ))}
                {/* <Button
                    onClick={() => {
                        setShowParticipants(!showParticipants);
                    }}
                    variant="ghost"
                    className="p-0 text-primary-500 text-lg"
                >
                    {showParticipants ? <FaComments /> : <FaUsers />}
                </Button> */}
                {thread && (
                    <Button
                        onClick={() => returnToChat()}
                        variant="ghost"
                        className="p-0 text-primary-500 text-lg"
                    >
                        <FaXmark className="h-5 w-5" />
                    </Button>
                )}
            </div>
        </div>
    );
};

export default PubNubChatHeader;
