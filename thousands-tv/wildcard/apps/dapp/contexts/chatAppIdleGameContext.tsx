import {
    createContext,
    Dispatch,
    MutableRefObject,
    ReactNode,
    SetStateAction,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    ConsumableCommandAction,
    IdleEvent,
    Leader,
    LeaderCondensed,
} from "@/types";
import { getUserDisplayName } from "@/utils/streamUtils";
import { getUnixTimestampOffset } from "@/utils/util";
import { useToast } from "@chakra-ui/react";
import { ChatApp, ISkybox, WildcardApiResponse } from "@repo/interfaces";
import axios from "axios";
import { useWildfileUserContext } from "./globalContextAccounts";
import { useStreamContext } from "./streamContext";
import { useStreamScoreContext } from "./streamScoreComponentContext";
import { useBoostStore } from "@/store/useBoostStore";
import { getActivePfpUrl } from "@repo/utils";
import { useChatAppLeaderboardStore } from "@/store/useChatAppLeaderboardStore";
import { generatePartialSkybox, useSkyboxStore } from "@/store/useSkyboxStore";
import { MAX_SKYBOX_SLOT } from "@/constants/constants";
import usePubnubStore from "@/store/usePubnubStore";

interface ChatAppIdleGameProviderProps {
    children?: ReactNode;
}

interface ChatAppIdleGameContextInterface {
    dateTimeOffsetRef: MutableRefObject<number>;
    personalEvents: IdleEvent[];
    setPersonalEvents: Dispatch<SetStateAction<IdleEvent[]>>;
    fandomEvents: IdleEvent[];
    setFandomEvents: Dispatch<SetStateAction<IdleEvent[]>>;
    rolledUpPersonalCredit: number;
    setRolledUpPersonalCredit: Dispatch<SetStateAction<number>>;
    rolledUpFandomCredit: number;
    setRolledUpFandomCredit: Dispatch<SetStateAction<number>>;
    personalCredit: number;
    setPersonalCredit: Dispatch<SetStateAction<number>>;
    pointsPerSecond: number;
    setPointsPerSecond: Dispatch<SetStateAction<number>>;

    getTimeSinceStartOfEvent: () => number;
    recalculatePointsPerSecond: (personalEventsArray: IdleEvent[]) => void;
    registerJoinActions: (onJoin: any) => void;
}

const ChatAppIdleGameContext = createContext<ChatAppIdleGameContextInterface>(
    {} as ChatAppIdleGameContextInterface
);

const useChatAppIdleGameContext = () => {
    const context = useContext(ChatAppIdleGameContext);

    if (!context) {
        throw new Error(
            "useChatAppIdleGameContext must be used within an [streamId].tsx"
        );
    }
    return context;
};

const ChatAppIdleGameProvider = ({
    children,
}: ChatAppIdleGameProviderProps) => {
    const { chatApp } = useStreamContext();
    const { setStreamScore, streamScore } = useStreamScoreContext();
    const [personalEvents, setPersonalEvents] = useState<IdleEvent[]>([]);
    const [personalCredit, setPersonalCredit] = useState<number>(0);
    const [fandomEvents, setFandomEvents] = useState<IdleEvent[]>([]);
    const [rolledUpPersonalCredit, setRolledUpPersonalCredit] =
        useState<number>(0);
    const [rolledUpFandomCredit, setRolledUpFandomCredit] = useState<number>(0);
    const [pointsPerSecond, setPointsPerSecond] = useState<number>(0);
    const START_TIME = 1734632392440;

    const {
        setDateTimeOffset,
        setRedBlueRatio,
        setRedComboMultiplier,
        setBlueComboMultiplier,
        setRedBoostProgress,
        setRedPersonalProgressStartTime,
        setBlueBoostProgress,
        setBluePersonalProgressStartTime,
        setRoundNumber,
        setEventMatchStartTime,
        setIsMatchingRunning,
        setTotalRedBoost,
        setTotalBlueBoost,
        updateButtonState,
        setRedCreditsSpent,
        setBlueCreditsSpent,
        setRedAvgPurchasePrice,
        setBlueAvgPurchasePrice,
        setRedAvgPoints,
        setBlueAvgPoints,
        setTotalUniqueUser,
    } = useBoostStore();

    const { setToken } = usePubnubStore();

    const { setChatLeaderboard, setCurrentUserRank } =
        useChatAppLeaderboardStore();

    const { setSkyboxes } = useSkyboxStore();

    let joinActions: any[] = [];

    const registerJoinActions = (onJoin: any) => {
        for (const action of joinActions) {
            if (action === onJoin) {
                return;
            }
        }
        joinActions.push(onJoin);
    };

    const runOnceRef = useRef<boolean>(false);
    const { streamId, eventId, vendorEventId, ticketTier } = useStreamContext();
    const { userDB } = useWildfileUserContext();
    const dateTimeOffsetRef = useRef<number>(-1);
    const toast = useToast();

    /**
     * Set and update dat time offset between frontend and backend
     * @param backendTimestamp - backend unix timestamp
     */
    const setIdleGameTimeStampOffset = (backendTimestamp: number) => {
        // JS Date time
        const offset = getUnixTimestampOffset(Date.now(), backendTimestamp);

        setDateTimeOffset(offset);
        dateTimeOffsetRef.current = offset;
    };

    const getTimeSinceStartOfEvent = () => {
        return dateTimeOffsetRef.current + Date.now() - START_TIME;
    };

    /**
     * Join idle event game server and store idle event and set initial front/back-end timestamp offset
     */
    const joinIdleEvent = async (
        streamId: string,
        eventId: string,
        vendorEventId: string,
        userId: string,
        userName: string,
        pfpUrl: string,
        walletAddress: string,
        ticketTier: string,
        additionalWalletAddresses: string[] | null
    ) => {
        const { data }: { data: WildcardApiResponse } = await axios.post(
            "/api/sendCommand",
            {
                streamId,
                eventId,
                vendorEventId,
                userId,
                userName,
                command: "join",
                pfpUrl,
                walletAddress,
                ticketTier,
                additionalWalletAddresses,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        if (!data.success) {
            console.log(data.err);
            toast({
                description: data.err,
                status: "error",
                duration: 5000,
                position: "top",
            });
            return;
        }

        const {
            Success,
            IdleEvents,
            IdleEvent,
            Timestamp,
            RolledUpPersonalCredits,
            Err,
            StreamScore,
            RedBlueRatio,
            RedSharedBoostComboMultiplier,
            BlueSharedBoostComboMultiplier,
            RedBoostProgress,
            RedPersonalProgressStartTime,
            BlueBoostProgress,
            BluePersonalProgressStartTime,
            RoundNumber,
            EventMatchStartTime,
            IsEventMatchActive,
            TotalRedBoost,
            TotalBlueBoost,
            PredictionPersonalCreditsSpentRed,
            PredictionPersonalCreditsSpentBlue,
            PredictionAveragePriceRed,
            PredictionAveragePriceBlue,
            PredictionAveragePointsRed,
            PredictionAveragePointsBlue,
            PredictionTotalUniqueUserCount,
            Leaders,
            Skyboxes,
            PubNubToken,
        } = data.data;

        if (!Success || !IdleEvent) {
            console.log("Unable to join idle event: ", Err);
            return;
        }

        if (IsEventMatchActive) {
            setIsMatchingRunning(true);

            if (EventMatchStartTime && EventMatchStartTime > 0) {
                setEventMatchStartTime(EventMatchStartTime);
            }

            if (TotalRedBoost && TotalRedBoost > 0) {
                setTotalRedBoost(TotalRedBoost);
            }

            if (TotalBlueBoost && TotalBlueBoost > 0) {
                setTotalBlueBoost(TotalBlueBoost);
            }

            if (RoundNumber && RoundNumber > 0) {
                setRoundNumber(RoundNumber);
            }

            //set boost/rallies chat app initial state
            if (RedBlueRatio && RedBlueRatio > 0) {
                setRedBlueRatio(RedBlueRatio);
            }
            if (
                RedSharedBoostComboMultiplier &&
                RedSharedBoostComboMultiplier > 0
            ) {
                setRedComboMultiplier(RedSharedBoostComboMultiplier);
            }
            if (
                BlueSharedBoostComboMultiplier &&
                BlueSharedBoostComboMultiplier > 0
            ) {
                setBlueComboMultiplier(BlueSharedBoostComboMultiplier);
            }
            if (RedBoostProgress && RedBoostProgress > 0) {
                setRedBoostProgress(RedBoostProgress);

                updateButtonState("red", RedBoostProgress, 0, 0);
            }
            /*if (
                RedPersonalProgressStartTime &&
                RedPersonalProgressStartTime > 0
            ) {
                setRedPersonalProgressStartTime(RedPersonalProgressStartTime);
            }*/
            if (BlueBoostProgress && BlueBoostProgress > 0) {
                setBlueBoostProgress(BlueBoostProgress);

                updateButtonState("blue", BlueBoostProgress, 0, 0);
            }
            /*if (
                BluePersonalProgressStartTime &&
                BluePersonalProgressStartTime > 0
            ) {
                setBluePersonalProgressStartTime(BluePersonalProgressStartTime);
            }*/
            if (
                PredictionPersonalCreditsSpentRed &&
                PredictionPersonalCreditsSpentRed > 0
            ) {
                setRedCreditsSpent(PredictionPersonalCreditsSpentRed);
            }
            if (
                PredictionPersonalCreditsSpentBlue &&
                PredictionPersonalCreditsSpentBlue > 0
            ) {
                setBlueCreditsSpent(PredictionPersonalCreditsSpentBlue);
            }
            if (PredictionAveragePriceRed && PredictionAveragePriceRed > 0) {
                setRedAvgPurchasePrice(PredictionAveragePriceRed);
            }
            if (PredictionAveragePriceBlue && PredictionAveragePriceBlue > 0) {
                setBlueAvgPurchasePrice(PredictionAveragePriceBlue);
            }
            if (PredictionAveragePointsRed && PredictionAveragePointsRed > 0) {
                setRedAvgPoints(PredictionAveragePointsRed);
            }
            if (
                PredictionAveragePointsBlue &&
                PredictionAveragePointsBlue > 0
            ) {
                setBlueAvgPoints(PredictionAveragePointsBlue);
            }
            if (
                PredictionTotalUniqueUserCount &&
                PredictionTotalUniqueUserCount > 0
            ) {
                setTotalUniqueUser(PredictionTotalUniqueUserCount);
            }
        } else {
            setIsMatchingRunning(false);
        }

        if (StreamScore && StreamScore > 0) {
            setStreamScore(StreamScore);
        }

        // set initial values for leaderboard when user join
        if (Leaders && Leaders.length > 0) {
            const leaders = Leaders as LeaderCondensed[];

            var mappedLeaders: Leader[] = leaders.map((old) => ({
                Rank: old.r,
                PreviousRank: old.r,
                UserId: old.u,
                Score: old.s,
                Username: "",
                PfpImageUrl: "",
            }));

            setChatLeaderboard(mappedLeaders);
            const myRanking = mappedLeaders.find(
                (ranking: Leader) => ranking.UserId === userId
            );
            if (myRanking) {
                setCurrentUserRank(myRanking.Rank);
            }
        } else {
            setChatLeaderboard([]);
        }

        if (Skyboxes) {
            const emptySkyboxes = Array.from(
                {
                    length: MAX_SKYBOX_SLOT - Skyboxes.length,
                },
                generatePartialSkybox
            ) as ISkybox[];

            setSkyboxes([...Skyboxes, ...emptySkyboxes]);
        }

        if (PubNubToken) {
            console.log(`Setting PubNubToken to: ${PubNubToken}`);
            setToken(PubNubToken);
        }

        const idleEventsArr = !IdleEvents ? [IdleEvent] : IdleEvents;
        setPersonalEvents(idleEventsArr);

        // initial offset when the component mounts
        setIdleGameTimeStampOffset(Timestamp);

        if (RolledUpPersonalCredits != 0) {
            setRolledUpPersonalCredit(RolledUpPersonalCredits);
        }

        joinActions.forEach((action) => {
            action(data.data);
        });

        recalculatePointsPerSecond(idleEventsArr);
    };

    const recalculatePointsPerSecond = useCallback(
        (personalEventsArray: IdleEvent[]) => {
            const adjustedTimestamp = Date.now() + dateTimeOffsetRef.current;
            const filteredPersonalEvents = personalEventsArray.filter(
                (pe: IdleEvent) => {
                    const durationMs = pe.duration * 1000;
                    const expirationTimestamp = pe.timestamp + durationMs;
                    // @todo revisit to fix complex boolean logic for different configs
                    return (
                        (pe.name.includes("BUTTON_") &&
                            adjustedTimestamp < expirationTimestamp) ||
                        pe.name === "join"
                    );
                }
            );

            const updatedPointsPerSecond = filteredPersonalEvents.reduce(
                (currentCount: number, personalEvent: IdleEvent) => {
                    return personalEvent.perTick + currentCount;
                },
                0
            );

            setPointsPerSecond(updatedPointsPerSecond);
        },
        []
    );

    const processEvent = (
        idleEvents: IdleEvent[],
        setIdleEvents: Dispatch<SetStateAction<IdleEvent[]>>,
        rolledUpCredit: number,
        setRolledUpCredit: Dispatch<SetStateAction<number>>,
        setCredit: Dispatch<SetStateAction<number>>,
        isPersonal?: boolean
    ) => {
        let _credit: number = rolledUpCredit;
        if (idleEvents.length < 1) return;

        let creditAddedByEventsBeingRemoved = 0;
        let eventsBeingRemoved: IdleEvent[] = [];
        const frontendTimestamp = Date.now() + dateTimeOffsetRef.current;
        for (let index = 0; index < idleEvents.length; index++) {
            let creditAddedByThisEvent = 0;
            const idleEvent: IdleEvent = idleEvents[index];
            const eventTimeStamp = idleEvent.timestamp;

            if (isPersonal) {
                _credit -= idleEvent.cost;
            }

            creditAddedByThisEvent = calculateEventCredit(
                idleEvent,
                frontendTimestamp,
                eventTimeStamp
            );

            _credit += creditAddedByThisEvent;

            if (
                idleEvent.duration !== -1 &&
                Math.floor((frontendTimestamp - eventTimeStamp) / 1000) >
                idleEvent.duration
            ) {
                creditAddedByEventsBeingRemoved += creditAddedByThisEvent;

                if (isPersonal) {
                    creditAddedByEventsBeingRemoved -= idleEvent.cost;
                }
                eventsBeingRemoved.push(idleEvent);
            }
        }

        //Update the state with creditAddedByEventsBeingRemoved if greater than zero
        //Remove the events from personalEvents or fandomEvents if there are any to remove and update the cost
        if (eventsBeingRemoved.length > 0) {
            setRolledUpCredit(rolledUpCredit + creditAddedByEventsBeingRemoved);
            const filterIdleEvents = idleEvents.filter((event) => {
                const eventExistsInIdleEvents = eventsBeingRemoved.some(
                    (otherEvent) =>
                        otherEvent.name === event.name &&
                        otherEvent.timestamp === event.timestamp
                );

                return !eventExistsInIdleEvents;
            });

            setIdleEvents([...filterIdleEvents]);
            recalculatePointsPerSecond(filterIdleEvents);
        }

        setCredit(_credit);
    };

    const calculateEventCredit = (
        idleEvent: IdleEvent,
        frontendTimestamp: number,
        eventTimeStamp: number
    ) => {
        const eventName = idleEvent.name;
        switch (eventName) {
            case ConsumableCommandAction.FIREWORKS:
                return 0;
            case ConsumableCommandAction.CHEER:
                return 0;
            case ConsumableCommandAction.CONFETTI:
                return (
                    idleEvent.perTick *
                    Math.min(
                        Math.floor((frontendTimestamp - eventTimeStamp) / 1000),
                        idleEvent.duration
                    )
                );
            case ConsumableCommandAction.JOINYES:
                return (
                    idleEvent.perTick *
                    Math.min(
                        Math.floor((frontendTimestamp - eventTimeStamp) / 1000),
                        idleEvent.duration
                    )
                );
            case ConsumableCommandAction.JOINNO:
                return (
                    idleEvent.perTick *
                    Math.min(
                        Math.floor((frontendTimestamp - eventTimeStamp) / 1000),
                        idleEvent.duration
                    )
                );
            default:
                return (
                    idleEvent.perTick *
                    Math.floor((frontendTimestamp - eventTimeStamp) / 1000)
                );
        }
    };

    // run personal credit job
    useEffect(() => {
        const personalCronJob = setInterval(() => {
            processEvent(
                personalEvents,
                setPersonalEvents,
                rolledUpPersonalCredit,
                setRolledUpPersonalCredit,
                setPersonalCredit,
                true
            );
        }, 1000);

        return () => clearInterval(personalCronJob);
    }, [personalEvents]);

    const updateStreamScoreMultiplier = (newStreamScore: number) => {
        const amountToNextStreamScoreLevel = 100;
        const streamScoreLevel =
            Math.floor(newStreamScore / amountToNextStreamScoreLevel) + 1;
        const streamScoreBoostMultiplier = streamScoreLevel * 0.1;

        var newPersonalEvents = personalEvents.map((item) => {
            if (item.name == "join") {
                item.perTick = 1 + streamScoreBoostMultiplier;
            }

            return item;
        });

        setPersonalEvents(newPersonalEvents);
        recalculatePointsPerSecond(newPersonalEvents);
    };

    useEffect(() => {
        updateStreamScoreMultiplier(streamScore);
    }, [streamScore]);

    useEffect(() => {
        if (!userDB) {
            return;
        }

        if (runOnceRef && runOnceRef.current) {
            return;
        }

        const userId = userDB?._id?.toString() ?? "";
        const pfpUrl = getActivePfpUrl(userDB);
        const walletAddress = userDB?.walletProvider?.address ?? "";
        const additionalWalletAddresses =
            userDB?.walletProvider?.additionalWallets ?? null;
        const displayName = getUserDisplayName(userDB);

        joinIdleEvent(
            streamId,
            eventId,
            vendorEventId,
            userId,
            displayName,
            pfpUrl,
            walletAddress,
            ticketTier,
            additionalWalletAddresses
        );
        runOnceRef.current = true;
        // set meta data after joining idle event
    }, [userDB]);

    const idleControlState = useMemo(
        () => ({
            dateTimeOffsetRef,
            personalEvents,
            setPersonalEvents,
            fandomEvents,
            setFandomEvents,
            rolledUpPersonalCredit,
            setRolledUpPersonalCredit,
            rolledUpFandomCredit,
            setRolledUpFandomCredit,

            personalCredit,
            setPersonalCredit,
            pointsPerSecond,
            setPointsPerSecond,

            registerJoinActions,

            getTimeSinceStartOfEvent,
            recalculatePointsPerSecond,
        }),
        [
            personalEvents,
            fandomEvents,
            rolledUpPersonalCredit,
            rolledUpFandomCredit,
            personalCredit,
            pointsPerSecond,

            registerJoinActions,
            getTimeSinceStartOfEvent,
            recalculatePointsPerSecond,
        ]
    );

    return (
        <ChatAppIdleGameContext.Provider value={idleControlState}>
            {children}
        </ChatAppIdleGameContext.Provider>
    );
};

export default ChatAppIdleGameProvider;
export { useChatAppIdleGameContext };
