import { Stage } from "amazon-ivs-web-broadcast";
import {
    createContext,
    Dispatch,
    ReactNode,
    SetStateAction,
    useContext,
    useMemo,
    useState,
} from "react";

interface StreamControlProviderProps {
    children?: ReactNode;
}
interface StreamControlContextInterface {
    isMicrophoneOn: boolean;
    setIsMicrophoneOn: Dispatch<SetStateAction<boolean>>;
    isVideoOn: boolean;
    setIsVideoOn: Dispatch<SetStateAction<boolean>>;
    isShareScreenOn: boolean;
    setIsShareScreenOn: Dispatch<SetStateAction<boolean>>;
    isOpenMoreOptions: boolean;
    setIsOpenMoreOptions: Dispatch<SetStateAction<boolean>>;
    isCallEnded: boolean;
    setIsCallEnded: Dispatch<SetStateAction<boolean>>;
    isMoreCallEndedOptions: boolean;
    setIsMoreCallEndedOptions: Dispatch<SetStateAction<boolean>>;
}

const StreamControlContext = createContext<StreamControlContextInterface>(
    {} as StreamControlContextInterface
);

const useStreamControlContext = () => {
    const context = useContext(StreamControlContext);

    if (!context) {
        throw new Error(
            "useStreamContext must be used within an [streamId].tsx"
        );
    }
    return context;
};

const StreamControlProvider = ({ children }: StreamControlProviderProps) => {
    // Stream Controls
    const [isMicrophoneOn, setIsMicrophoneOn] = useState<boolean>(false);
    const [isVideoOn, setIsVideoOn] = useState<boolean>(false);
    const [isShareScreenOn, setIsShareScreenOn] = useState<boolean>(false);
    const [isOpenMoreOptions, setIsOpenMoreOptions] = useState<boolean>(false);
    const [isCallEnded, setIsCallEnded] = useState<boolean>(false);
    const [isMoreCallEndedOptions, setIsMoreCallEndedOptions] =
        useState<boolean>(false);

    const streamControlState = useMemo(
        () => ({
            isMicrophoneOn,
            setIsMicrophoneOn,
            isVideoOn,
            setIsVideoOn,
            isShareScreenOn,
            setIsShareScreenOn,
            isOpenMoreOptions,
            setIsOpenMoreOptions,
            isCallEnded,
            setIsCallEnded,
            isMoreCallEndedOptions,
            setIsMoreCallEndedOptions,
        }),
        [
            isMicrophoneOn,
            isVideoOn,
            isShareScreenOn,
            isOpenMoreOptions,
            isCallEnded,
            isMoreCallEndedOptions,
        ]
    );

    return (
        <StreamControlContext.Provider value={streamControlState}>
            {children}
        </StreamControlContext.Provider>
    );
};

export default StreamControlProvider;
export { useStreamControlContext };
