import { COOKIES_ACCESS_TOKEN_WILDCARD } from "@/utils/accountAPIUtil";
import axios from "axios";
import {
    createContext,
    Dispatch,
    ReactNode,
    SetStateAction,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import Cookies from "js-cookie";
import { useStreamContext } from "./streamContext";
import { ChatApp } from "@repo/interfaces";
import { getMyCoinsUrl } from "@/utils/environmentUtilWCA";

interface ChatAppMyCoinsProviderProps {
    children: ReactNode | ReactNode[];
}

interface ChatAppMyCoinsContextInterface {
    myCoinPositions: any[];
    setMyCoinPositions: Dispatch<SetStateAction<any[]>>;
}

const ChatAppMyCoinsContext = createContext<ChatAppMyCoinsContextInterface>(
    {} as ChatAppMyCoinsContextInterface
);

const useChatAppMyCoinsContext = () => {
    const context = useContext(ChatAppMyCoinsContext);

    if (!context) {
        throw new Error(
            "useChatAppMyCoinsContext must be used within an [streamId].tsx"
        );
    }
    return context;
};

const ChatAppMyCoinsProvider = ({ children }: ChatAppMyCoinsProviderProps) => {
    const { chatApp } = useStreamContext();
    const [myCoinPositions, setMyCoinPositions] = useState<any[]>([]);

    const fetchMyPositions = async () => {
        try {
            const wildcardAccessToken = Cookies.get(
                COOKIES_ACCESS_TOKEN_WILDCARD
            );
            const myCoinsUrl = getMyCoinsUrl();
            const myPositionsResponse = await axios.get(myCoinsUrl, {
                headers: {
                    Authorization: `Bearer ${wildcardAccessToken}`,
                    "Content-Type": "application/json",
                },
            });

            const _myPositions = myPositionsResponse.data;

            const updatedMyPositions = _myPositions.map((position: any) => {
                const coinHolding = position.CoinHolding;
                return {
                    CoinName: coinHolding.CoinName,
                    Quantity: coinHolding.Quantity,
                };
            });

            setMyCoinPositions(updatedMyPositions);
        } catch (e: any) {
            const errMsg = "Failed to fetch my position for streme coin";
            console.error(errMsg, e);
        }
    };

    useEffect(() => {
        if (chatApp === ChatApp.STREMECOIN) {
            fetchMyPositions();
        }
    }, [chatApp]);

    const chatAppMyCoinsState = useMemo(
        () => ({ myCoinPositions, setMyCoinPositions }),
        [myCoinPositions]
    );

    return (
        <ChatAppMyCoinsContext.Provider value={chatAppMyCoinsState}>
            {children}
        </ChatAppMyCoinsContext.Provider>
    );
};

export default ChatAppMyCoinsProvider;
export { useChatAppMyCoinsContext };
