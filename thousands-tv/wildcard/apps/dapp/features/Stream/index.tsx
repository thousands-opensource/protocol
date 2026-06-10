import Header from "./Header";
import VideoPlayer from "./Body/VideoPlayer";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Channel, Chat, Event, Message, MessageType, User } from "@pubnub/chat";
import StreamChat from "./PubNub/StreamChat";
import PubNub, { ChannelMetadataObject } from "pubnub";
import { useStreamContext } from "@/contexts/streamContext";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { useChatAppIdleGameContext } from "@/contexts/chatAppIdleGameContext";
import axios from "axios";
import {
    BOOST_EVENT_TYPE,
    BoostSignalMessage,
    BoostTrigger,
    ConsumableCommandAction,
    DIRECT_MESSAGE_EVENT_TYPE,
    DirectMessage,
    IdleEvent,
    Leader,
    PubnubBase,
    SendCommandResponse,
    SkyboxInvite,
    TokenRewardMessage,
    VoteUpdate,
} from "@/types";
import { ActionTemplate } from "@/components/PubNub/Chat/ActionTemplate";
import { handlePublishMessage, historyUpdate } from "@/utils/chatUtil";
import useChatHistory from "@/hooks/useChatHistory";
import {
    getAWSMessagesEnabled,
    getIvsChatMessageUrl,
    getPlaceOrderUrl,
    getPriceQuoteUrl,
} from "../../utils/environmentUtilWCA";
import { COOKIES_ACCESS_TOKEN_WILDCARD } from "@/utils/accountAPIUtil";
import Cookies from "js-cookie";
import { useUserMetaContext } from "@/contexts/userMetaContext";
import ChatLeaderboard, { MOCK_CHAT_LEADERBOARD } from "./ChatLeaderboard";
import {
    MAX_SKYBOX_SLOT,
    THEME_COLOR_DARK_ONYX,
    TIER_MAX_MEMBERSHIP_MAP,
} from "@/constants/constants";
import { Text, useBreakpointValue } from "@chakra-ui/react";
import { poppinsBold } from "@/utils/themeUtil";
import { getClientSideCookieValue } from "@/utils/sessionUtil";
import { useChatAppIdleGameBidButtonContext } from "@/contexts/chatAppIdleGameBidButtonContext";
import ChatAppMarketProvider from "@/contexts/chatAppMarketComponentContext";
import ConfirmationProvider from "@/contexts/confirmationContext";
import ChatAppStreamCoinsBuySellProvider from "@/contexts/chatAppStreamCoinsBuySellContext";
import ChatAppMyCoinsProvider from "@/contexts/chatAppMyCoinsContext";
import ChatAppTopCoinsProvider from "@/contexts/chatAppTopCoinsContext";
import ChatApps from "./ChatApps";
import { useBoostStore } from "@/store/useBoostStore";
import Pubnub from "pubnub";
import BoostRound from "@/components/PubNub/Chat/BoostRound";
import { BuyCreditsDrawer } from "@/components/BuyCreditsDrawer";
import { useGetUsersStore } from "@/store/useGetUsersStore";
import { useChatAppLeaderboardStore } from "@/store/useChatAppLeaderboardStore";
import {
    useVotingStore,
    optionIdsList,
    chartColorsList,
    VotingState,
    VotingUpdate,
} from "@/store/useVotingStore";
import {
    shouldShowNotification,
    useNotificationStore,
} from "@/store/useNotificationStore";
import usePubnubStore from "@/store/usePubnubStore";
import {
    generatePartialChannelMember,
    generatePartialSkybox,
    useSkyboxStore,
} from "@/store/useSkyboxStore";
import { ISkybox } from "@repo/interfaces";
import { SkyboxFan } from "../Skybox/types";
import { useGlobalContext } from "@/contexts/globalContext";
import { colorNameToSkyboxColorMap } from "../Skybox/exampleData";
import { useEmotesStore } from "@/store/useEmotesStore";

export enum MarketOrder {
    BUY = "buy",
    SELL = "sell",
    NONE = "none",
}

const Stream = () => {
    const { pubnub } = usePubnubStore();
    const { setLoadingSpinner } = useGlobalContext();
    const { vendorEventId, eventId, handleSignalEvent } = useStreamContext();
    const { userDB } = useWildfileUserContext();
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

    // const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
    // const [chatPresence, setChatPresence] = useState<string[]>([]);
    const [pinMessage, setPinMessage] = useState<Message | null>(null);
    const {
        setHistory,
        history,
        loadMore,
        setLoadMore,
        loadMoreMessages,
        deleteMessage,
        resetHistory,
    } = useChatHistory();

    const { triggerEmote } = useEmotesStore();

    const {
        isMatchRunning,
        setRoundNumber,
        setRedComboMultiplier,
        setRedBlueRatio,
        setBlueComboMultiplier,
        setIsMatchingRunning,
        enqueue,
        setTokenRewardsTextDisplay,
        setRedBoostLevel,
        setBlueBoostLevel,
        setRedBoostProgress,
        setBlueBoostProgress,
        setRedPersonalProgressStartTime,
        setBluePersonalProgressStartTime,
        setRedBoostProgressToNextLevel,
        setBlueBoostProgressToNextLevel,
        setTotalRedBoost,
        setTotalBlueBoost,
        setEventMatchStartTime,
        addChartData,
        clearChartData,
        setRedCreditsSpent,
        setBlueCreditsSpent,
        setRedAvgPurchasePrice,
        setBlueAvgPurchasePrice,
        setRedAvgPoints,
        setBlueAvgPoints,
        setTotalUniqueUser,
    } = useBoostStore();

    const {
        startVoting,
        setCurrentState,
        handleVoteUpdate,
        hideVotingTab,
        showVotingTab,
    } = useVotingStore();

    const { setChatLeaderboard, setCurrentUserRank, chatLeaderboard } =
        useChatAppLeaderboardStore();

    const { activeChannel, setActiveChannel, generalChannel, setToken } =
        usePubnubStore();
    const {
        setSkyboxInviteId,
        setSkyboxInviteDetail,
        setOpenSkyboxInviteModal,
        setSkyboxes,
        selectedSkybox,
        setChannelMembers,
        toggleSkybox,
        setSelectedSkybox,
        populateChannelMembers,
        setSelectedColor,
        applySelectedColor,
    } = useSkyboxStore();

    const { users, getUser } = useGetUsersStore();
    const { addNotification } = useNotificationStore();

    const [stopUpdates, setStopUpdates] = useState<() => void>(() => () => {});
    const updateUsers = useGetUsersStore((state) => state.updateUsers);

    const fetchChannel = async () => {
        if (!pubnub) return;
        if (!activeChannel) {
            console.error("Channel is null");
            return null;
        }

        if (!activeChannel.id) {
            console.error("Channel id is undefined or null");
            return null;
        }

        console.log("active channel", activeChannel);
        return await pubnub.getChannel(activeChannel.id);
    };

    const fetchHistory = async (channel: Channel) => {
        const mgs = await channel.getHistory();
        setLoadMore(mgs.isMore);
        setHistory(mgs.messages);
        await handleUserIds(mgs.messages);
    };

    const fetchPinnedMessage = async (channel: Channel) => {
        const pin = await channel.getPinnedMessage();
        if (pin) {
            setPinMessage(pin);
        }
    };

    const handleChatHistory = async () => {
        const channel = await fetchChannel();
        if (!channel) return;
        console.log("stream.tsx handle chat history", channel, channel.name);
        await fetchHistory(channel);
        await fetchPinnedMessage(channel);
        setActiveChannel(channel);
    };

    const handleUserIds = async (messages: Message[]) => {
        const userIds = Array.from(
            new Set(messages.map((message) => message.userId))
        );
        await addUsers(userIds);
    };

    const addUsers = async (ids: string[]) => {
        if (!pubnub) {
            return;
        }

        await updateUsers(pubnub, ids);
    };

    const fetchUsers = useGetUsersStore((state) => state.fetchUsers);
    useEffect(() => {
        if (!pubnub) return;
        fetchUsers(pubnub);
    }, [pubnub]);

    //Remmed out as this seemed to be causing pubnub leave events to spam on the client.
    // useEffect(() => {
    //     if (users.length === 0) return;
    //     const stopUpdates = User.streamUpdatesOn(users, (updatedUsers) => {
    //         stopUpdates();
    //         setUsers(updatedUsers);
    //     });
    //     return () => {
    //         stopUpdates();
    //     };
    // }, [users]);
    // Main useEffect for handling chat history
    useEffect(() => {
        handleChatHistory();
    }, [activeChannel?.id, pubnub]);

    const handleModerationEvent = async (payload: Event<"custom">) => {
        const { token } = payload.payload;
        if (!activeChannel || !token) return;
        deleteMessage(token);
        console.log("deleting message");
    };

    useEffect(() => {
        let currentListener: Pubnub.ListenerParameters;
        let signalMessageListener: (() => void) | undefined;
        let signalDirectMessageListener: (() => void) | undefined;
        let moderationListener: (() => void) | undefined;
        let channelDisconnect: any = null;

        const handleChannelSubscribe = async () => {
            if (!pubnub) return;
            if (!activeChannel) return;

            console.log(
                "Setting up subscription for channel:",
                activeChannel.id
            );

            // Set up new event listeners
            signalMessageListener = pubnub.listenForEvents({
                channel: `s.${eventId.toString()}`,
                type: "custom",
                method: "publish",
                callback: (event: any) => {},
            });

            signalDirectMessageListener = pubnub.listenForEvents({
                channel: `u.${userDB?._id?.toString()}`,
                type: "custom",
                method: "publish",
                callback: (event: any) => {},
            });

            moderationListener = pubnub.listenForEvents({
                channel: activeChannel.id,
                type: "custom",
                method: "signal",
                callback: handleModerationEvent,
            });

            // Create and store the current listener
            currentListener = {
                message: async (messageEvent: Pubnub.MessageEvent) => {
                    // Filter messages by channel to avoid cross-channel contamination

                    const isUserDirectChannel =
                        messageEvent.channel === `u.${userDB?._id?.toString()}`;
                    const isSystemSignalChannel =
                        messageEvent.channel === `s.${eventId.toString()}`;

                    // Only process direct messages for the user
                    if (isUserDirectChannel) {
                        console.log("Processing direct user message");
                        const message: string = messageEvent.message;
                        if (!message) {
                            console.log(
                                "No message coming from direct message channel",
                                `u.${userDB?._id?.toString()}`
                            );
                            return;
                        }

                        const directMessageObject: DirectMessage =
                            JSON.parse(message);
                        const { type: directMessageType, data } =
                            directMessageObject;

                        // Handle direct message types
                        switch (directMessageType) {
                            case DIRECT_MESSAGE_EVENT_TYPE.PurchaseSkybox: {
                                setLoadingSpinner(false);
                                const purchaseSkyboxReponse =
                                    data as PubnubBase;
                                console.log(
                                    "pubnub token",
                                    purchaseSkyboxReponse.pubnubToken
                                );
                                setToken(purchaseSkyboxReponse.pubnubToken);
                                console.log("setting up pubnub");
                                break;
                            }
                            case DIRECT_MESSAGE_EVENT_TYPE.InviteUser: {
                                const inviteUserResponse = data as SkyboxInvite;
                                const {
                                    skyboxInviteId,
                                    skyboxName,
                                    skyboxOwnerId,
                                } = inviteUserResponse;
                                setSkyboxInviteId(skyboxInviteId);
                                setOpenSkyboxInviteModal(true);

                                const user = getUser(skyboxOwnerId);
                                if (!user) {
                                    console.error(
                                        "Error - Unable to find skybox owner from skybox invite"
                                    );
                                    return;
                                }

                                const skyboxOwner: SkyboxFan = {
                                    id: user.id,
                                    name: user.name,
                                    pfpUrl: user.profileUrl,
                                };

                                setSkyboxInviteDetail({
                                    skyboxName,
                                    skyboxOwner,
                                });

                                console.log(
                                    "fetch invite guid and openning skybox invite modal"
                                );
                                break;
                            }
                            case DIRECT_MESSAGE_EVENT_TYPE.AcceptInvite: {
                                const acceptInviteResponse = data as PubnubBase;
                                console.log(
                                    "pubnubTokentesting acceptInviteResponse.pubnubTokentesting",
                                    acceptInviteResponse.pubnubToken
                                );
                                // setToken(acceptInviteResponse.pubnubToken);

                                break;
                            }
                            case DIRECT_MESSAGE_EVENT_TYPE.RemoveUser: {
                                const removeUserResponse = data as PubnubBase;
                                setToken(removeUserResponse.pubnubToken);

                                console.log("user who got removed");
                                setActiveChannel(generalChannel);
                                toggleSkybox(false);
                                setSelectedSkybox(null);
                                break;
                            }
                            case DIRECT_MESSAGE_EVENT_TYPE.Message: {
                                const tokenReward = data as TokenRewardMessage;
                                const tokenRewardTextMessage =
                                    tokenReward.message;
                                setTokenRewardsTextDisplay(
                                    tokenRewardTextMessage
                                );
                            }
                            default:
                                console.log("Unknown type");
                        }
                    }

                    // Only process system messages
                    if (isSystemSignalChannel) {
                        console.log("Processing system signal message");
                        const message: string = messageEvent.message;
                        if (!message) {
                            console.log(
                                "No message coming from signal message channel",
                                `s.${eventId.toString()}`
                            );
                            return;
                        }

                        const boostObject: BoostSignalMessage =
                            JSON.parse(message);
                        switch (boostObject.boostEventType) {
                            case BOOST_EVENT_TYPE.START_MATCH: {
                                setIsMatchingRunning(true);

                                if (shouldShowNotification("Predictions")) {
                                    addNotification("Predictions", "");
                                }

                                const { roundNumber } = boostObject;

                                setRoundNumber(roundNumber);

                                //Reset UI Rallies V2
                                /*
                                setRedCreditsSpent(0);
                                setBlueCreditsSpent(0);
                                setRedAvgPurchasePrice(0);
                                setBlueAvgPurchasePrice(0);
                                setRedAvgPoints(0);
                                setBlueAvgPoints(0);
                                setTotalUniqueUser(0);
                                clearChartData();
                                setRedBlueRatio(0.5);
                                setTotalRedBoost(0);
                                setTotalBlueBoost(0);
                                */

                                //Reset UI
                                setRedComboMultiplier(1.0);
                                setBlueComboMultiplier(1.0);
                                setRedBoostLevel(1);
                                setBlueBoostLevel(1);
                                setRedBoostProgress(0);
                                setBlueBoostProgress(0);
                                setRedPersonalProgressStartTime(0);
                                setBluePersonalProgressStartTime(0);
                                setRedBoostProgressToNextLevel(0);
                                setBlueBoostProgressToNextLevel(0);

                                if (
                                    boostObject.eventMatchStartTime &&
                                    boostObject.eventMatchStartTime > 0
                                ) {
                                    setEventMatchStartTime(
                                        boostObject.eventMatchStartTime
                                    );
                                } else {
                                    setEventMatchStartTime(0);
                                }
                                break;
                            }
                            case BOOST_EVENT_TYPE.END_MATCH: {
                                setIsMatchingRunning(false);

                                const { roundNumber } = boostObject;
                                console.log(
                                    "END_MATCH - boostObject: ",
                                    boostObject.boosts
                                );

                                setRoundNumber(roundNumber);

                                //Reset Rally V2 UI
                                setRedCreditsSpent(0);
                                setBlueCreditsSpent(0);
                                setRedAvgPurchasePrice(0);
                                setBlueAvgPurchasePrice(0);
                                setRedAvgPoints(0);
                                setBlueAvgPoints(0);
                                setTotalUniqueUser(0);
                                clearChartData();
                                setRedBlueRatio(0.5);
                                setTotalRedBoost(0);
                                setTotalBlueBoost(0);

                                //Reset UI
                                setRedBlueRatio(0.5);
                                setRedComboMultiplier(1.0);
                                setBlueComboMultiplier(1.0);
                                setRedBoostLevel(1);
                                setBlueBoostLevel(1);
                                setRedBoostProgress(0);
                                setBlueBoostProgress(0);
                                setRedPersonalProgressStartTime(0);
                                setBluePersonalProgressStartTime(0);
                                setRedBoostProgressToNextLevel(0);
                                setBlueBoostProgressToNextLevel(0);
                                setTotalRedBoost(0);
                                setTotalBlueBoost(0);
                                setEventMatchStartTime(0);
                                break;
                            }
                            case BOOST_EVENT_TYPE.BOOSTS_TRIGGERED: {
                                const {
                                    roundNumber,
                                    boosts,
                                    blueComboMultiplier,
                                    redComboMultiplier,
                                    totalRedBoosts,
                                    totalBlueBoosts,
                                    redBlueRatio,
                                } = boostObject;
                                /*
                                console.log(
                                    "BOOSTS_TRIGGERED - boostObject: ",
                                    boostObject.boosts
                                );
                                */

                                setRoundNumber(roundNumber);
                                enqueue(boosts ?? []);
                                setRedComboMultiplier(redComboMultiplier ?? 0);
                                setBlueComboMultiplier(
                                    blueComboMultiplier ?? 0
                                );
                                setTotalRedBoost(totalRedBoosts);
                                setTotalBlueBoost(totalBlueBoosts);
                                setRedBlueRatio(redBlueRatio ?? 0.5);
                                break;
                            }
                            case BOOST_EVENT_TYPE.PERIODIC_UPDATE: {
                                const {
                                    roundNumber,
                                    totalRedBoosts,
                                    totalBlueBoosts,
                                    redBlueRatio,
                                    averageRedBoost,
                                    averageBlueBoost,
                                    totalUniqueUserCount,
                                } = boostObject;
                                setRoundNumber(roundNumber);
                                setTotalRedBoost(totalRedBoosts);
                                setTotalBlueBoost(totalBlueBoosts);
                                setRedBlueRatio(redBlueRatio ?? 0.5);
                                addChartData(redBlueRatio ?? 0.5);
                                setRedAvgPoints(averageRedBoost ?? 0);
                                setBlueAvgPoints(averageBlueBoost ?? 0);
                                setTotalUniqueUser(totalUniqueUserCount ?? 0);
                                break;
                            }

                            case BOOST_EVENT_TYPE.SET_WINNER: {
                                const { leaders } = boostObject;
                                if (leaders && leaders.length > 0) {
                                    var mappedLeaders = leaders.map((old) => ({
                                        Rank: old.r,
                                        PreviousRank: old.r,
                                        UserId: old.u,
                                        Score: old.s,
                                        Username: "",
                                        PfpImageUrl: "",
                                    }));

                                    setChatLeaderboard(mappedLeaders ?? []);
                                    const myRanking = mappedLeaders.find(
                                        (ranking: Leader) =>
                                            ranking.UserId === userId
                                    );
                                    if (!myRanking) {
                                        break;
                                    }
                                    setCurrentUserRank(myRanking.Rank);
                                }
                                break;
                            }

                            case BOOST_EVENT_TYPE.START_VOTE: {
                                const { voteUpdate } = boostObject;

                                // Only add notification if not already on the Voting tab
                                if (shouldShowNotification("Voting")) {
                                    addNotification("Voting", "");
                                }
                                const voteConfig = {
                                    stageId: eventId,
                                    title: voteUpdate?.voteTitle ?? "",
                                    duration: voteUpdate?.voteTimeSeconds ?? 60,
                                    initialVotes: 0,
                                    options: voteUpdate?.voteResults.map(
                                        (x, index) => ({
                                            optionId: optionIdsList[index],
                                            displayText: x.name,
                                            color: chartColorsList[index],
                                        })
                                    ) ?? [
                                        {
                                            optionId: "1",
                                            displayText: "Error",
                                            color: "#A855F7",
                                        },
                                    ],
                                };

                                // Start voting
                                startVoting(voteConfig);

                                // Explicitly show the tab for clarity
                                showVotingTab();
                                break;
                            }
                            case BOOST_EVENT_TYPE.PERIODIC_UPDATE_VOTE: {
                                const { voteUpdate } = boostObject;

                                if (voteUpdate != null) {
                                    const votingUpdate: VotingUpdate = {
                                        totalVotes: voteUpdate?.numberOfVotes,
                                        options: Object.fromEntries(
                                            voteUpdate?.voteResults.map(
                                                (option, index) => [
                                                    index + 1,
                                                    option.numberOfVotes,
                                                ]
                                            )
                                        ),
                                        timeRemaining:
                                            voteUpdate?.voteTimeSeconds,
                                        isFinalUpdate: voteUpdate.isFinalUpdate,
                                    };

                                    handleVoteUpdate(votingUpdate);

                                    if (voteUpdate.isFinalUpdate) {
                                        setCurrentState(VotingState.COMPLETED);
                                    }
                                }
                                break;
                            }

                            case BOOST_EVENT_TYPE.HIDE_VOTE: {
                                console.log("Hide Vote: ");

                                setCurrentState(VotingState.INACTIVE);
                                hideVotingTab();
                                break;
                            }

                            case BOOST_EVENT_TYPE.SET_SKYBOX: {
                                const { skyboxes } = boostObject;
                                if (skyboxes) {
                                    // const updateUserSkyboxes =
                                    //     useGetUsersStore.getState()
                                    //         .updateUserSkyboxes;

                                    // skyboxes.forEach((skybox) => {
                                    //     if (
                                    //         skybox._id &&
                                    //         skybox.skyboxChannelMembers &&
                                    //         skybox.skyboxPrimaryColor
                                    //     ) {
                                    //         updateUserSkyboxes(
                                    //             skybox.skyboxChannelMembers,
                                    //             skybox._id.toString(),
                                    //             skybox.skyboxPrimaryColor
                                    //         );
                                    //     }
                                    // });

                                    const emptySkyboxes = Array.from(
                                        {
                                            length:
                                                MAX_SKYBOX_SLOT -
                                                skyboxes.length,
                                        },
                                        generatePartialSkybox
                                    ) as ISkybox[];

                                    setSkyboxes([
                                        ...skyboxes,
                                        ...emptySkyboxes,
                                    ]);

                                    const _skybox = skyboxes.find((sb) => {
                                        return sb.skyboxChannelMembers.some(
                                            (channelMemberId) =>
                                                channelMemberId.toString() ===
                                                userId
                                        );
                                    });

                                    if (!_skybox) {
                                        return;
                                    }

                                    populateChannelMembers(users, _skybox);
                                    const updatedSkyboxColor =
                                        colorNameToSkyboxColorMap[
                                            _skybox.skyboxPrimaryColor
                                        ];
                                    setSelectedColor(updatedSkyboxColor);
                                    applySelectedColor();
                                }
                                break;
                            }
                            case BOOST_EVENT_TYPE.SKYBOX_EMOJI: {
                                const { skyboxEmojis } = boostObject;

                                if (!skyboxEmojis) {
                                    console.log("No emoji available to render");
                                    break;
                                }

                                console.log(
                                    "skybox emoji animation",
                                    skyboxEmojis
                                );

                                skyboxEmojis?.forEach((skyboxEmoji) => {
                                    const { skyboxId, emoji } = skyboxEmoji;

                                    triggerEmote(`skybox-${skyboxId}`, emoji);
                                });
                                break;
                            }
                            default: {
                                console.log("Unknown boost event type");
                                break;
                            }
                        }
                    }
                },

                signal: (signalEvent) => {
                    // Only process signals for the current channel
                    if (signalEvent.channel !== activeChannel.id) {
                        console.log(
                            `Ignoring signal from different channel: ${signalEvent.channel}`
                        );
                        return;
                    }
                    // Process the signal for the current channel
                    handleSignalEvent(signalEvent);

                    // Handle button signals
                    if (signalEvent.message.startsWith("BUTTON_")) {
                        const messageParts = signalEvent.message.split(":");
                        if (messageParts.length > 2) {
                            const buttonName: string = messageParts[0];
                            const newSupply: number = messageParts[1];
                            const newStreamScore: number = messageParts[2];

                            document.body.dispatchEvent(
                                new CustomEvent("supplyUpdate", {
                                    detail: {
                                        buttonName,
                                        newSupply,
                                        newStreamScore,
                                    },
                                })
                            );
                        }
                    }
                },
            };
            pubnub.sdk.addListener(currentListener);

            // Join the active channel and listen for messages
            console.log("✅ Joining channel:", activeChannel.id);
            const disconnect = await activeChannel.join((message: Message) => {
                // Strict channel matching to ensure we only process messages for the current channel
                if (message.channelId === activeChannel.id) {
                    console.log(
                        "Received message for current channel:",
                        activeChannel.id
                    );
                    console.log(
                        "✅ Calling handleHistoryUpdate on active channel :",
                        activeChannel.id
                    );
                    handleHistoryUpdate(message, activeChannel);
                } else {
                    console.log(
                        `Ignoring message from different channel: ${message.channelId}`
                    );
                }
            });

            // Store the disconnect function
            channelDisconnect = disconnect;
            setStopUpdates(() => disconnect.disconnect);

            // Return cleanup function for this subscription
            return () => {
                console.log(
                    "✅ Cleaning up current channel subscription for:",
                    activeChannel.id
                );
                if (disconnect) {
                    disconnect.disconnect();
                }
                if (currentListener) {
                    pubnub.sdk.removeListener(currentListener);
                }
                if (signalMessageListener) signalMessageListener();
                if (signalDirectMessageListener) signalDirectMessageListener();
                if (moderationListener) moderationListener();
                console.log(
                    "✅ Cleaned up current channel subscription for:",
                    activeChannel.id
                );
            };
        };

        // Execute the channel subscription
        handleChannelSubscribe();

        // Return cleanup function to be executed when component unmounts or deps change
        return () => {
            console.log("Cleaning up effect for channel:", activeChannel?.id);

            // Clean up the channel subscription
            if (channelDisconnect) {
                channelDisconnect.disconnect();
            }

            // Remove all listeners
            if (currentListener && pubnub) {
                // @url - https://www.pubnub.com/docs/sdks/react#publish-and-subscribe
                pubnub.sdk.removeListener(currentListener);
            }
        };
    }, [activeChannel?.id]);
    const handleLoadMoreMessages = async () => {
        if (!activeChannel || !loadMore) return;
        loadMoreMessages(activeChannel);
    };

    const handlePublish = async (
        message: string,
        quote?: Message | null,
        metadata?: { [objKey: string]: any }
    ) => {
        if (!activeChannel) return;

        const isAwsMessagesEnabled = getAWSMessagesEnabled();

        //if NOT isAwsMessagesEnabled, then send emojis to processEmoji queue, otherwise disable
        if (!isAwsMessagesEnabled) {
            const regexExp = /(\u2764|\🎉|\🔥|\💥|\👋|\👏)/;
            if (regexExp.test(message)) {
                const userId: string = userDB?._id!.toString() ?? "";

                console.log("Found emoji: ", message);
                const ivsChatMessageUrl = getIvsChatMessageUrl();
                const authorizationHeader = getClientSideCookieValue(
                    "wildcardAccessToken"
                );
                if (authorizationHeader !== null && userId !== "") {
                    axios.post(
                        ivsChatMessageUrl,
                        {
                            stageId: eventId,
                            vendorEventId,
                            userId,
                            message, //send the whole message for processing
                            authorizationHeader,
                        },
                        {
                            headers: {
                                "Content-Type": "application/json",
                            },
                        }
                    );
                }
            }
        }

        //if isAwsMessagesEnabled, send all chat messages for batch processing
        if (isAwsMessagesEnabled) {
            const ivsChatMessageUrl = getIvsChatMessageUrl();
            const authorizationHeader = getClientSideCookieValue(
                "wildcardAccessToken"
            );
            if (!authorizationHeader) {
                return;
            }

            const skyboxId = selectedSkybox?._id?.toString();
            axios.post(
                ivsChatMessageUrl,
                {
                    stageId: eventId,
                    vendorEventId,
                    userId,
                    message,
                    skyboxId,
                    authorizationHeader,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        handlePublishMessage(activeChannel, message, quote, metadata);
    };

    // useEffect(() => {
    //     const handlePresence = async () => {
    //         if (!activeChannel) return;
    //         const presence = await activeChannel.whoIsPresent();
    //         setChatPresence(presence);
    //         const stopUpdates = await activeChannel.streamPresence(
    //             async (userIds) => {
    //                 await addUsers(userIds);
    //                 setChatPresence(userIds);
    //             }
    //         );
    //         return () => {
    //             stopUpdates();
    //         };
    //     };

    //     handlePresence();
    // }, [activeChannel?.id]);

    const handleHistoryUpdate = (
        message: Message,
        currentActiveChannel: Channel | null
    ) => {
        console.log(
            "current active channel",
            currentActiveChannel,
            "stream.tsx handle history update",
            message
        );
        setHistory((prevHistory) =>
            historyUpdate(prevHistory, message, currentActiveChannel)
        );
    };
    const handleUnpinMessage = async () => {
        if (!activeChannel || !pinMessage) return;
        await activeChannel.unpinMessage();
        setPinMessage(null);
    };

    const handleThreadConnection = async () => {
        stopUpdates();
        setActiveChannel(null);
    };

    const handleDeleteEvent = async (message: Message) => {
        if (!pubnub) return;
        if (!activeChannel) return;
        pubnub.emitEvent({
            type: "custom",
            channel: activeChannel.id,
            payload: { token: message.timetoken },
            method: "signal",
        });
    };

    const userId: string = userDB?._id!.toString() ?? "";

    return (
        <div className="flex flex-col h-full font-sans">
            <Header />
            <BuyCreditsDrawer blurBackground={false} />
            <div className="grow h-full flex justify-between items-start flex-col md:flex-row md:min-h-0">
                <div className="flex w-full h-1/2 md:h-full relative  sm: max-h-[fit-content]">
                    <div className="grow [&_video]:object-fill md:[&_video]:object-contain relative bg-blue-300 sm:max-h-[fit-content]">
                        <VideoPlayer />
                        <div
                            className="absolute top-0 right-0 h-[325px] w-[90px] md:w-[110px]"
                            style={{
                                display:
                                    chatLeaderboard.length === 0
                                        ? "none"
                                        : "block",
                            }}
                        >
                            <ChatLeaderboard
                                leaders={chatLeaderboard}
                                currentUserId={userId}
                            />
                        </div>
                    </div>
                </div>
                <ConfirmationProvider>
                    <ChatAppMarketProvider>
                        <ChatApps>
                            <ChatAppTopCoinsProvider>
                                <ChatAppMyCoinsProvider>
                                    <ChatAppStreamCoinsBuySellProvider>
                                        <StreamChat
                                            chatHistory={history}
                                            pinMessage={pinMessage}
                                            onSendMessage={handlePublish}
                                            channel={activeChannel}
                                            onLoadMoreMessages={
                                                handleLoadMoreMessages
                                            }
                                            isMore={loadMore}
                                            // presence={chatPresence}
                                            // onSendAction={handleSendAction}
                                            onUpdateHistory={
                                                handleHistoryUpdate
                                            }
                                            onUnpinMessage={handleUnpinMessage}
                                            onSetPinnedMessage={setPinMessage}
                                            onRefreshHistory={handleChatHistory}
                                            onThreadChannel={
                                                handleThreadConnection
                                            }
                                            onEmitDelete={handleDeleteEvent}
                                            setChatLoadingHistory={resetHistory}
                                        />
                                    </ChatAppStreamCoinsBuySellProvider>
                                </ChatAppMyCoinsProvider>
                            </ChatAppTopCoinsProvider>
                        </ChatApps>
                    </ChatAppMarketProvider>
                </ConfirmationProvider>
            </div>
        </div>
    );
};
export default Stream;
