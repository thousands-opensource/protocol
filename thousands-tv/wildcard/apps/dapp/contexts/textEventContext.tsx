import {
    createContext,
    Dispatch,
    ReactNode,
    SetStateAction,
    useContext,
    useMemo,
    useState,
} from "react";
import { ChannelEntity, Chat, useUsers } from "@pubnub/react-chat-components";
import theme from "@/theme";
import { TextEvent } from "@/types";

interface TextEventProviderProps {
    textEvents: TextEvent[];
    formattedActiveChannel: ChannelEntity;
    children?: ReactNode;
}

interface TextEventInterface {
    textEvents: TextEvent[];
    activeChannel: ChannelEntity;
    setActiveChannel: Dispatch<SetStateAction<ChannelEntity>>;
}

const TextEventContext = createContext<TextEventInterface>(
    {} as TextEventInterface
);

const useTextEventContext = () => {
    const context = useContext(TextEventContext);

    if (!context) {
        throw new Error(
            "useTextEventContext must be used within an [eventId].tsx"
        );
    }
    return context;
};

const TextEventProvider = ({
    textEvents,
    formattedActiveChannel,
    children,
}: TextEventProviderProps) => {
    const [activeChannel, setActiveChannel] = useState<ChannelEntity>(
        formattedActiveChannel
    );

    const textEventState = useMemo(
        () => ({
            textEvents,
            activeChannel,
            setActiveChannel,
        }),
        [activeChannel, textEvents]
    );

    const [users] = useUsers();

    const textEventSystemIds = textEvents.map((te) => {
        const textEventId = te.id.toString();
        return `group.${textEventId}.system`;
    });
    return (
        <TextEventContext.Provider value={textEventState}>
            <Chat
                currentChannel={activeChannel.id}
                channels={[...textEventSystemIds, activeChannel.id]}
                users={users}
                theme={theme["config"].initialColorMode}
            >
                {children}
            </Chat>
        </TextEventContext.Provider>
    );
};

export default TextEventProvider;
export { useTextEventContext };
