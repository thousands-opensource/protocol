import EmojiIcon from "@/public/images/PubNub/emoji.svg";
import { IconButton } from "@material-tailwind/react";
import Image from "next/image";
import {
    ChangeEvent,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import Picker from "@emoji-mart/react";
import pickerData from "@emoji-mart/data";
import { Emoji } from "@/types/chat";
import { useToast } from "@chakra-ui/react";
import { MarketOrder } from "@/features/Stream";
import { useChatAppStreamCoinsBuySellContext } from "@/contexts/chatAppStreamCoinsBuySellContext";
import { ChatApp } from "@repo/interfaces";
import { useStreamContext } from "@/contexts/streamContext";
import { Send } from "lucide-react";
import {
    CooldownMessage,
    MESSAGE_COOLDOWN_SECONDS,
    MESSAGE_RATE_LIMIT_TIER,
    ONE_MINUTE_IN_MS,
    useMessageStore,
} from "@/store/useMessageStore";
import { useSkyboxStore } from "@/store/useSkyboxStore";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
interface PubNubMessageInputProps {
    onSendMessage: (message: string) => void;
    // onSendAction: (action: ActionTemplate) => void;
    replyingTo: boolean | null;
}

const PubNubMessageInput = ({
    onSendMessage,
    // onSendAction,
    replyingTo,
}: PubNubMessageInputProps) => {
    const { userDB } = useWildfileUserContext();
    const { chatApp } = useStreamContext();
    const { stremeCoin, setStremeCoin, setMarketOrderEntry } =
        useChatAppStreamCoinsBuySellContext();

    const [isSkybox, setIsSkybox] = useState(false);
    const [message, setMessage] = useState(stremeCoin);
    const [showPicker, setShowPicker] = useState(false);
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const pendingCaretPosition = useRef<number | null>(null);
    
    const {
        isReadySendMessage,
        setMessageQueue,
        setRateLimitTier,
        getLastMessageSentTimestamp,
        determineRateLimitTier,
        messageQueue,
    } = useMessageStore();
    const toast = useToast();

    const { selectedSkybox } = useSkyboxStore();

    useEffect(() => {
        var userId = userDB?._id?.toString() ?? "";

        //Check to see if your userId is in this skybox
        if (selectedSkybox?.skyboxChannelMembers.includes(userId))
        {
            setIsSkybox(true);
        } else {
            setIsSkybox(false);
        }
    }, [selectedSkybox]);

    const handleKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            await handleSendMessage();
        }
    };

    const handleSendMessage = async () => {
        if (message.trim() !== "") {
            const currentTimestamp = Date.now();
            const pastMinAgo = currentTimestamp - ONE_MINUTE_IN_MS;

            const filterMessageQueue = messageQueue.filter(
                (message) => message.timestamp > pastMinAgo
            );
            const messagesInPastMin = filterMessageQueue.length;
            let newRateLimitTier = determineRateLimitTier(messagesInPastMin);

            //Only trigger chat rate limiting when we are in the default channel
            if (!isSkybox && !isReadySendMessage(newRateLimitTier)) {
                const rateLimitTierInSeconds = Math.floor(
                    MESSAGE_RATE_LIMIT_TIER[newRateLimitTier] / 1000
                );
                const timeElapsedInMillis =
                    Date.now() - getLastMessageSentTimestamp();
                const timeElapsedInSeconds =
                    rateLimitTierInSeconds -
                    Math.floor(timeElapsedInMillis / 1000);
                toast({
                    description: `Slow down! Try again in ${timeElapsedInSeconds}s.`,
                    status: "error",
                    duration: 3000,
                    position: "bottom-right",
                });
                return;
            }

            await onSendMessage(message);
            setMessage("");
            setStremeCoin("");
            const cooldownMessage: CooldownMessage = {
                message,
                timestamp: currentTimestamp,
            };

            //Only trigger chat rate limiting when we are in the default channel
            if (!isSkybox)
            {
                setMessageQueue([cooldownMessage, ...filterMessageQueue]);
                setRateLimitTier(newRateLimitTier);
            }
            if (inputRef && inputRef.current) {
                inputRef.current.blur();
                inputRef.current.focus();
            }
        }
    };

    const adjustInputScroll = () => {
        if (!inputRef.current) return;
        const input = inputRef.current;
        const caretPos = input.selectionStart ?? 0;

        // Create a temporary mirror element.
        const mirrorDiv = document.createElement("div");
        // Copy font & text-related styling from the input.
        const computedStyle = window.getComputedStyle(input);
        mirrorDiv.style.font = computedStyle.font;
        mirrorDiv.style.whiteSpace = "pre"; // to preserve spaces
        // Ensure the mirror isn’t visible and doesn’t affect layout.
        mirrorDiv.style.visibility = "hidden";
        mirrorDiv.style.position = "absolute";
        mirrorDiv.style.top = "0";
        mirrorDiv.style.left = "0";
        // Optionally copy padding/border if those affect text position.
        mirrorDiv.style.padding = computedStyle.padding;
        mirrorDiv.style.border = computedStyle.border;
        // Set the text up to the caret.
        mirrorDiv.textContent = input.value.slice(0, caretPos);
        document.body.appendChild(mirrorDiv);

        const textWidth = mirrorDiv.offsetWidth;
        document.body.removeChild(mirrorDiv);

        // Compute the desired scrollLeft so the caret is visible.
        // For example, if the text width exceeds the visible area,
        // scroll so that the caret is at least a few pixels from the right edge.
        const paddingOffset = 5;
        if (textWidth + paddingOffset > input.clientWidth) {
            input.scrollLeft = textWidth + paddingOffset - input.clientWidth;
        } else {
            input.scrollLeft = 0;
        }

        inputRef.current?.focus();
    };

    const handleEmoji = (emoji: Emoji) => {
        if (inputRef.current) {
            const start = inputRef.current.selectionStart ?? 0;
            const end = inputRef.current.selectionEnd ?? 0;
            const newMessage =
                message.slice(0, start) + emoji.native + message.slice(end);
            setMessage(newMessage);
            pendingCaretPosition.current = start + emoji.native.length;
        }
    };

    const handleClickOutside = (event: MouseEvent) => {
        if (
            buttonRef.current &&
            !buttonRef.current.contains(event.target as Node)
        ) {
            setShowPicker(false);
        }

        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    useEffect(() => {
        if (inputRef.current && replyingTo) {
            inputRef.current.focus();
        }
    }, [replyingTo]);

    useEffect(() => {
        setMessage(stremeCoin);
    }, [stremeCoin]);

    useLayoutEffect(() => {
        if (inputRef.current && pendingCaretPosition.current !== null) {
            const caretPosition = pendingCaretPosition.current;
            inputRef.current.setSelectionRange(caretPosition, caretPosition);

            // Only adjust scrolling if the caret is at the end of the text.
            if (caretPosition === message.length) {
                adjustInputScroll();
            }

            pendingCaretPosition.current = null;
        }
    }, [message]);

    const custom = [
        {
            id: "reactions",
            name: "Thousands Reactions",
            emojis: [
                {
                    id: "heart",
                    name: "Heart",
                    keywords: ["love", "like", "favorite"],
                    skins: [{ native: "❤️" }],
                },
                {
                    id: "tada",
                    name: "Tada",
                    keywords: ["celebrate", "party", "congratulations"],
                    skins: [{ native: "🎉" }],
                },
                {
                    id: "fire",
                    name: "Fire",
                    keywords: ["hot", "lit", "burn"],
                    skins: [{ native: "🔥" }],
                },
                {
                    id: "boom",
                    name: "Boom",
                    keywords: ["explosion", "surprise", "shock"],
                    skins: [{ native: "💥" }],
                },
                {
                    id: "wave",
                    name: "Wave",
                    keywords: ["hello", "hi", "greeting"],
                    skins: [{ native: "👋" }],
                },
                {
                    id: "clap",
                    name: "Clap",
                    keywords: ["applause", "well done", "praise"],
                    skins: [{ native: "👏" }],
                },
            ],
        },
    ];

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const text = e.target.value;

        if (chatApp === ChatApp.STREMECOIN) {
            switch (text) {
                case `/${MarketOrder.BUY}`:
                    setMarketOrderEntry(MarketOrder.BUY);
                    setMessage("");
                    return;
                case `/${MarketOrder.SELL}`:
                    setMarketOrderEntry(MarketOrder.SELL);
                    setMessage("");
                    return;
                default:
                    setMessage(text);
                    return;
            }
        }

        setMessage(text);
        return;
    };

    const emojiPickerCategories = [
        "reactions",
        "frequent",
        "people",
        "nature",
        "foods",
        "activity",
        "places",
        "objects",
        "symbols",
        "flags",
    ];

    return (
        <div className="relative w-full">
            <div className="bg-zinc-950 rounded-xl  px-4 border border-transparent flex items-center">
                <input
                    ref={inputRef}
                    type="text"
                    value={message}
                    maxLength={200}
                    placeholder={isSkybox ? "Chat in your skybox" : "Chat in general"}
                    className="w-full bg-transparent focus:outline-none placeholder:text-sm text-sm font-normal placeholder:text-gray-400"
                    onChange={handleInputChange}
                    onKeyDown={handleKeyPress}
                />
                <IconButton
                    ref={buttonRef}
                    variant="ghost"
                    className="ml-2 text-gray-500 hover:text-gray-400 p-0"
                    onClick={() => setShowPicker(!showPicker)}
                >
                    <Image
                        src={EmojiIcon.src}
                        alt={"emoji"}
                        width={20}
                        height={20}
                    />
                </IconButton>
                {/*
                <Popover>
                    <Popover.Trigger>
                        <Image
                            src={AddFile.src}
                            alt={"add-file"}
                            width={26}
                            height={26}
                        />
                    </Popover.Trigger>
                    <Popover.Content className="max-w-md bg-primary-500 rounded-xl flex flex-col p-0">
                        <span className="p-4">Actions</span>
                        <div className="flex flex-wrap justify-between border-t border-[#A5A5A5]">
                            <PubNubActionTemplate
                                actionTemplate={{
                                    actionLabel: "Cheer",
                                    text: "Make some noise",
                                    command: "cheer",
                                    type: "personalAction",
                                    src: "/images/goalieko.png",
                                    chatActionGuid: "",
                                }}
                                onHandleSelectAction={onSendAction}
                            />
                        </div>
                    </Popover.Content>
                </Popover>
                */}
                <button
                    className="ml-2 text-gray-500 hover:text-gray-400"
                    onClick={handleSendMessage}
                >
                    <Send size={16} fill="currentColor" />
                </button>
            </div>

            {/* Emoji picker */}
            {showPicker && (
                <div
                    className="absolute bottom-9 right-0 z-[1000]"
                    tabIndex={-1}
                    onClick={(e) => e.stopPropagation()}
                >
                    <Picker
                        data={pickerData}
                        onEmojiSelect={handleEmoji}
                        onClickOutside={handleClickOutside}
                        categories={emojiPickerCategories}
                        custom={custom}
                    />
                </div>
            )}
        </div>
    );
};

export default PubNubMessageInput;
