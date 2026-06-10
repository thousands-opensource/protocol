import {
    createContext,
    Dispatch,
    ReactNode,
    SetStateAction,
    useContext,
    useMemo,
    useState,
} from "react";

interface StreamScoreProviderProps {
    children: ReactNode | ReactNode[];
}

interface StreamScoreContextInterface {
    streamScore: number;
    setStreamScore: Dispatch<SetStateAction<number>>;
}

const StreamScoreContext = createContext<StreamScoreContextInterface>(
    {} as StreamScoreContextInterface
);

const useStreamScoreContext = () => {
    const context = useContext(StreamScoreContext);

    if (!context) {
        throw new Error(
            "useStreamScoreContext must be used within an [streamId].tsx"
        );
    }
    return context;
};

const StreamScoreProvider = ({ children }: StreamScoreProviderProps) => {
    const [streamScore, setStreamScore] = useState<number>(0);

    const streamScoreState = useMemo(
        () => ({
            streamScore,
            setStreamScore,
        }),
        [streamScore]
    );

    return (
        <StreamScoreContext.Provider value={streamScoreState}>
            {children}
        </StreamScoreContext.Provider>
    );
};

export default StreamScoreProvider;
export { useStreamScoreContext };
