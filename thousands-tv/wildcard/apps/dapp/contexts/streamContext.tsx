import {
    createContext,
    Dispatch,
    ReactNode,
    SetStateAction,
    useContext,
    useMemo,
    useState,
    useCallback,
} from "react";
import { getUserDisplayName } from "@/utils/streamUtils";
import { ChatApp, IUser } from "@repo/interfaces";
import { SignalEvent } from "pubnub";
import {
    ChannelEntity,
    Chat,
    MessageEnvelope,
    MessagePayload,
} from "@pubnub/react-chat-components";
import theme from "@/theme";
import { Stage } from "amazon-ivs-web-broadcast";

interface StreamProviderProps {
    userDB: IUser;
    streamId: string;
    eventId: string;
    streamName: string;
    vendorEventId: string;
    channels: ChannelEntity[];
    formattedActiveChannel: ChannelEntity;
    streamPlaybackUrl: string;
    children?: ReactNode;
    chatSdk?: boolean;
    ticketTier: string;
    chatApp: ChatApp;
}

interface StreamInterface {
    streamId: string;
    eventId: string;
    streamName: string;
    channels: ChannelEntity[];
    ticketTier: string;
    playbackUrl: string;
    toggleToStartPlaying: boolean;
    setToggleToStartPlaying: Dispatch<SetStateAction<boolean>>;
    toggleToStopPlaying: boolean;
    setToggleToStopPlaying: Dispatch<SetStateAction<boolean>>;
    handleSignalEvent: (signal: SignalEvent) => void;
    setPlaybackUrl: Dispatch<SetStateAction<string>>;
    activeChannel: ChannelEntity;
    setActiveChannel: Dispatch<SetStateAction<ChannelEntity>>;
    vendorEventId: string;
    stage: Stage | null;
    setStage: Dispatch<SetStateAction<Stage | null>>;
    liveChatActions: any;
    setLiveChatActions: Dispatch<SetStateAction<any>>;
    openChatActions: boolean;
    setOpenChatActions: Dispatch<SetStateAction<boolean>>;
    openLiveChatActions: boolean;
    setOpenLiveChatActions: Dispatch<SetStateAction<boolean>>;
    selectedChatAction: any;
    setSelectedChatAction: Dispatch<SetStateAction<any>>;
    creditsToWager: number;
    setCreditsToWager: Dispatch<SetStateAction<number>>;
    yourPollSelection: string;
    setYourPollSelection: Dispatch<SetStateAction<string>>;
    showChat: boolean;
    setShowChat: Dispatch<SetStateAction<boolean>>;

    chatApp: ChatApp;
}

const StreamContext = createContext<StreamInterface>({} as StreamInterface);

const useStreamContext = () => {
    const context = useContext(StreamContext);

    if (!context) {
        throw new Error(
            "useStreamContext must be used within an [streamId].tsx"
        );
    }
    return context;
};

const StreamProvider = ({
    userDB,
    eventId,
    streamId,
    vendorEventId,
    streamName,
    channels,
    formattedActiveChannel,
    streamPlaybackUrl,
    children,
    chatSdk,
    ticketTier,
    chatApp,
}: StreamProviderProps) => {
    // const { setCreditBalance } = useWildfileUserContext();
    const [liveChatActions, setLiveChatActions] = useState<any[]>([]);
    const [stage, setStage] = useState<Stage | null>(null);
    const [activeChannel, setActiveChannel] = useState<ChannelEntity>(
        formattedActiveChannel
    );
    const [playbackUrl, setPlaybackUrl] = useState<string>(streamPlaybackUrl);
    const [toggleToStartPlaying, setToggleToStartPlaying] =
        useState<boolean>(false);
    const [toggleToStopPlaying, setToggleToStopPlaying] =
        useState<boolean>(false);
    const [openChatActions, setOpenChatActions] = useState<boolean>(false);
    const [openLiveChatActions, setOpenLiveChatActions] =
        useState<boolean>(false);
    const [selectedChatAction, setSelectedChatAction] = useState<any>(null);
    const [creditsToWager, setCreditsToWager] = useState<number>(550);
    const [yourPollSelection, setYourPollSelection] = useState<string>("");
    const [showChat, setShowChat] = useState<boolean>(true);

    const displayName = getUserDisplayName(userDB);
    // const START_TIME = 1734632392440;

    const handleSignalEvent = useCallback((signal: SignalEvent) => {
        onSignalHandler(signal);
    }, []);

    const onSignalHandler = (signal: SignalEvent) => {
        if (signal.message.startsWith("inviteonstage|")) {
            const userName = signal.message.replace("inviteonstage|", "");
            //Is this invite for you?
            if (userName == displayName) {
                if (
                    confirm(
                        "You're being invited up on stage.  Do you accept the invitation?"
                    )
                ) {
                    window.location.href = `/realtimestream/${streamId}`;
                }
            }
        } else if (signal.message.startsWith("removefromstage|")) {
            const userName = signal.message.replace("removefromstage|", "");
            //Is this remove from stage for you?
            if (userName == displayName) {
                window.location.href = `/stream/${streamId}`;
            }
        } else if (signal.message === "streamstart") {
            setToggleToStartPlaying((previousState) => !previousState);
        } else if (signal.message === "streamend") {
            setToggleToStopPlaying((previousState) => !previousState);
        }
    };

    const onMessageHanlder = (message: MessageEnvelope) => {
        const messagePayload = message.message as MessagePayload;

        console.log("on message hanlder", message);
        console.log("on message hanlder message payload", messagePayload);
        if (!messagePayload.type) {
            return;
        }

        if (["system-yesno", "system-join"].includes(messagePayload.type)) {
            setLiveChatActions([...liveChatActions, messagePayload]);

            setYourPollSelection("");
            setCreditsToWager(550);

            if (!openLiveChatActions) {
                setOpenLiveChatActions(true);
            }

            /*
            // if chat action modal not open then open it
            if (!openChatActions) {
                setOpenChatActions(true);
            }
            */
        }
    };

    const streamState = useMemo(
        () => ({
            eventId,
            streamId,
            vendorEventId,
            streamName,
            channels,
            ticketTier,
            playbackUrl,
            toggleToStartPlaying,
            toggleToStopPlaying,
            setToggleToStartPlaying,
            setToggleToStopPlaying,
            handleSignalEvent,
            setPlaybackUrl,
            activeChannel,
            setActiveChannel,
            stage,
            setStage,
            liveChatActions,
            setLiveChatActions,
            openChatActions,
            setOpenChatActions,
            selectedChatAction,
            setSelectedChatAction,
            openLiveChatActions,
            setOpenLiveChatActions,
            creditsToWager,
            setCreditsToWager,
            yourPollSelection,
            setYourPollSelection,
            showChat,
            setShowChat,

            chatApp,
        }),
        [
            eventId,
            streamId,
            vendorEventId,
            streamName,
            channels,
            ticketTier,
            playbackUrl,
            toggleToStartPlaying,
            toggleToStopPlaying,
            setToggleToStartPlaying,
            setToggleToStopPlaying,
            handleSignalEvent,
            activeChannel,
            stage,
            liveChatActions,
            setLiveChatActions,
            openChatActions,
            setOpenChatActions,
            selectedChatAction,
            setSelectedChatAction,
            openLiveChatActions,
            setOpenLiveChatActions,
            creditsToWager,
            setCreditsToWager,
            yourPollSelection,
            setYourPollSelection,
            showChat,

            chatApp,
        ]
    );

    return (
        <StreamContext.Provider value={streamState}>
            {chatSdk ? (
                <>{children}</>
            ) : (
                <Chat
                    currentChannel={activeChannel.id}
                    channels={[`group.${eventId}.system`, activeChannel.id]}
                    // users={users}
                    onSignal={onSignalHandler}
                    onMessage={onMessageHanlder}
                    theme={theme["config"].initialColorMode}
                >
                    {children}
                </Chat>
            )}
        </StreamContext.Provider>
    );
};

export default StreamProvider;
export { useStreamContext };
