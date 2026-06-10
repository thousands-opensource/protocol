import { COOKIES_ACCESS_TOKEN_WILDCARD } from "@/utils/accountAPIUtil";
import { getPriceQuoteUrl } from "@/utils/environmentUtilWCA";
import axios, { AxiosResponse } from "axios";
import {
    createContext,
    Dispatch,
    ReactNode,
    SetStateAction,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";
import Cookies from "js-cookie";
import { MarketOrder } from "@/features/Stream";
import { useStreamContext } from "./streamContext";
import { ChatApp } from "@repo/interfaces";

interface ChatAppMarketProviderInterface {
    children: ReactNode | ReactNode[];
}

interface ChatAppMarketInterface {
    priceQuoteGuid: string;
    setPriceQuoteGuid: Dispatch<SetStateAction<string>>;
    handleFetchPriceQuote: (
        orderType: string,
        name: string,
        quantity: number
    ) => Promise<AxiosResponse<any, any>>;
    renderConfirmationOrderEntryText: (
        marketOrder: MarketOrder,
        coinName: string,
        quantity: number,
        price: number,
        tax: number
    ) => string;
}

const ChatAppMarketContext = createContext<ChatAppMarketInterface>(
    {} as ChatAppMarketInterface
);

const useChatAppMarketContext = () => {
    const context = useContext(ChatAppMarketContext);

    if (!context) {
        throw new Error(
            "useChatAppMarketContext must be used within an [streamId].tsx"
        );
    }
    return context;
};

const ChatAppMarketProvider = ({
    children,
}: ChatAppMarketProviderInterface) => {
    const { chatApp } = useStreamContext();
    const [priceQuoteGuid, setPriceQuoteGuid] = useState<string>("");

    const renderConfirmationOrderEntryText = useCallback(
        (
            marketOrder: MarketOrder,
            coinName: string,
            quantity: number,
            price: number,
            tax: number
        ) => {
            switch (marketOrder) {
                case MarketOrder.BUY:
                    if (chatApp === ChatApp.WILDCARD) {
                        return `Please confirm your purchase of this boost for a total cost of ${price} credits.`;
                    }

                    return `Please confirm your BUY order for ${quantity} ${coinName} for a total cost of ${
                        price + tax
                    }.`;
                case MarketOrder.SELL:
                    return `Please confirm your SELL order for ${quantity} ${coinName} for proceeds totaling ${
                        price - tax
                    }.`;

                default:
                    return "";
            }
        },
        []
    );

    const handleFetchPriceQuote = useCallback(
        async (orderType: string, name: string, quantity: number) => {
            const wildcardAccessToken = Cookies.get(
                COOKIES_ACCESS_TOKEN_WILDCARD
            );
            const priceQuoteUrl = getPriceQuoteUrl();
            const fetchPriceQuoteResult = await axios.post(
                priceQuoteUrl,
                {
                    CoinName: name,
                    Quantity: quantity,
                    OrderType: orderType,
                },
                {
                    headers: {
                        Authorization: `Bearer ${wildcardAccessToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            return fetchPriceQuoteResult;
        },
        []
    );

    const chatAppMarketState = useMemo(
        () => ({
            priceQuoteGuid,
            setPriceQuoteGuid,
            handleFetchPriceQuote,
            renderConfirmationOrderEntryText,
        }),
        [
            priceQuoteGuid,
            handleFetchPriceQuote,
            renderConfirmationOrderEntryText,
        ]
    );

    return (
        <ChatAppMarketContext.Provider value={chatAppMarketState}>
            {children}
        </ChatAppMarketContext.Provider>
    );
};

export default ChatAppMarketProvider;
export { useChatAppMarketContext };
