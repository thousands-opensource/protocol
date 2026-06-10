import { COOKIES_ACCESS_TOKEN_WILDCARD } from "@/utils/accountAPIUtil";
import axios from "axios";
import {
    createContext,
    Dispatch,
    ReactNode,
    SetStateAction,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import Cookies from "js-cookie";
import { useStreamContext } from "./streamContext";
import { AUTO_POLLING_INTERVAL_MS } from "@/constants/constants";
import { ChatApp } from "@repo/interfaces";
import { getTopCoinsUrl } from "@/utils/environmentUtilWCA";

interface ChatAppTopCoinsProviderProps {
    children: ReactNode | ReactNode[];
}

interface StreamCoin {
    CoinName: string;
    Price: number;
}

interface ChatAppTopCoinsContextInterface {
    topCoinPositions: StreamCoin[];
    setTopCoinPositions: Dispatch<SetStateAction<StreamCoin[]>>;
    fetchTopPositions: () => Promise<void>;
}

const ChatAppTopCoinsContext = createContext<ChatAppTopCoinsContextInterface>(
    {} as ChatAppTopCoinsContextInterface
);

const useChatAppTopCoinsContext = () => {
    const context = useContext(ChatAppTopCoinsContext);

    if (!context) {
        throw new Error(
            "useChatAppTopCoinsContext must be used within an [streamId].tsx"
        );
    }
    return context;
};

const ChatAppTopCoinsProvider = ({
    children,
}: ChatAppTopCoinsProviderProps) => {
    const { chatApp } = useStreamContext();
    const [topCoinPositions, setTopCoinPositions] = useState<
        { CoinName: string; Price: number }[]
    >([]);
    const [autoPolling, setAutoPolling] = useState<boolean>(false);

    const fetchTopPositions = useCallback(async () => {
        try {
            const wildcardAccessToken = Cookies.get(
                COOKIES_ACCESS_TOKEN_WILDCARD
            );
            const topCoinsUrl = getTopCoinsUrl();

            const topPositionsResponse = await axios.get(topCoinsUrl, {
                headers: {
                    Authorization: `Bearer ${wildcardAccessToken}`,
                    "Content-Type": "application/json",
                },
            });

            setTopCoinPositions(topPositionsResponse.data);
        } catch (e: any) {
            const errMsg = "Error failed to fetch top streme coin positions";
            console.error(errMsg, e);
        }
    }, []);

    // Initiate api call and trigger polling to true for every 30 sec when chatApp === STREMECOIN
    useEffect(() => {
        if (chatApp === ChatApp.STREMECOIN) {
            fetchTopPositions();

            const polling = setInterval(() => {
                setAutoPolling(true);
            }, AUTO_POLLING_INTERVAL_MS);

            return () => {
                setAutoPolling(false);
                clearInterval(polling);
            };
        }
    }, [chatApp]);

    // Render updated top positions when auto polling set to true
    useEffect(() => {
        if (autoPolling) {
            fetchTopPositions();
            setAutoPolling(false);
        }
    }, [autoPolling]);

    const chatAppTopCoinsState = useMemo(
        () => ({
            topCoinPositions,
            setTopCoinPositions,
            fetchTopPositions,
        }),
        [topCoinPositions, fetchTopPositions]
    );

    return (
        <ChatAppTopCoinsContext.Provider value={chatAppTopCoinsState}>
            {children}
        </ChatAppTopCoinsContext.Provider>
    );
};

export default ChatAppTopCoinsProvider;
export { useChatAppTopCoinsContext };
