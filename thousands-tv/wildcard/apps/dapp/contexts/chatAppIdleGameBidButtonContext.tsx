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
import { useChatAppIdleGameContext } from "./chatAppIdleGameContext";
import { COOKIES_ACCESS_TOKEN_WILDCARD } from "@/utils/accountAPIUtil";
import Cookies from "js-cookie";
import { useStreamContext } from "./streamContext";
import { useChatAppMarketContext } from "./chatAppMarketComponentContext";
import axios from "axios";
import { useStreamScoreContext } from "./streamScoreComponentContext";
import { useWildfileUserContext } from "./globalContextAccounts";
import { IdleEvent } from "@/types";
import { useConfirmationContext } from "./confirmationContext";
import { MarketOrder } from "@/features/Stream";
import { ActiveBoost } from "@/features/Event/types";
import { getIvsChatActionUrl } from "@/utils/environmentUtilWCA";

interface ChatAppIdleGameBidButtonProviderInterface {
    children: ReactNode | ReactNode[];
}

interface ChatAppIdleGameBidButtonInterface {
    button1Cost: number;
    setButton1Cost: Dispatch<SetStateAction<number>>;
    button2Cost: number;
    setButton2Cost: Dispatch<SetStateAction<number>>;
    button3Cost: number;
    setButton3Cost: Dispatch<SetStateAction<number>>;
    button1Supply: number;
    setButton1Supply: Dispatch<SetStateAction<number>>;
    button2Supply: number;
    setButton2Supply: Dispatch<SetStateAction<number>>;
    button3Supply: number;
    setButton3Supply: Dispatch<SetStateAction<number>>;
    buttonNameBeingPurchased: string;
    setButtonNameBeingPurchased: Dispatch<SetStateAction<string>>;

    handleConfirmChatAction: () => Promise<void>;
    fetchChatActionPriceQuote: (name: string) => Promise<void>;
    activeBoosts: ActiveBoost[];
}

const ChatAppIdleGameBidButtonContext =
    createContext<ChatAppIdleGameBidButtonInterface>(
        {} as ChatAppIdleGameBidButtonInterface
    );

const useChatAppIdleGameBidButtonContext = () => {
    const context = useContext(ChatAppIdleGameBidButtonContext);

    if (!context) {
        throw new Error(
            "useChatAppIdleGameBidButtonContext must be used within an [streamId].tsx"
        );
    }
    return context;
};

const ChatAppIdleGameBidButtonProvider = ({
    children,
}: ChatAppIdleGameBidButtonProviderInterface) => {
    const {
        personalEvents,
        setPersonalEvents,
        setRolledUpPersonalCredit,
        getTimeSinceStartOfEvent,
        registerJoinActions,
        recalculatePointsPerSecond,
        dateTimeOffsetRef,
    } = useChatAppIdleGameContext();
    const { eventId, streamId, vendorEventId } = useStreamContext();
    const {
        setOpenPopup,
        setIsLoadingFetchPriceQuote,
        setErrorMessage,
        setPopupMessage,
        setIsOrderCompleted,
        setIsLoadingConfirmation,
    } = useConfirmationContext();
    const {
        handleFetchPriceQuote,
        setPriceQuoteGuid,
        renderConfirmationOrderEntryText,
    } = useChatAppMarketContext();
    const { setStreamScore } = useStreamScoreContext();
    const { setCreditBalance } = useWildfileUserContext();

    const { priceQuoteGuid } = useChatAppMarketContext();
    const [button1Cost, setButton1Cost] = useState<number>(0);
    const [button2Cost, setButton2Cost] = useState<number>(0);
    const [button3Cost, setButton3Cost] = useState<number>(0);

    const [button1Supply, setButton1Supply] = useState<number>(0);
    const [button2Supply, setButton2Supply] = useState<number>(0);
    const [button3Supply, setButton3Supply] = useState<number>(0);

    const [buttonNameBeingPurchased, setButtonNameBeingPurchased] =
        useState<string>("");

    const fetchChatActionPriceQuote = useCallback(async (name: string) => {
        try {
            setOpenPopup(true);
            setIsLoadingFetchPriceQuote(true);
            const fetchPriceQuoteResult = await handleFetchPriceQuote(
                MarketOrder.BUY,
                name,
                1
            );
            if (fetchPriceQuoteResult.status !== 200) {
                setErrorMessage(`Unable to fetch price quote for ${name}`);
                setPopupMessage("");
                setIsLoadingFetchPriceQuote(true);
                return;
            }

            const fetchedPriceQuote = fetchPriceQuoteResult.data;
            const _priceQuoteGuid = fetchedPriceQuote.PriceQuoteGuid;
            const updatedTax = fetchedPriceQuote.Tax;
            const updatedPrice = fetchedPriceQuote.CoinPrice.Price;
            const updatedButtonName = fetchedPriceQuote.CoinPrice.CoinName;

            setButtonNameBeingPurchased(updatedButtonName);
            setPriceQuoteGuid(_priceQuoteGuid);

            setErrorMessage("");
            setPopupMessage(
                `${renderConfirmationOrderEntryText(
                    MarketOrder.BUY,
                    updatedButtonName,
                    1,
                    updatedPrice,
                    updatedTax
                )}`
            );
            setIsLoadingFetchPriceQuote(false);
        } catch (e: any) {
            console.error("Error - Failed to fetched price quote", e);
            setErrorMessage(
                `Error - Failed to fetched price quote ${e.message}`
            );
            setIsOrderCompleted(true);
            setIsLoadingFetchPriceQuote(false);
        }
    }, []);

    const handleConfirmChatAction = useCallback(async () => {
        try {
            setIsLoadingConfirmation(true);

            const wildcardAccessToken = Cookies.get(
                COOKIES_ACCESS_TOKEN_WILDCARD
            );

            const chatActionUrl = getIvsChatActionUrl();
            const data = await axios.post(
                chatActionUrl,
                {
                    PriceQuoteGuid: priceQuoteGuid,
                    Command: buttonNameBeingPurchased,
                    EventId: eventId,
                    StreamId: streamId,
                    VendorEventId: vendorEventId,
                    ChatActionGuid: "",
                },
                {
                    headers: {
                        Authorization: `Bearer ${wildcardAccessToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (data.status !== 200) {
                console.error("Failed to trigger chat action boost");
            }

            const chatActionResponse = data.data;
            const {
                IdleEvents,
                IdleEvent,
                Success,
                Err,
                RolledUpPersonalCredits,
                PlaceOrderResult,
                StreamScore,
            } = chatActionResponse;

            if (!Success || !IdleEvent) {
                console.log("Failed to find an chat action event: ", Err);
                return;
            }

            if (StreamScore && StreamScore > 0) {
                setStreamScore(StreamScore);
            }

            const idleEvent: IdleEvent = IdleEvent;
            if (idleEvent.isPersonalEvent) {
                const idleEventsArr = !IdleEvents ? personalEvents : IdleEvents;
                //@todo rearrange the updated idle events
                const updatedPersonalEvents = [IdleEvent, ...idleEventsArr];
                setPersonalEvents(updatedPersonalEvents);

                if (RolledUpPersonalCredits !== 0) {
                    setRolledUpPersonalCredit(RolledUpPersonalCredits);
                }

                recalculatePointsPerSecond(updatedPersonalEvents);
                setCreditBalance(PlaceOrderResult.UpdatedCredits);
                if (IdleEvent.name === "button_1.1x".toUpperCase()) {
                    if (PlaceOrderResult.UpdatedSupply > button1Supply) {
                        setButton1Supply(PlaceOrderResult.UpdatedSupply);
                    }
                } else if (IdleEvent.name === "button_1.5x".toUpperCase()) {
                    if (PlaceOrderResult.UpdatedSupply > button2Supply) {
                        setButton2Supply(PlaceOrderResult.UpdatedSupply);
                    }
                } else if (IdleEvent.name === "button_2x".toUpperCase()) {
                    if (PlaceOrderResult.UpdatedSupply > button3Supply) {
                        setButton3Supply(PlaceOrderResult.UpdatedSupply);
                    }
                }
            }

            setPopupMessage("");
            setOpenPopup(false);
            setIsLoadingConfirmation(false);
        } catch (e: any) {
            console.error("Error - Failed to activate boost chat action", e);
            setErrorMessage(
                `Error - failed to activate boost chat action ${e.message}`
            );
            setPopupMessage("");
            setIsOrderCompleted(true);
            setIsLoadingConfirmation(false);
        }
    }, [
        priceQuoteGuid,
        buttonNameBeingPurchased,
        eventId,
        vendorEventId,
        streamId,
    ]);

    const activeBoosts = useMemo(() => {
        const adjustedTimestamp = Date.now() + dateTimeOffsetRef.current;
        const filteredPersonalEvents = personalEvents.filter(
            (pe: IdleEvent) => {
                const durationMs = pe.duration * 1000;
                const expirationTimestamp = pe.timestamp + durationMs;
                return (
                    pe.name.includes("BUTTON_") &&
                    adjustedTimestamp < expirationTimestamp
                );
            }
        );

        return (
            filteredPersonalEvents
                .map((pe: IdleEvent) => {
                    return {
                        chatActionGuid: pe.chatActionGuid,
                        boostValue: pe.perTick + 1,
                        duration: pe.duration * 1000,
                        expiration: pe.timestamp + pe.duration * 1000, // timestamp expires
                    };
                })
                .sort((pe: ActiveBoost, otherPe: ActiveBoost) => {
                    return pe.expiration - otherPe.expiration;
                }) ?? []
        );
    }, [personalEvents]);

    const onJoin = (data: any) => {
        const { Button1Supply, Button2Supply, Button3Supply } = data;
        setButton1Supply(Button1Supply);
        setButton2Supply(Button2Supply);
        setButton3Supply(Button3Supply);
    };

    useEffect(() => {
        registerJoinActions(onJoin);
    }, []);

    // and update available active chat action boost
    useEffect(() => {
        const buttonCostCronJob = setInterval(() => {
            // Update Boost Chat Action Cost
            const roundedTime = Math.ceil(getTimeSinceStartOfEvent() / 5000);
            setButton1Cost(
                Math.ceil(
                    1 / Math.pow(0.01 * (roundedTime - button1Supply), 2) + 80
                )
            );
            setButton2Cost(
                Math.ceil(
                    1 / Math.pow(0.01 * (roundedTime - button2Supply), 2) + 400
                )
            );
            setButton3Cost(
                Math.ceil(
                    1 / Math.pow(0.01 * (roundedTime - button3Supply), 2) + 800
                )
            );
        }, 1000);

        return () => clearInterval(buttonCostCronJob);
    }, []);

    // Listen for the dispatched event and update state accordingly
    useEffect(() => {
        const handleSupplyUpdate = (
            event: CustomEvent<{
                buttonName: string;
                newSupply: number;
                newStreamScore: number;
            }>
        ) => {
            const { buttonName, newSupply, newStreamScore } = event.detail;

            setStreamScore(newStreamScore);

            if (buttonName.toUpperCase() === "BUTTON_1.1X") {
                setButton1Supply((prev) =>
                    newSupply > prev ? newSupply : prev
                );
            }
            if (buttonName.toUpperCase() === "BUTTON_1.5X") {
                setButton2Supply((prev) =>
                    newSupply > prev ? newSupply : prev
                );
            }
            if (buttonName.toUpperCase() === "BUTTON_2X") {
                setButton3Supply((prev) =>
                    newSupply > prev ? newSupply : prev
                );
            }
        };

        document.body.addEventListener(
            "supplyUpdate",
            handleSupplyUpdate as EventListener
        );

        return () => {
            document.body.removeEventListener(
                "supplyUpdate",
                handleSupplyUpdate as EventListener
            );
        };
    }, []);

    const chatAppIdleGameBidButtonState = useMemo(
        () => ({
            button1Cost,
            setButton1Cost,
            button2Cost,
            setButton2Cost,
            button3Cost,
            setButton3Cost,
            button1Supply,
            setButton1Supply,
            button2Supply,
            setButton2Supply,
            button3Supply,
            setButton3Supply,
            buttonNameBeingPurchased,
            setButtonNameBeingPurchased,

            handleConfirmChatAction,
            fetchChatActionPriceQuote,
            activeBoosts,
        }),
        [
            button1Cost,
            button2Cost,
            button3Cost,
            button1Supply,
            button2Supply,
            button3Supply,
            buttonNameBeingPurchased,

            handleConfirmChatAction,
            fetchChatActionPriceQuote,
            activeBoosts,
        ]
    );

    return (
        <ChatAppIdleGameBidButtonContext.Provider
            value={chatAppIdleGameBidButtonState}
        >
            {children}
        </ChatAppIdleGameBidButtonContext.Provider>
    );
};

export default ChatAppIdleGameBidButtonProvider;
export { useChatAppIdleGameBidButtonContext };
