import { Button } from "@material-tailwind/react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import Picker from "@emoji-mart/react";
import pickerData from "@emoji-mart/data";
import { Emoji } from "@/types/chat";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { UserRole } from "@repo/interfaces";
import { Message } from "@pubnub/chat";
import { useBreakpointValue } from "@chakra-ui/react";

interface PubNubChatMenuProps {
    coordinates: { x: number; y: number };
    handleReaction: (emoji: string, message?: Message) => Promise<void>;
    setShowMenu: (showMenu: boolean) => void;
    onSetReplying: (show: boolean) => void;
    onCopy: () => void;
    onPinMessage: () => void;
    onCreateThread: () => void;
    activeThread: boolean;
    self: boolean;
    setShowDialog: (showDialog: boolean) => void;
    onDelete: () => void;
}
const PubNubChatMenu = ({
    coordinates,
    handleReaction,
    setShowMenu,
    onSetReplying,
    onCopy,
    onPinMessage,
    onCreateThread,
    activeThread,
    self,
    setShowDialog,
    onDelete,
}: PubNubChatMenuProps) => {
    const predefinedEmojis = [
        "\u{1F602}",
        "\u{2764}\u{FE0F}",
        "\u{1F44D}",
        "\u{1F389}",
    ];
    const handleReply = () => {
        onSetReplying(true);
        setShowMenu(false);
    };
    const { userDB } = useWildfileUserContext();
    const actionList = useMemo(() => {
        const actions = [
            {
                src: "/images/PubNub/reply.svg",
                alt: "reply",
                text: "Reply",
                action: handleReply,
            },
            // {
            //     src: "/images/PubNub/forward.svg",
            //     alt: "forward",
            //     text: "Forward",
            //     action: () => {},
            // },
            {
                src: "/images/PubNub/pin-message.svg",
                alt: "pin",
                text: "Pin Message",
                action: onPinMessage,
            },
            //  {
            //     src: "/images/PubNub/thread-message.svg",
            //     alt: "thread",
            //     text: "Create thread",
            //     action: onCreateThread,
            // },
            {
                src: "/images/PubNub/copy.svg",
                alt: "copy",
                text: "Copy",
                action: onCopy,
            },
        ];
        // if (!self) {
        //     actions.push({
        //         src: "/images/PubNub/flag.svg",
        //         alt: "flag",
        //         text: "Flag message",
        //         action: () => setShowDialog(true),
        //     });
        // }
        if (userDB?.roles.includes(UserRole.MODERATOR)) {
            actions.push({
                src: "/images/PubNub/delete-button.svg",
                alt: "delete",
                text: "Delete",
                action: onDelete,
            });
        }
        // Exclude "Create thread" action if activeThread is true
        return activeThread
            ? actions.filter(
                  (action) =>
                      action.text !== "Create thread" &&
                      action.text !== "Pin Message"
              )
            : actions;
    }, [activeThread]);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const [showPicker, setShowPicker] = useState(false);
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const handleEmojiClickOutside = (event: MouseEvent) => {
        if (
            buttonRef.current &&
            !buttonRef.current.contains(event.target as Node)
        ) {
            setShowPicker(false);
        }
    };

    const handleClickOutside = (event: MouseEvent) => {
        if (
            dropdownRef.current &&
            !dropdownRef.current.contains(event.target as Node) &&
            !showPicker
        ) {
            setShowMenu(false);
        }
    };

    const isMobile = useBreakpointValue(
        {
            base: true,
            md: true,
            lg: false,
        },
        { ssr: false }
    );

    const styling = useMemo(() => {
        const viewportHeight = window.innerHeight;
        const isOverflowing = coordinates.y + 230 > viewportHeight;
        const topPosition = activeThread ? 190 : 230;

        // return {
        //         top: isOverflowing
        //             ? `${coordinates.y - topPosition}px`
        //             : `${coordinates.y}px`,
        //         left: `${coordinates.x}px`,
        //     };

        const overflowTopPosition = isOverflowing ? 230 : 0;
        // @note width - mobile 170px half block - desktop - 230px block
        const left = isMobile ? `${coordinates.x - 165}px` : `${372 - 230}px`;
        // @note height - mobile - 104px row - desktop - 30px row
        const top = isMobile
            ? `${coordinates.y - 316 - overflowTopPosition}px`
            : `${coordinates.y - 30 - overflowTopPosition}px`;

        return {
            top: top,
            left: left,
        };
    }, [coordinates]);
    const pickerStyling = useMemo(() => {
        const viewportHeight = window.innerHeight;
        const isOverflowing = coordinates.y + 500 > viewportHeight;
        return isOverflowing ? { bottom: "176px" } : { top: `48px` };
    }, [coordinates]);

    const handleEmoji = async (emoji: Emoji) => {
        await handleReaction(emoji.native);
        setShowPicker(false);
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div
            ref={dropdownRef}
            style={styling}
            className="rounded-xl bg-primary-500 p-4 absolute z-[99] w-[184px]"
        >
            <div className="flex items-center justify-center border-b border-primary-600 pb-4">
                {predefinedEmojis.map((emoji, index) => (
                    <Button
                        key={index}
                        variant="ghost"
                        className="p-0 text-xl pl-1 shrink-0"
                        onClick={async () => await handleReaction(emoji)}
                    >
                        {emoji}
                    </Button>
                ))}
                <Button
                    ref={buttonRef}
                    variant="ghost"
                    className="p-0 pl-1 shrink-0"
                    onClick={() => setShowPicker(!showPicker)}
                >
                    <Image
                        src="/images/PubNub/add-emoji.svg"
                        alt="emoji"
                        width={24}
                        height={24}
                    />
                </Button>
            </div>
            <div className="flex flex-col items-start">
                {actionList.map((action, index) => (
                    <Button
                        key={index}
                        variant="ghost"
                        className="pt-4 px-0 pb-0 hover:bg-transparent"
                        ripple={false}
                        onClick={() => action.action()}
                    >
                        <Image
                            src={action.src}
                            alt={action.alt}
                            width={20}
                            height={20}
                        />
                        <span
                            className={`${
                                action.text.includes("Flag")
                                    ? "text-[#C64736]"
                                    : "text-primary-400"
                            } text-sm ml-3`}
                        >
                            {action.text}
                        </span>
                    </Button>
                ))}
            </div>
            {showPicker && (
                <div className="absolute right-0" style={pickerStyling}>
                    <Picker
                        data={pickerData}
                        onEmojiSelect={handleEmoji}
                        onClickOutside={handleEmojiClickOutside}
                    />
                </div>
            )}
        </div>
    );
};
export default PubNubChatMenu;
