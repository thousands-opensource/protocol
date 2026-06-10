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
import { useConfirmationContext } from "./confirmationContext";
import { COOKIES_ACCESS_TOKEN_WILDCARD } from "@/utils/accountAPIUtil";
import { getPlaceOrderUrl } from "@/utils/environmentUtilWCA";
import { useChatAppMarketContext } from "./chatAppMarketComponentContext";
import Cookies from "js-cookie";
import axios from "axios";
import { useStreamContext } from "./streamContext";
import { useWildfileUserContext } from "./globalContextAccounts";
import { MarketOrder } from "@/features/Stream";
import { useChatAppTopCoinsContext } from "./chatAppTopCoinsContext";
import { useChatAppMyCoinsContext } from "./chatAppMyCoinsContext";

interface ChatAppStreamCoinsBuySellProviderProps {
    children: ReactNode | ReactNode[];
}

interface ChatAppStreamCoinsBuySellContextInterface {
    orderEntryQuantity: number;
    setOrderEntryQuantity: Dispatch<SetStateAction<number>>;
    orderEntry: string;
    setOrderEntry: Dispatch<SetStateAction<string>>;
    stremeCoin: string;
    setStremeCoin: Dispatch<SetStateAction<string>>;
    marketOrderEntry: MarketOrder;
    setMarketOrderEntry: Dispatch<SetStateAction<MarketOrder>>;

    fetchStremeCoinPriceQuote: (
        text: string,
        errorMsg?: string
    ) => Promise<void>;
    handleConfirmStremeCoin: () => Promise<void>;
}

const ChatAppStreamCoinsBuySellContext =
    createContext<ChatAppStreamCoinsBuySellContextInterface>(
        {} as ChatAppStreamCoinsBuySellContextInterface
    );

const useChatAppStreamCoinsBuySellContext = () => {
    const context = useContext(ChatAppStreamCoinsBuySellContext);

    if (!context) {
        throw new Error(
            "useStreamCoinsBuySellContext must be used within an [streamId].tsx"
        );
    }
    return context;
};

const ChatAppStreamCoinsBuySellProvider = ({
    children,
}: ChatAppStreamCoinsBuySellProviderProps) => {
    const {
        priceQuoteGuid,
        setPriceQuoteGuid,
        handleFetchPriceQuote,
        renderConfirmationOrderEntryText,
    } = useChatAppMarketContext();
    const { eventId } = useStreamContext();
    const { setMyCoinPositions } = useChatAppMyCoinsContext();
    const { fetchTopPositions } = useChatAppTopCoinsContext();
    const {
        setOpenPopup,
        setIsLoadingFetchPriceQuote,
        setErrorMessage,
        setPopupMessage,
        setIsLoadingConfirmation,
        setIsOrderCompleted,
    } = useConfirmationContext();
    const { setCreditBalance } = useWildfileUserContext();

    const [orderEntryQuantity, setOrderEntryQuantity] = useState<number>(10);
    const [orderEntry, setOrderEntry] = useState<string>("");
    const [stremeCoin, setStremeCoin] = useState<string>("");
    const [marketOrderEntry, setMarketOrderEntry] = useState<MarketOrder>(
        MarketOrder.NONE
    );

    const fetchStremeCoinPriceQuote = useCallback(
        async (text: string, errorMsg?: string) => {
            try {
                setIsOrderCompleted(false);
                setOpenPopup(true);
                setIsLoadingFetchPriceQuote(true);
                const fetchedPriceQuoteResult = await handleFetchPriceQuote(
                    marketOrderEntry,
                    text,
                    orderEntryQuantity
                );
                if (fetchedPriceQuoteResult.status !== 200) {
                    setErrorMessage(
                        `Unable to fetch price quote for ${orderEntry} ${orderEntryQuantity}. Please resubmit order entry`
                    );
                    setPopupMessage("");
                    setIsLoadingFetchPriceQuote(true);
                    return;
                }

                const fetchedPriceQuote = fetchedPriceQuoteResult.data;
                const priceQuoteGuid = fetchedPriceQuote.PriceQuoteGuid;
                const updatedTax = fetchedPriceQuote.Tax;
                const updatedPrice = fetchedPriceQuote.CoinPrice.Price;
                const updatedCoinName = fetchedPriceQuote.CoinPrice.CoinName;
                const updatedQuantity = fetchedPriceQuote.Quantity;

                setPriceQuoteGuid(priceQuoteGuid);

                setErrorMessage(errorMsg ?? "");
                setPopupMessage(
                    `${renderConfirmationOrderEntryText(
                        marketOrderEntry,
                        updatedCoinName,
                        updatedQuantity,
                        updatedPrice,
                        updatedTax
                    )}`
                );
                setOrderEntry(updatedCoinName);
                setIsLoadingFetchPriceQuote(false);
            } catch (e: any) {
                console.error("Error - Failed to fetched price quote", e);
                setErrorMessage(
                    `Error - Failed to fetched price quote ${e.message}`
                );
                setIsOrderCompleted(true);
                setIsLoadingFetchPriceQuote(false);
            }
        },
        [marketOrderEntry, orderEntryQuantity]
    );

    const handlePlaceOrder = async (
        orderType: string,
        coinName: string,
        quantity: number
    ) => {
        const wildcardAccessToken = Cookies.get(COOKIES_ACCESS_TOKEN_WILDCARD);
        const placeOrderUrl = getPlaceOrderUrl();
        const placeOrderResult = await axios.post(
            placeOrderUrl,
            {
                EventId: eventId,
                PriceQuoteGuid: priceQuoteGuid,
                CoinName: coinName,
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

        return placeOrderResult;
    };

    const handleConfirmStremeCoin = useCallback(async () => {
        try {
            setIsLoadingConfirmation(true);
            const placeOrderResult = await handlePlaceOrder(
                marketOrderEntry,
                orderEntry,
                orderEntryQuantity
            );

            if (placeOrderResult.status !== 200) {
                setErrorMessage(
                    `Unable to place order for ${orderEntry} ${orderEntryQuantity}. Please place the order again`
                );
                setPopupMessage("");
                setIsLoadingConfirmation(false);
                return;
            }

            const placeOrder = placeOrderResult.data;
            // if (placeOrder.ErrorMessage !== "") {
            //     setErrorMessage(
            //         `Error from backend: ${placeOrder.ErrorMessage}`
            //     );
            //     setPopupMessage("");
            //     setIsLoadingConfirmation(false);
            //     return;
            // }

            if (!placeOrder.WasOrderPlaced) {
                const newPriceQuote = placeOrder.PriceQuote;

                const priceQuoteGuid = newPriceQuote.PriceQuoteGuid;
                const updatedTax = newPriceQuote.Tax;
                const updatedPrice = newPriceQuote.CoinPrice.Price;
                const updatedCoinName = newPriceQuote.CoinPrice.CoinName;
                const updatedQuantity = newPriceQuote.Quantity;

                setPriceQuoteGuid(priceQuoteGuid);

                setErrorMessage(placeOrder.ErrorMessage ?? "");
                setPopupMessage(
                    `${renderConfirmationOrderEntryText(
                        marketOrderEntry,
                        updatedCoinName,
                        updatedQuantity,
                        updatedPrice,
                        updatedTax
                    )}`
                );
                setOrderEntry(updatedCoinName);
                setIsLoadingFetchPriceQuote(false);
                setIsLoadingConfirmation(false);
                return;
            }

            const updateUserCoins = placeOrder.UpdatedUserCoins;
            const coinHoldings = updateUserCoins.CoinHoldings;
            setCreditBalance(placeOrder.UpdatedCredits);

            const updatedMyPositions = coinHoldings.map((coinHolding: any) => {
                return {
                    CoinName: coinHolding.CoinName,
                    Quantity: coinHolding.Quantity,
                };
            });
            setErrorMessage("");
            setPopupMessage(
                `Your ${marketOrderEntry.toUpperCase()} order for ${orderEntryQuantity} ${orderEntry} has been completed successfully.`
            );
            setIsLoadingConfirmation(false);
            setIsOrderCompleted(true);

            setMyCoinPositions(updatedMyPositions);

            await fetchTopPositions();
        } catch (e: any) {
            console.error("Error - Failed to place an order", e);
            setErrorMessage(`Error - failed to place an order ${e.message}`);
            setIsOrderCompleted(true);
            setIsLoadingConfirmation(false);
            return;
        }
    }, [marketOrderEntry, orderEntry, orderEntryQuantity]);

    const streamCoinsBuySellState = useMemo(
        () => ({
            orderEntryQuantity,
            setOrderEntryQuantity,
            orderEntry,
            setOrderEntry,
            stremeCoin,
            setStremeCoin,
            marketOrderEntry,
            setMarketOrderEntry,

            fetchStremeCoinPriceQuote,
            handleConfirmStremeCoin,
        }),
        [
            orderEntryQuantity,
            orderEntry,
            stremeCoin,
            marketOrderEntry,

            fetchStremeCoinPriceQuote,
            handleConfirmStremeCoin,
        ]
    );

    return (
        <ChatAppStreamCoinsBuySellContext.Provider
            value={streamCoinsBuySellState}
        >
            {children}
        </ChatAppStreamCoinsBuySellContext.Provider>
    );
};

export default ChatAppStreamCoinsBuySellProvider;
export { useChatAppStreamCoinsBuySellContext };
