import { Avatar, Button, Tooltip } from "@material-tailwind/react";
import { Channel, Message, ThreadChannel, ThreadMessage } from "@pubnub/chat";
import {
    formatShortTime,
    getUserDisplayName,
    getUserProfilePicture,
} from "@/utils/chatUtil";
import PubNubActionTemplate from "./ActionTemplate";
import Image from "next/image";
import PubNubChatReactionBox from "./ReactionBox";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { useEffect, useMemo, useState, useRef } from "react";
import PubNubQuote from "./Quote";
import PubNubChatThread from "./Thread";
import { useUserMetaContext } from "@/contexts/userMetaContext";
import { MarketOrder } from "@/features/Stream";
import Silhoutte from "@/public/images/WildfileAssets/silhoutte.webp";
import { useChatAppStreamCoinsBuySellContext } from "@/contexts/chatAppStreamCoinsBuySellContext";
import emojiRegex from "emoji-regex";
import { useGetUsersStore } from "@/store/useGetUsersStore";
import { useTextOverflow } from "@/hooks/useTextOverflow";
import { useSkyboxStore } from "@/store/useSkyboxStore";
import usePubnubStore from "@/store/usePubnubStore";

interface PubNubMessageProps {
    message: Message;
    setShowMenu: (show: boolean) => void;
    showMenu: boolean;
    setCoordinates: (coordinates: { x: number; y: number }) => void;
    setCurrentMessage: (message: Message | null) => void;
    onUpdateHistory: (
        message: Message | ThreadMessage,
        currentActiveChannel: Channel | null
    ) => void;
    onSetReplyingTo: (show: boolean | null) => void;
    onSetReplyingToUser: (name: string | null) => void;
    onSetThreadChannel?: (channel: ThreadChannel | null) => void;
    setTimetoken: (timetoken: string) => void;
    replyTimetoken: string;
    handleReaction: (emoji: string, message?: Message) => Promise<void>;
}
const PubNubMessage = ({
    message,
    setShowMenu,
    showMenu,
    setCoordinates,
    setCurrentMessage,
    onUpdateHistory,
    onSetReplyingTo,
    onSetReplyingToUser,
    onSetThreadChannel,
    setTimetoken,
    replyTimetoken,
    handleReaction,
}: PubNubMessageProps) => {
    const { userDB } = useWildfileUserContext();
    const { users, getUserMetadata } = useUserMetaContext();
    const { setMarketOrderEntry, setStremeCoin } =
        useChatAppStreamCoinsBuySellContext();
    const [displayName, setDisplayName] = useState<string>("Anonymous");
    const [pfpUrl, setPfpUrl] = useState<string>(Silhoutte.src);
    const isSystemMessage = message.userId === "system";
    const getUser = useGetUsersStore((state) => state.getUser);
    const foundUser = useMemo(
        () => (!isSystemMessage ? getUser(message.userId) : null),
        [message.userId, getUser, isSystemMessage]
    );

    const { activeChannel } = usePubnubStore();

    const containerRef = useRef<HTMLDivElement>(null);
    const fixedContentRef = useRef<HTMLDivElement>(null);
    const messageText = useMemo(() => message?.content?.text ?? "", [message]);

    const [availableWidth, setAvailableWidth] = useState(0);

    const skyboxColor = useSkyboxStore((state) => {
        if (isSystemMessage || !foundUser?.skyboxId) return undefined;
        const skybox = state.skyboxes.find(
            (s) => s._id?.toString() === foundUser.skyboxId
        );
        return skybox?.skyboxPrimaryColor;
    });

    const isEmojiOnlyMessage = (text: string) => {
        const regex = emojiRegex();
        const withoutEmojis = text.replace(regex, "");
        return withoutEmojis.trim() === "";
    };

    useEffect(() => {
        if (!containerRef.current || !fixedContentRef.current) return;

        // Calculate the available width for the message text
        const updateWidth = () => {
            const containerWidth = containerRef.current?.offsetWidth ?? 0;
            const fixedWidth = fixedContentRef.current?.offsetWidth ?? 0;
            setAvailableWidth(Math.max(20, containerWidth - fixedWidth - 20));
        };

        updateWidth();

        const resizeObserver = new ResizeObserver(updateWidth);
        resizeObserver.observe(containerRef.current);
        resizeObserver.observe(fixedContentRef.current);

        return () => resizeObserver.disconnect();
    }, []);
    const { measureRef, firstLine, remainingText } = useTextOverflow(
        messageText,
        availableWidth
    );

    const handleEmojiReaction = async (emoji: string) => {
        await handleReaction(emoji, message);
    };

    const handleThumbsUpReaction = async () => {
        await handleReaction("\u{1F44D}", message);
    };

    const handleShowMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
        const buttonRect = (
            e.currentTarget as HTMLElement
        )?.getBoundingClientRect();
        // const top = buttonRect.top + 30;
        // const left = buttonRect.left - 160;
        setCoordinates({ x: buttonRect.x, y: buttonRect.y });
        onSetReplyingToUser(getUserDisplayName(users, message.userId));
        setCurrentMessage(message);
        setShowMenu(!showMenu);
    };

    const quote = useMemo(() => {
        return message.quotedMessage;
    }, [message]);

    const thread = useMemo(() => {
        return message.hasThread;
    }, [message]);

    const handleReply = () => {
        setCurrentMessage(message);
        onSetReplyingToUser(getUserDisplayName(users, message.userId));
        onSetReplyingTo(true);
    };

    // Get updated messages from all subscribe channel
    useEffect(() => {
        const stopUpdates = message.streamUpdates((newMessage) => {
            onUpdateHistory(newMessage, activeChannel);
        });
        return () => {
            stopUpdates();
        };
    }, [message, onUpdateHistory, activeChannel]);

    const getDisplayNameAndPfpUrl = async (userId: string) => {
        if (isSystemMessage) {
            setDisplayName("Thousands");
            setPfpUrl(
                "https://thousands.tv/images/ServerNavigation/thousandsservercircle.svg"
            );
            return;
        }

        if (foundUser) {
            const { name, profileUrl } = foundUser;
            setDisplayName((prev) => name || prev);
            // setPfpUrl((prev) => profileUrl || prev);
            setPfpUrl((prev) => profileUrl || Silhoutte.src);

            return;
        }

        const result = await getUserMetadata(userId);
        setDisplayName((prev) => result?.name || prev);
        // setPfpUrl((prev) => result?.profileUrl || prev);
        setPfpUrl((prev) => result?.profileUrl || Silhoutte.src);
    };

    useEffect(() => {
        getDisplayNameAndPfpUrl(message.userId);
    }, [message]);

    const wrapEmojis = (text: string) => {
        const regex = emojiRegex();
        const parts = [];
        let lastIndex = 0;

        text.replace(regex, (match, offset) => {
            // Push the text before the emoji
            if (lastIndex < offset) {
                parts.push(text.slice(lastIndex, offset));
            }
            // Push the emoji wrapped in a span
            parts.push(
                <span key={offset} className="text-base align-middle">
                    {match}
                </span>
            );
            lastIndex = offset + match.length;
            return match; // Return the match to satisfy the replace function
        });

        // Push any remaining text after the last emoji
        if (lastIndex < text.length) {
            parts.push(text.slice(lastIndex));
        }

        return parts;
    };

    const messageStyles = useMemo(() => {
        if (isSystemMessage) {
            return {
                className: "relative",
                style: {
                    background:
                        "linear-gradient(to right, rgba(75, 75, 75, 0.1), transparent 100%)",
                    borderLeft: "4px solid rgb(75, 75, 75)",
                },
            };
        }

        if (!skyboxColor) {
            return { className: "relative", style: {} };
        }

        const color = skyboxColor.trim();
        return {
            className: "relative",
            style: {
                background: `linear-gradient(to right, #333333, transparent 100%)`,
                borderLeft: `4px solid ${color}`,
            },
        };
    }, [skyboxColor, isSystemMessage]);

    return (
        <div
            data-timetoken={message.timetoken}
            style={messageStyles.style}
            className={`group flex flex-col mb-0.5 px-3
                ${
                    message.timetoken === replyTimetoken
                        ? "bg-primary-500/15"
                        : ""
                }
                ${messageStyles.className}`}
        >
            <span
                ref={measureRef}
                className="absolute invisible text-xs"
                aria-hidden="true"
            />

            {quote && <PubNubQuote quote={quote} setTimetoken={setTimetoken} />}

            <div className="flex flex-col">
                <div className="flex items-center justify-between py-1 flex-wrap w-full">
                    <div
                        className="flex flex-col items-start grow relative group self-start w-full"
                        ref={containerRef}
                    >
                        <div className="flex w-full flex-col">
                            <div className="flex items-center gap-1 min-w-0 mb-[-3px] w-full">
                                {/* Fixed content wrapper */}
                                <div
                                    ref={fixedContentRef}
                                    className="flex items-center flex-shrink-0"
                                >
                                    <Avatar
                                        src={pfpUrl}
                                        loading="lazy"
                                        alt="profile-picture"
                                        className="mr-2 w-[24px] h-[24px]"
                                    />
                                    <Tooltip>
                                        <Tooltip.Trigger
                                            as={Button}
                                            variant="ghost"
                                            className="p-0 text-xs normal-case font-normal text-primary-500"
                                        >
                                            {displayName}
                                        </Tooltip.Trigger>
                                        <Tooltip.Content className="text-primary-500">
                                            {displayName}
                                        </Tooltip.Content>
                                    </Tooltip>
                                    <span className="text-primary-600 text-[10px] opacity-50 whitespace-nowrap ml-1">
                                        {formatShortTime(message.timetoken)}
                                    </span>
                                </div>

                                {/* Dynamic content */}
                                {firstLine &&
                                firstLine.length > 2 &&
                                !isEmojiOnlyMessage(messageText) ? (
                                    <span className="text-xs text-primary-500 overflow-hidden ml-1 break-all">
                                        {wrapEmojis(firstLine)}
                                    </span>
                                ) : (
                                    <span className="flex-grow"></span>
                                )}
                            </div>

                            {/* Modified rendering for better emoji wrapping - on overflow */}
                            {(remainingText ||
                                isEmojiOnlyMessage(messageText) ||
                                firstLine?.length <= 2) && (
                                <div className="pl-[32px] text-xs text-primary-500 break-all">
                                    {remainingText
                                        ? wrapEmojis(remainingText)
                                        : wrapEmojis(messageText)}
                                </div>
                            )}
                        </div>

                        {!isSystemMessage && (
                            <div className="hidden group-hover:flex items-start absolute left-[80%] top-1/2 -translate-y-1/2 mr-1 bg-[#1a1b1e]/95 px-1 py-0.5 rounded">
                                <Button
                                    variant="ghost"
                                    className="text-lg p-0 h-5 w-5 min-w-0"
                                    onClick={handleThumbsUpReaction}
                                >
                                    {"\u{1F44D}"}
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="p-0 h-5 w-5 min-w-0"
                                    onClick={handleReply}
                                >
                                    <Image
                                        src={"/images/PubNub/reply.svg"}
                                        alt={"reply"}
                                        width={14}
                                        height={14}
                                    />
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="p-0 h-5 w-5 min-w-0"
                                    onClick={handleShowMenu}
                                >
                                    <Image
                                        src={
                                            "/images/PubNub/vertical-dots-bold.svg"
                                        }
                                        alt={"menu"}
                                        width={14}
                                        height={14}
                                    />
                                </Button>
                            </div>
                        )}
                    </div>

                    {!isSystemMessage && (
                        <div className="flex flex-row w-full">
                            {message?.actions?.reactions && (
                                <div className="flex flex-wrap gap-1 justify-start mt-3">
                                    {Object.entries(
                                        message.actions.reactions
                                    ).map(([key, value]) => (
                                        <PubNubChatReactionBox
                                            key={key}
                                            emoji={key}
                                            total={value.length}
                                            self={value.some(
                                                (v) =>
                                                    v.uuid ===
                                                    userDB?._id!.toString()
                                            )}
                                            names={value}
                                            handleEmojiReaction={async () =>
                                                await handleEmojiReaction(key)
                                            }
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Overflow text row */}
                {/* {remainingText && (
                    <div className="pl-[32px] text-xs text-primary-500">
                        {wrapEmojis(remainingText)}
                    </div>
                )} */}
            </div>

            {thread && onSetThreadChannel && !isSystemMessage && (
                <PubNubChatThread
                    message={message}
                    setThreadChannel={onSetThreadChannel}
                />
            )}
        </div>
    );
};
export default PubNubMessage;
