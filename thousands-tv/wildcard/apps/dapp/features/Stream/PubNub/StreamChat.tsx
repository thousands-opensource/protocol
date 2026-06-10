import { ActionTemplate } from "@/components/PubNub/Chat/ActionTemplate";
import PubNubChatHeader from "@/components/PubNub/Chat/Header";
import PubNubMessageInput from "@/components/PubNub/Chat/Input";
import PubNubChatMenu from "@/components/PubNub/Chat/Menu";
import PubNubMessage from "@/components/PubNub/Chat/Message";
import PubNubPinnedMessage from "@/components/PubNub/Chat/PinnedMessage";
import PubNubChatReplyMessage from "@/components/PubNub/Chat/ReplyMessage";
import PubNubChatReportDialog from "@/components/PubNub/Chat/ReportDialog";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import useChatHistory from "@/hooks/useChatHistory";
import { handlePublishMessage, historyUpdate } from "@/utils/chatUtil";
import { copyTextToClipboard } from "@/utils/util";
import { Box, useBreakpointValue } from "@chakra-ui/react";
import { Spinner } from "@material-tailwind/react";
import {
    Channel,
    Chat,
    Event,
    Message,
    ThreadChannel,
    ThreadMessage,
} from "@pubnub/chat";
import { useEffect, useRef, useState } from "react";
import { MarketOrder } from "..";
import ChatAppControl from "@/features/Event/EventsSeries/ChatAppControl";
import StreamScore from "../StreamScore";
import { useStreamContext } from "@/contexts/streamContext";
import { ChatApp, ISkybox } from "@repo/interfaces";
import { useStreamScoreContext } from "@/contexts/streamScoreComponentContext";
import { useChatAppStreamCoinsBuySellContext } from "@/contexts/chatAppStreamCoinsBuySellContext";
import CoinPositionWidget from "../ChatApps/StreamCoinApp/CoinPositionWidget";
import BuySellOrderEntryWidget from "../ChatApps/StreamCoinApp/BuySellOrderEntryWidget";
import BackdropBlur from "../ChatApps/StreamCoinApp/BackdropBlur";
import StreamCoinPlaceOrderWidget from "../ChatApps/StreamCoinApp/PlaceOrderWidget";
import { getClientSideCookieValue } from "@/utils/sessionUtil";
import {
    getIvsChatReactionUrl,
    getAWSReactionsEnabled,
} from "@/utils/environmentUtilWCA";
import axios from "axios";
import { COOKIES_ACCESS_TOKEN_WILDCARD } from "@/utils/accountAPIUtil";
import Cookies from "js-cookie";
import BoostComponent from "@/components/PubNub/Chat/BoostComponent";
import TokenRewards from "@/components/PubNub/Chat/TokenRewards";
import { TabCarousel } from "@/components/PubNub/Chat/Carousel/TabCarousel";
import { StreamAppLower } from "@/components/StreamApps/StreamAppLower";
import { PredictChatGameState } from "@/components/PubNub/Chat/PredictChatGameState";
import { YourPredictions } from "@/components/PubNub/Chat/YourPredictions";
import { SkyboxColorBarIndicator } from "@/features/Skybox/SkyboxUserSettings";
import SkyboxLayout from "@/features/Skybox/SkyboxLayout";
import { useSkyboxStore } from "@/store/useSkyboxStore";
import SkyboxGradientBackground from "@/features/Skybox/SkyboxGradientBackground";
import SkyboxChat from "@/features/Skybox/SkyboxChat";
import { SkyboxSlotAllocation } from "@/features/Skybox/SkyboxSlotAllocation";
import { useGetUsersStore } from "@/store/useGetUsersStore";
import usePubnubStore from "@/store/usePubnubStore";
import InviteMemberPopupModal from "@/features/Skybox/InviteMemberPopupModal";
import RemoveMemberPopupModal from "@/features/Skybox/RemoveMemberPopupModal";
import { SkyboxGroupAvatar } from "@/features/Skybox/SkyboxGroupAvatar";
import PubnubChat from "./PubnubChat";
import { SkyboxInviteMembersModal } from "@/features/Skybox/SkyboxInviteMembersModal";
import { useVotingStore } from "@/store/useVotingStore";
import { useBoostStore } from "@/store/useBoostStore";

interface StreamChatProps {
    chatHistory: Message[];
    pinMessage: Message | null;
    onSendMessage: (
        message: string,
        quote?: Message | null,
        metadata?: { [objKey: string]: any }
    ) => void;
    onSendAction?: (action: ActionTemplate) => void;
    channel: Channel | null; //ChannelMetadataObject<Pubnub.ObjectCustom>;
    onLoadMoreMessages: () => void;
    isMore: boolean;
    // presence: string[];
    onUpdateHistory: (
        message: Message,
        currentActiveChannel: Channel | null
    ) => void;
    onUnpinMessage: () => void;
    onSetPinnedMessage: (message: Message) => void;
    onRefreshHistory: () => void;
    onThreadChannel: () => void;
    onEmitDelete: (message: Message) => void;
    setChatLoadingHistory: () => void;
}
const StreamChat = ({
    chatHistory,
    onSendMessage,
    channel,
    onLoadMoreMessages,
    isMore,
    // presence,
    onSendAction,
    onUpdateHistory,
    pinMessage,
    onUnpinMessage,
    onSetPinnedMessage,
    onRefreshHistory,
    onThreadChannel,
    onEmitDelete,
    setChatLoadingHistory,
}: StreamChatProps) => {
    const { pubnub, activeChannel } = usePubnubStore();
    const { userDB } = useWildfileUserContext();
    const { marketOrderEntry, fetchStremeCoinPriceQuote } =
        useChatAppStreamCoinsBuySellContext();
    const { chatApp, vendorEventId, eventId } = useStreamContext();
    const { streamScore } = useStreamScoreContext();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
    const [loading, setLoading] = useState(true);
    const [showMenu, setShowMenu] = useState(false);
    const [coordinates, setCoordinates] = useState({ x: 0, y: 0 });
    const [showParticipants, setShowParticipants] = useState(false);
    const [currentMessage, setCurrentMessage] = useState<Message | null>(null);
    const [replyingTo, setReplyingTo] = useState<boolean | null>(null);
    const [replyingToUser, setReplyingToUser] = useState<string | null>(null);
    const [threadChannel, setThreadChannel] = useState<ThreadChannel | null>(
        null
    );
    const [tempThreadChannel, setTempThreadChannel] =
        useState<ThreadChannel | null>(null);
    const [threadPresence, setThreadPresence] = useState<string[]>([]);
    const {
        setHistory,
        history,
        loadMore,
        setLoadMore,
        loadMoreMessages,
        deleteMessage,
        resetHistory,
    } = useChatHistory();
    const {
        selectedColor,
        showSkybox,
        showSettings,
        showInviteModal,
        setShowInviteModal,
        selectedSkybox,
        skyboxes,
    } = useSkyboxStore();
    const userId = userDB?._id?.toString() || null;

    const { users } = useGetUsersStore();

    const [stopUpdates, setStopUpdates] = useState<() => void>(() => () => {});
    const [showDialog, setShowDialog] = useState(false);
    const [timetoken, setTimetoken] = useState<string>("");
    const isMobileView = useBreakpointValue(
        {
            base: true,
            sm: true,
            md: true,
            lg: false,
            xl: false,
        },
        { ssr: false }
    );
    const { isTabVisible: isVotingTabActive } = useVotingStore();
    const { isMatchRunning } = useBoostStore();
    const prevSelectedSkybox = useRef<ISkybox | null>(null);

    /**
     * Returns the height class for the message viewport based on the chat app.
     */
    const getMessageViewportHeight = () => {
        if (chatApp === ChatApp.STREMECOIN) {
            return "max-h-[calc(100dvh-320px)]";
        }

        // return "max-h-[calc(62dvh-50px)] md:max-h-[calc(100dvh-120px)]";
        return "h-full max-h-[calc(100dvh_-_120px)] md:max-h-[calc(100dvh_-_120px)]";
    };

    const getPubnubChatPresenceHeightClassname = () => {
        if (chatApp === ChatApp.STREMECOIN) {
            return "max-h-[calc(49vh_-_90px)] md:max-h-[calc(80vh_-_90px)]";
        } else if (chatApp === ChatApp.WILDCARD) {
            return "max-h-[calc(49vh_-_270px)] md:max-h-[calc(80vh_-_270px)]";
        }

        return "max-h-[calc(50vh_-_100px)] md:max-h-[calc(80vh_-_90px)]";
    };

    const handleShowParticipants = (show: boolean) => {
        setShowParticipants(show);
    };

    // useEffect(() => {
    //     if (
    //         !showParticipants &&
    //         messagesEndRef.current &&
    //         chatContainerRef.current
    //     ) {
    //         chatContainerRef.current.scrollTop =
    //             chatContainerRef.current.scrollHeight;
    //     }
    // }, [messagesEndRef, showParticipants]);

    useEffect(() => {
        // Auto-scroll to bottom when a new message is added, only if auto-scroll is enabled
        if (
            (autoScrollEnabled &&
                messagesEndRef.current &&
                chatContainerRef.current) ||
            (autoScrollEnabled &&
                messagesEndRef.current &&
                chatContainerRef.current &&
                (isVotingTabActive || isMatchRunning)) ||
            (selectedSkybox &&
                prevSelectedSkybox.current &&
                selectedSkybox._id?.toString() !==
                    prevSelectedSkybox.current._id?.toString() &&
                messagesEndRef.current)
        ) {
            messagesEndRef.current.scrollIntoView({
                behavior: "instant",
                block: "end",
            });

            prevSelectedSkybox.current = selectedSkybox;
        }
        setLoading(false);
    }, [
        chatHistory,
        autoScrollEnabled,
        history,
        isVotingTabActive,
        isMatchRunning,
        selectedSkybox,
    ]);

    // Track user scroll to disable auto-scroll if the user scrolls up
    const handleScroll = () => {
        const container = chatContainerRef.current;
        if (autoScrollEnabled) {
            resetHistory();
            setChatLoadingHistory();
        }
        if (container) {
            const isAtBottom =
                container.scrollHeight - 70 - container.scrollTop <=
                container.clientHeight;

            setAutoScrollEnabled(isAtBottom);
            const more = threadChannel ? loadMore : isMore;
            const loadAction = threadChannel
                ? () => loadMoreMessages(threadChannel)
                : onLoadMoreMessages;
            // Check if user has reached the top of the chat, trigger load more messages
            if (container.scrollTop === 0 && more) {
                setLoading(true);
                loadAction();
            }
        }
    };

    const emojiChatReaction = async (
        originalMessageUserId: string,
        originalMessage: string,
        emoji: string,
        emojiAddedOrRemoved: boolean
    ) => {
        const ivsChatReactioneUrl = getIvsChatReactionUrl();
        const authorizationHeader = getClientSideCookieValue(
            "wildcardAccessToken"
        );
        if (!authorizationHeader) {
            return;
        }

        await axios.post(
            ivsChatReactioneUrl,
            {
                stageId: eventId,
                vendorEventId,
                originalMessage,
                originalMessageUserId,
                emoji,
                emojiAddedOrRemoved,
                authorizationHeader,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
    };

    const handleSendBoost = async (boostType: string, boostAmount: number) => {
        const wildcardAccessToken = Cookies.get(COOKIES_ACCESS_TOKEN_WILDCARD);

        const data = await axios.post(
            "/api/boosts/sendBoost",
            {
                vendorEventId: vendorEventId,
                boostType: boostType,
                boostAmount: boostAmount,
            },
            {
                headers: {
                    Authorization: `Bearer ${wildcardAccessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (data.status !== 200) {
            console.error("Failed to trigger boost");
        }
    };

    const handleReaction = async (emoji: string, message?: Message) => {
        let msg = message ?? currentMessage;
        if (!msg) {
            return;
        }

        const updatedMsg = await msg.toggleReaction(emoji);
        setShowMenu(false);

        const isAwsReactionsEnabled = getAWSReactionsEnabled();
        if (!isAwsReactionsEnabled) {
            return;
        }

        const {
            content: { text },
            userId,
        } = updatedMsg;

        const didUserReact = updatedMsg.hasUserReaction(emoji);
        await emojiChatReaction(userId, text, emoji, !didUserReact);
    };

    const handleSendInitialThreadMessage = async (message: string) => {
        await tempThreadChannel?.sendText(message);
        setThreadChannel(tempThreadChannel);
        setTempThreadChannel(null);
    };

    const handleSendThreadMessage = async (message: string) => {
        if (replyingTo && currentMessage) {
            handlePublishMessage(threadChannel, message, currentMessage);
            setReplyingTo(false);
        } else {
            threadChannel?.sendText(message);
        }
    };
    const handleSendMessage = async (message: string) => {
        if (marketOrderEntry !== MarketOrder.NONE) {
            await fetchStremeCoinPriceQuote(message);

            // setTimeout(() => {
            //     setIsLoadingFetchPriceQuote(false);
            // }, 5000);

            // onSendMessage(`${marketOrderEntry}: ${message}`);
            // setMessage("");
            return;
        }
        setShowParticipants(false);
        if (tempThreadChannel) {
            handleSendInitialThreadMessage(message);
            return;
        }
        if (threadChannel) {
            await handleSendThreadMessage(message);
            return;
        }
        if (!replyingTo) {
            onSendMessage(message);
            return;
        }
        onSendMessage(message, currentMessage);
        setReplyingTo(false);
    };

    const handleCopy = () => {
        if (!currentMessage) return;
        copyTextToClipboard(currentMessage.text);
        setShowMenu(false);
    };

    const handlePinMessage = () => {
        if (!currentMessage) return;
        currentMessage.pin();
        onSetPinnedMessage(currentMessage);
        setShowMenu(false);
    };

    const handleCreateThread = async () => {
        if (!currentMessage) return;
        const channel = await currentMessage.createThread();
        setTempThreadChannel(channel);
        setShowMenu(false);
    };

    useEffect(() => {
        if (!threadChannel) return;
        handleChannelSubscribe(threadChannel);
        onThreadChannel();
        setThreadPresence([]);
        // handlePresence();
    }, [threadChannel?.id]);

    const handleModerationEvent = async (payload: Event<"custom">) => {
        const { token } = payload.payload;
        deleteMessage(token);
    };

    const handleChannelSubscribe = async (channel: ThreadChannel) => {
        if (!pubnub) return;
        const msgs = await channel.getHistory();
        setHistory(msgs.messages);
        setLoadMore(msgs.isMore);
        const moderationListener = pubnub.listenForEvents({
            channel: channel.id,
            type: "custom",
            method: "signal",
            callback: handleModerationEvent,
        });
        const disconnect = await channel.join((message: Message) => {
            handleHistoryUpdate(message, channel);
        });
        setStopUpdates(() => disconnect.disconnect);
        return () => {
            if (disconnect) {
                disconnect.disconnect();
            }
            moderationListener();
        };
    };

    // const handlePresence = async () => {
    //     if (!threadChannel) return;
    //     const presence = await threadChannel.whoIsPresent();
    //     setThreadPresence(presence);
    //     const stopUpdates = await threadChannel.streamPresence(
    //         async (userIds) => {
    //             setThreadPresence(userIds);
    //         }
    //     );
    //     return () => {
    //         stopUpdates();
    //     };
    // };

    const handleReturnToChat = async () => {
        if (!tempThreadChannel && !threadChannel) return;
        stopUpdates();
        setThreadChannel(null);
        setTempThreadChannel(null);
        setHistory([]);
        setLoadMore(false);
        setReplyingTo(false);
        onRefreshHistory();
    };

    const handleHistoryUpdate = (
        message: Message | ThreadMessage,
        currentActiveChannel: Channel | null
    ) => {
        console.log("this is only for threads");
        setHistory((prevHistory) =>
            historyUpdate(prevHistory, message, currentActiveChannel)
        );
    };

    const onDelete = async () => {
        if (!pubnub) return;
        if (!currentMessage) return;
        if (currentMessage?.hasThread) {
            await currentMessage.removeThread();
            setShowMenu(false);
            return;
        }
        await currentMessage?.delete();
        if (threadChannel) {
            pubnub.emitEvent({
                type: "custom",
                channel: threadChannel.id,
                payload: { token: currentMessage.timetoken },
                method: "signal",
            });
        } else {
            onEmitDelete(currentMessage);
        }
        setShowMenu(false);
    };

    useEffect(() => {
        const checkForTimetoken = () => {
            if (!chatContainerRef.current) return;
            const currentHistory = threadChannel ? history : chatHistory;
            const messagePresent = currentHistory.find(
                (m) => m.timetoken === timetoken
            );
            chatContainerRef.current.scrollTop = 10;
            if (messagePresent) {
                const messageElement = chatContainerRef.current?.querySelector(
                    `[data-timetoken="${timetoken}"]`
                );
                if (!messageElement) return;
                messageElement.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });
                setTimeout(() => {
                    setTimetoken("");
                }, 3000);
            } else {
                chatContainerRef.current.scrollTop = 0;
            }
        };

        if (!timetoken) return;
        checkForTimetoken();
    }, [chatHistory, history, threadChannel, timetoken]);

    const renderMessages = (messages: Message[]) =>
        messages.map((message, index) => (
            <PubNubMessage
                key={index}
                message={message}
                showMenu={showMenu}
                setShowMenu={setShowMenu}
                setCoordinates={setCoordinates}
                setCurrentMessage={setCurrentMessage}
                onUpdateHistory={
                    threadChannel || tempThreadChannel
                        ? handleHistoryUpdate
                        : onUpdateHistory
                }
                onSetReplyingTo={setReplyingTo}
                onSetReplyingToUser={setReplyingToUser}
                onSetThreadChannel={setThreadChannel}
                handleReaction={handleReaction}
                setTimetoken={setTimetoken}
                replyTimetoken={timetoken}
            />
        ));

    const handleReportMessage = (message: string) => {
        currentMessage?.report(message);
        setShowDialog(false);
    };

    const amountToNextStreamScoreLevel = 100;
    const streamScoreLevel =
        Math.floor(streamScore / amountToNextStreamScoreLevel) + 1;
    const streamScoreBoostMultiplier = streamScoreLevel * 0.1;
    const streamScorePercentToNextLevel =
        (streamScore % amountToNextStreamScoreLevel) /
        amountToNextStreamScoreLevel;

    const isChannelMember = selectedSkybox
        ? selectedSkybox.skyboxChannelMembers.some((channelMemberId) => {
              return channelMemberId == userDB?._id?.toString();
          })
        : false;
    const isOwner = selectedSkybox
        ? selectedSkybox.ownerUserId.toString() === userDB?._id?.toString()
        : false;
    const isOwnerOrChannelMember = isOwner || isChannelMember;
    const showChat = selectedSkybox != null ? isChannelMember : false;

    return (
        <div className="flex flex-col h-[100%] w-full relative md:w-[372px] bg-gradient-to-b from-[#232323] to-[#000000] border-l-primary-200  md:w-[372px] h-[100dvh]  min-w-[372px] ">
            {/* This is the part that should shrink - use overflow-auto to enable scrolling */}
            <div
                className={`md:w-[372px]flex-1 min-h-0 flex flex-col justify-start border-b-0 border h-full `}
            >
                <div className="h-[38px]">
                    <CoinPositionWidget />
                    <SkyboxSlotAllocation />
                </div>

                <div
                    className={`flex flex-col h-full relative  ${
                        showSkybox && !isOwnerOrChannelMember
                            ? "max-h-[fit-content] lg:max-h-[fit-content] w"
                            : "hidden max-h-0"
                    }  m-0 p-0`}
                >
                    <SkyboxColorBarIndicator previewColor={selectedColor} />
                    {skyboxes.map(
                        (skybox, index) =>
                            selectedSkybox?._id === skybox._id && (
                                <SkyboxGroupAvatar key={index} />
                            )
                    )}
                </div>
                {/* Always render both UIs but control their visibility and animation */}
                {/* Skybox Chat */}
                <div
                    className={`flex flex-col h-full overflow-hidden bg-[#212121] relative  ${
                        showSkybox && isOwnerOrChannelMember
                            ? "opacity-100 max-h-full"
                            : "opacity-100 max-h-0"
                    }`}
                >
                    {/* Gradient background effect - positioned at the back */}
                    <SkyboxGradientBackground
                        position="bottom-right"
                        useSelectedColor={true}
                        opacity={0.3}
                    />

                    {/* Content container with higher z-index */}
                    <div className="flex flex-col h-full relative ">
                        {/* These components should be sticky/fixed at the top */}
                        <div
                            className={`sticky top-0 bg-[#212121] ${
                                showSettings ? "h-full" : ""
                            }`}
                        >
                            {/* SkyboxColorBarIndicator stays fixed at the very top */}
                            <SkyboxColorBarIndicator
                                previewColor={selectedColor}
                            />
                            <SkyboxLayout />
                        </div>
                        {/* Scrollable content area with flex-grow to fill available space */}
                        <div className="flex-grow">
                            {/* Chat messages  */}
                            {showChat && !showSettings && (
                                // <SkyboxChat
                                //     chatHistory={chatHistory}
                                //     renderMessages={renderMessages}
                                // />
                                <PubnubChat
                                    chatHistory={chatHistory}
                                    history={history}
                                    loading={loading}
                                    messagesEndRef={messagesEndRef}
                                    onUnpinMessage={onUnpinMessage}
                                    pinMessage={pinMessage}
                                    renderMessages={renderMessages}
                                    tempThreadChannel={tempThreadChannel}
                                    threadChannel={threadChannel}
                                    chatContainerRef={chatContainerRef}
                                    handleScroll={handleScroll}
                                    userId={userId}
                                />
                            )}
                        </div>

                        <InviteMemberPopupModal />
                        <RemoveMemberPopupModal />
                    </div>
                </div>

                {/* General Chat */}
                <div
                    className={`flex flex-col  duration-500 ease-in-out overflow-y-auto ${
                        !showSkybox
                            ? "opacity-100 max-h-full"
                            : !isOwnerOrChannelMember
                            ? "opacity-0 max-h-[77%%] lg:max-h-[88%] hidden"
                            : "opacity-0 max-h-0"
                    }   `}
                >
                    <StreamScore
                        streamScoreBoostMultiplayer={streamScoreBoostMultiplier}
                        streamScoreLevel={streamScoreLevel}
                        streamScorePercentToNextLevel={
                            streamScorePercentToNextLevel
                        }
                        chatApp={chatApp}
                    />
                    {/*
                    <PubNubChatHeader
                        name={channel?.name}
                        picture={channel?.custom?.profileUrl as string}
                        showParticipants={showParticipants}
                        setShowParticipants={handleShowParticipants}
                        returnToChat={handleReturnToChat}
                        onShowThreadList={setThreadChannel}
                        thread={!!threadChannel || !!tempThreadChannel}
                    />
                    */}
                    {/* {false && !showParticipants && (
                            <PubNubChatPresence
                                presence={
                                    threadChannel || tempThreadChannel
                                        ? threadPresence
                                        : presence
                                }
                            />
                        )} */}
                    {showChat && !showSettings ? (
                        // <PubNubChatPresenceTab
                        //     presence={
                        //         threadChannel || tempThreadChannel
                        //             ? threadPresence
                        //             : presence
                        //     }
                        //     presenceClassName={getPubnubChatPresenceHeightClassname()}
                        // />
                        <></>
                    ) : (
                        <PubnubChat
                            chatHistory={chatHistory}
                            history={history}
                            loading={loading}
                            messagesEndRef={messagesEndRef}
                            onUnpinMessage={onUnpinMessage}
                            pinMessage={pinMessage}
                            renderMessages={renderMessages}
                            tempThreadChannel={tempThreadChannel}
                            threadChannel={threadChannel}
                            chatContainerRef={chatContainerRef}
                            handleScroll={handleScroll}
                            userId={userId}
                        />
                    )}
                    <div className="my-1">
                        <ChatAppControl
                            button1seconds={60}
                            button2seconds={60}
                            button3seconds={60}
                        />
                    </div>
                </div>
            </div>

            <div className="flex-shrink-0 flex flex-col justify-start bg-primary-400 pt-0 relative w-full mb-[60px]">
                <StreamCoinPlaceOrderWidget onSendMessage={onSendMessage} />
                <Box
                    sx={{
                        position: "relative",
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <TokenRewards />
                    <BackdropBlur />

                    <Box>
                        <BoostComponent
                            onSendMessage={onSendMessage}
                            onSendBoost={handleSendBoost}
                        />
                    </Box>

                    {/* TabCarousel with PubNubMessageInput as children - fixed to bottom */}
                    <Box
                        sx={{
                            width: "100%",
                            position: { base: "fixed", md: "sticky" }, // Sticky for mobile, Fixed for md and above
                            bottom: 0,
                            left: 0,
                            right: 0,
                            zIndex: 50,
                            backgroundColor: "var(--color-primary-400)",
                        }}
                    >
                        <TabCarousel>
                            <div
                                className={
                                    showSkybox && !isOwnerOrChannelMember
                                        ? "hidden"
                                        : ""
                                }
                            >
                                <PubNubMessageInput
                                    onSendMessage={handleSendMessage}
                                    replyingTo={replyingTo}
                                />
                            </div>
                        </TabCarousel>
                    </Box>

                    {replyingTo && (
                        <PubNubChatReplyMessage
                            replyingToUser={replyingToUser}
                            currentMessage={currentMessage?.text}
                            setReplyingTo={setReplyingTo}
                        />
                    )}
                    <BuySellOrderEntryWidget />
                </Box>
            </div>
            {showMenu && (
                <PubNubChatMenu
                    coordinates={coordinates}
                    handleReaction={handleReaction}
                    setShowMenu={setShowMenu}
                    onSetReplying={setReplyingTo}
                    onCopy={handleCopy}
                    onPinMessage={handlePinMessage}
                    onCreateThread={handleCreateThread}
                    activeThread={!!threadChannel}
                    self={userDB?._id!.toString() === currentMessage?.userId}
                    setShowDialog={setShowDialog}
                    onDelete={onDelete}
                />
            )}
            <PubNubChatReportDialog
                open={showDialog}
                setOpen={setShowDialog}
                onReportMessage={handleReportMessage}
            />
            <SkyboxInviteMembersModal
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
            />
        </div>
    );
};

export default StreamChat;
