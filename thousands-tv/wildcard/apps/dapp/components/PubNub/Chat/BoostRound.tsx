import { useStreamContext } from "@/contexts/streamContext";
import { ActiveBoost, useBoostStore } from "@/store/useBoostStore";
import { getClientSideCookieValue } from "@/utils/sessionUtil";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import BoostAnimations, { BoostAnimationsRef } from "./BoostAnimation";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { BoostTrigger } from "@/types";
import { getActivePfpUrl } from "@repo/utils";
import useCreditBalance from "@/hooks/credits/useCreditBalance";
import { useToast } from "@chakra-ui/react";
import { useBuyCreditsStore } from "@/store/useBuyCreditsStore";
import { getIvsBoostActionUrl } from "@/utils/environmentUtilWCA";
import { Image } from "@chakra-ui/react";
import CreditDeductionAnimations, {
    CreditDeductionAnimationRef,
} from "@/components/CreditDeductionAnimations";

// --- Types & Default Config ---
type Team = {
    id: string;
    name: string;
    color: "red" | "blue";
    price: number;
    currencyUnit?: string;
    comboMultiplier: number;
    boostLevel: number;
    gradientStart?: string;
    gradientEnd?: string;
};

export type EventConfig = {
    title: string;
    teams: [Team, Team];
    initialProgress?: [number, number];
};

const PRICE_MAP: Record<number, number> = {
    0: 0,
    1: 0,
    2: 100,
    3: 400,
    4: 1400,
    5: 4400,
    6: 10000,
    7: 30000,
};

const defaultEventConfig: EventConfig = {
    title: 'The Big Game"',
    teams: [
        {
            id: "team1",
            name: "Red",
            color: "red",
            price: 0,
            comboMultiplier: 2.1,
            boostLevel: 1,
        },
        {
            id: "team2",
            name: "Blue",
            color: "blue",
            price: 1.25,
            currencyUnit: "usdc",
            comboMultiplier: 2.4,
            boostLevel: 2,
        },
    ],
    initialProgress: [50, 50],
};

const defaultEventGradients = [
    {
        gradientStart: "#f90000",
        gradientEnd: "#b70000",
    },
    {
        gradientStart: "#00add5",
        gradientEnd: "#0067ff",
    },
];

interface BoostRoundProps {
    config?: EventConfig;
    onBoost?: (teamId: string, currentProgress: number) => void;
    onReset?: () => void;
}

const BoostRound: React.FC<BoostRoundProps> = ({
    config = defaultEventConfig,
    onBoost,
    onReset,
}) => {
    const { vendorEventId, eventId } = useStreamContext();
    const { userDB, creditBalance } = useWildfileUserContext();
    const lastQueueProcessTime = useRef(0);

    const QUEUE_PROCESS_THROTTLE_MS = 200;

    const [progress, setProgress] = useState<[number, number]>(
        config.initialProgress || [50, 50]
    );
    const { updateCreditBalance, deductCredits, creditBalanceObj } =
        useCreditBalance(userDB?._id?.toString() || "");
    const {
        addActiveBoost,
        mapBoostTriggerToActiveBoost,
        startProcessingActiveBoost,
        queue,
        dequeue,
        peek,
        isQueueEmpty,
        isMatchRunning,
        redBlueRatio,
        redComboMultiplier,
        blueComboMultiplier,
        redBoostLevel,
        redBoostProgress,
        setRedBoostProgress,
        setRedPersonalProgressStartTime,
        setRedPersonalProgressTotalDelayTime,
        redBoostProgressToNextLevel,
        blueBoostLevel,
        blueBoostProgress,
        setBlueBoostProgress,
        setBluePersonalProgressStartTime,
        setBluePersonalProgressTotalDelayTime,
        blueBoostProgressToNextLevel,
        roundNumber,
        updateButtonState,
        dateTimeOffset,
        redPersonalProgressStartTime,
        updateComboMultiplier,
        totalRedBoost,
        eventMatchStartTime,
        totalBlueBoost,
        bluePersonalProgressStartTime,
    } = useBoostStore();
    const { setBuyCreditsPopupOpen } = useBuyCreditsStore();
    const boostRef = useRef<BoostAnimationsRef>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const creditAnimationRef = useRef<CreditDeductionAnimationRef>(null);
    const toast = useToast();

    const updateBoostControls = (boostTrigger: BoostTrigger) => {
        /*
        if (boostTrigger.creditsLeft) {
            updateCreditBalance(boostTrigger.creditsLeft);
        }
        */
        if (boostTrigger.boostType.toLowerCase() === "red") {
            //setRedBoostLevel(boostTrigger.boostLevel);

            //Only increase the redBoostProgress if the incoming value is higher
            if (boostTrigger.boostProgress > redBoostProgress) {
                setRedBoostProgress(boostTrigger.boostProgress);
            }

            // Update the button state (UI only)
            updateButtonState(
                "red",
                redBoostProgress,
                dateTimeOffset,
                redPersonalProgressStartTime
            );

            /**
             * Update the combo multiplier (UI only)
             */
            updateComboMultiplier(
                "red",
                totalRedBoost,
                dateTimeOffset,
                eventMatchStartTime
            );
            /*
            setRedPersonalProgressStartTime(
                boostTrigger.personalProgressStartTime
            );
            setRedPersonalProgressTotalDelayTime(
                boostTrigger.personalProgressTotalDelayTime
            );
            */
        } else {
            //setBlueBoostLevel(boostTrigger.boostLevel);

            //Only increase the blueBoostProgress if the incoming value is higher
            if (boostTrigger.boostProgress > blueBoostProgress) {
                setBlueBoostProgress(boostTrigger.boostProgress);
            }

            updateButtonState(
                "blue",
                blueBoostProgress,
                dateTimeOffset,
                bluePersonalProgressStartTime
            );

            updateComboMultiplier(
                "blue",
                totalBlueBoost,
                dateTimeOffset,
                eventMatchStartTime
            );

            /*
            setBluePersonalProgressStartTime(
                boostTrigger.personalProgressStartTime
            );
            setBluePersonalProgressTotalDelayTime(
                boostTrigger.personalProgressTotalDelayTime
            );
            */
        }
    };

    useEffect(() => {
        try {
            // Throttle processing to prevent rapid updates
            const now = Date.now();
            if (
                now - lastQueueProcessTime.current <
                QUEUE_PROCESS_THROTTLE_MS
            ) {
                return; // Skip processing if it's been less than the throttle time
            }

            if (!isQueueEmpty()) {
                // Update our timestamp
                lastQueueProcessTime.current = now;

                const boostTriggered = peek();
                if (boostTriggered) {
                    if (boostTriggered.userId === userDB?._id?.toString()) {
                        updateBoostControls(boostTriggered);
                    } else {
                        // @todo use item to play avatar animation
                        // INSERT play animation func
                        const activeBoost: ActiveBoost =
                            mapBoostTriggerToActiveBoost(boostTriggered);

                        // Throttle the addition of new boosts to prevent cascades
                        requestAnimationFrame(() => {
                            addActiveBoost(activeBoost);
                        });
                    }
                }

                dequeue();
            }
        } catch (error) {
            console.error("Error in BoostRound:", error);
        }
    }, [queue]);

    const handleBoostClick = (
        index: number,
        price: number,
        boostLevel: number
    ) => {
        const authorizationHeader = getClientSideCookieValue(
            "wildcardAccessToken"
        );
        const boostActionUrl = getIvsBoostActionUrl();
        axios.post(
            boostActionUrl,
            {
                stageId: eventId,
                vendorEventId,
                boostType: index === 0 ? "red" : "blue",
                price,
                boostLevel,
                authorizationHeader,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        //Red
        if (index === 0) {
            const price = PRICE_MAP[redBoostLevel];
            if ((creditBalanceObj?.balance ?? 0) < price) {
                toast({
                    description: "You don't have enough credits!",
                    status: "error",
                    duration: 2500,
                    position: "bottom",
                });
                return;
            }
            deductCredits(price);
            setRedBoostProgress(redBoostProgress + 17);

            // Update the button state (UI only)
            updateButtonState(
                "red",
                redBoostProgress + 17,
                dateTimeOffset,
                redPersonalProgressStartTime
            );

            /**
             * Update the combo multiplier (UI only)
             */
            updateComboMultiplier(
                "red",
                totalRedBoost,
                dateTimeOffset,
                eventMatchStartTime
            );

            creditAnimationRef.current?.triggerAnimation(price);
        } else {
            const price = PRICE_MAP[blueBoostLevel];
            //Blue
            if ((creditBalanceObj?.balance ?? 0) < price) {
                toast({
                    description: "You don't have enough credits!",
                    status: "error",
                    duration: 2500,
                    position: "bottom",
                });
                return;
            }
            deductCredits(price);
            setBlueBoostProgress(blueBoostProgress + 17);

            updateButtonState(
                "blue",
                blueBoostProgress + 17,
                dateTimeOffset,
                bluePersonalProgressStartTime
            );

            updateComboMultiplier(
                "blue",
                totalBlueBoost,
                dateTimeOffset,
                eventMatchStartTime
            );

            creditAnimationRef.current?.triggerAnimation(price);
        }

        if (boostRef.current) {
            boostRef.current.triggerReactionAnimation(
                {
                    userId: userDB?._id?.toString() || "",
                    userName:
                        userDB?.preferences?.displayName?.toString() || "",
                    pfpUrl: getActivePfpUrl(userDB) || "",
                    boostType: index === 0 ? "red" : "blue",
                    borderColor:
                        index === 0
                            ? "rgb(239, 68, 68)"
                            : index !== 0
                            ? "rgb(59, 130, 246)"
                            : "rgb(34, 197, 94)",
                    spawnRate: 1000,
                    boostLevel: index === 0 ? redBoostLevel : blueBoostLevel,
                    spawnCount: 1,
                    startTime: Date.now(),
                    intervalId: null,
                },
                1,
                true
            );
        }

        // setProgress((prev) => {
        //     const newProgress = [...prev] as [number, number];
        //     const increment = 10;
        //     newProgress[index] = Math.min(prev[index] + increment, 100);
        //     newProgress[1 - index] = Math.max(prev[1 - index] - increment, 0);
        //     onBoost?.(config.teams[index].id, newProgress[index]);

        //     // Use the mapping so that we get the actual username instead of the team name.
        //     const { username, imageUrl, borderColor } =
        //         userMapping[config.teams[index].id];

        //     const boostData: BoostUser = {
        //         userId: config.teams[index].id,
        //         userName: username,
        //         pfpUrl: imageUrl,
        //         borderColor,
        //         boostDuration: 15000,
        //         spawnRate: 1000,
        //         spawnCount: 1,
        //     };

        //     // Trigger the boost animation via the global store.
        //     console.log('boostData', boostData)
        //     startUserBoost(boostData);

        //     return newProgress;
        // });
    };

    const getProgressBarColor = (color: "red" | "blue") => {
        return color === "red" ? "bg-red-500" : "bg-blue-500";
    };

    const getButtonColor = (color: "red" | "blue") => {
        return {
            background:
                color === "red"
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-blue-500 hover:bg-blue-600",
            indicator: color === "red" ? "bg-red-400/30" : "bg-blue-400/30",
        };
    };

    const renderBoostButton = (
        index: number,
        color: "red" | "blue",
        gradient: { gradientStart: string; gradientEnd: string },
        boostLevel: number,
        boostProgressToNextLevel: number
    ) => {
        const price = PRICE_MAP[boostLevel];
        const balance = creditBalanceObj?.balance ?? 0;
        /*if (balance < price) {
            return (
                <button
                    onClick={() => setBuyCreditsPopupOpen(true)}
                    style={{
                        background: `linear-gradient(to right, ${gradient.gradientStart}, ${gradient.gradientEnd})`,
                    }}
                    className="flex-1 text-white px-[13px] py-[7px] rounded-lg transition-colors relative overflow-hidden group"
                >
                    <div className="flex items-center">
                        <div className="flex flex-col flex-1 items-start">
                            <span className="text-[14px]">
                                Buy Credits to {color === "red" ? "Rally Red" : "Rally Blue"}!
                            </span>
                        </div>
                    </div>
                    <div className={`bottom-[7px] left-0 h-1 ${getButtonColor(color).indicator}`}>
                        <div className="h-full bg-white/30 transition-all duration-300" style={{ width: `${boostProgressToNextLevel}%` }} />
                    </div>
                </button>
            );
        }*/
        return (
            <button
                onClick={() => handleBoostClick(index, price, boostLevel)}
                style={{
                    background: `linear-gradient(to right, ${gradient.gradientStart}, ${gradient.gradientEnd})`,
                }}
                className="flex-1 text-white px-[13px] py-[7px] rounded-lg transition-colors relative overflow-hidden group"
            >
                <div className="flex items-center">
                    <div className="flex flex-col flex-1 items-start">
                        <span className="text-[14px]">
                            {color === "red" ? "Rally Red" : "Rally Blue"}
                        </span>
                        <span className="text-xs">
                            {Math.max(0, boostLevel - 2) * 10}% Bonus
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[12px] opacity-80">
                            {price < 1 ? "Free" : price}
                        </span>
                        {price > 0 && (
                            <Image
                                style={{
                                    marginLeft: 3,
                                    marginBottom: 2,
                                    marginTop: 0,
                                    paddingTop: 0,
                                }}
                                src="/images/Credits/coin.webp"
                                alt="Credits"
                                width={3}
                                height={3}
                                className="w-3 h-3"
                            />
                        )}
                    </div>
                </div>
                <div
                    className={`bottom-[7px] left-0 h-1 ${
                        getButtonColor(color).indicator
                    }`}
                >
                    <div
                        className="h-full bg-white/30 transition-all duration-300"
                        style={{ width: `${boostProgressToNextLevel}%` }}
                    />
                </div>
            </button>
        );
    };

    const redTeamLevel = Math.min(
        10,
        Math.max(
            1,
            Math.floor((Math.max(1, redComboMultiplier) - 1.14) / 0.07 + 2.0)
        )
    );
    const blueTeamLevel = Math.min(
        10,
        Math.max(
            1,
            Math.floor((Math.max(1, blueComboMultiplier) - 1.14) / 0.07 + 2.0)
        )
    );
    //const blueTeamLevel = Math.floor(((Math.max(1,blueComboMultiplier) - 1.14) / 0.07) + 2.0);

    return (
        <div
            className="max-w-xl w-full"
            style={{
                fontFamily: "Poppins, sans-serif",
                display: isMatchRunning ? "block" : "none",
            }}
        >
            <BoostAnimations ref={boostRef} containerRef={containerRef} />

            <div className="bg-transparent px-[13px] pt-[0px] text-white rounded-xl shadow-lg">
                <div style={{ position: "relative" }}>
                    <div className="flex items-center justify-end gap-1 font-bold">
                        <span>{creditBalance}</span>
                        <Image
                            src="/images/Credits/coin.webp"
                            alt="Credits"
                            width={5}
                            height={5}
                            className="w-4 h-4"
                        />
                    </div>
                    <CreditDeductionAnimations ref={creditAnimationRef} />
                </div>

                {/* Header */}
                <div className="flex items-center pt-[6px]">
                    <span className="text-[14px] font-bold">
                        {config.teams[0].color} vs {config.teams[1].color}
                    </span>
                    <span
                        style={{ fontFamily: "Poppins-Light, sans-serif" }}
                        className="text-[14px] px-2 font-light"
                    >
                        |
                    </span>
                    <span
                        style={{ fontFamily: "Poppins-Light, sans-serif" }}
                        className="text-[12px] pr-2 font-light"
                    >
                        Rooting for who to win?
                    </span>
                    <span className="text-[14px] font-bold">
                        Round {roundNumber}
                    </span>
                </div>

                {/* Progress Bar & Stats */}
                <div className="mb-4 space-y-1">
                    <div className="relative h-[5px] bg-gray-100 rounded-md overflow-hidden">
                        <div
                            className={`absolute left-0 top-0 h-full ${getProgressBarColor(
                                config.teams[0].color
                            )} transition-all duration-300 ease-out flex items-center justify-start text-sm`}
                            style={{ width: `${redBlueRatio * 100}%` }}
                        />
                        <div
                            className={`absolute right-0 top-0 h-full ${getProgressBarColor(
                                config.teams[1].color
                            )} transition-all duration-300 ease-out flex items-center justify-end text-sm`}
                            style={{ width: `${(1 - redBlueRatio) * 100}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-sm">
                        <div className="flex gap-2 items-baseline">
                            <span className="text-[13px] font-bold">
                                {config.teams[0].name}
                            </span>
                            <span className="text-white text-[12px]">
                                Level {redTeamLevel.toFixed(0)}
                            </span>
                        </div>
                        <div className="flex gap-2 items-baseline">
                            <span className="text-white text-[12px]">
                                Level {blueTeamLevel.toFixed(0)}
                            </span>
                            <span className="text-[13px] font-bold">
                                {config.teams[1].name}
                            </span>
                        </div>
                    </div>
                </div>

                {/*  @todo refactor Boost Buttons */}
                <div
                    ref={containerRef}
                    className="relative flex justify-between gap-4"
                >
                    <div
                        key={"red boost"}
                        className="flex-1 flex justify-between rounded-lg"
                        style={{
                            background: `linear-gradient(to right, rgba(27,27,27,0.8), rgba(35,35,35,0.8))`,
                            padding: "4px",
                        }}
                    >
                        {renderBoostButton(
                            0,
                            "red",
                            defaultEventGradients[0],
                            redBoostLevel,
                            redBoostProgressToNextLevel
                        )}
                    </div>
                    <div
                        key={"blue boost"}
                        className="flex-1 flex justify-between rounded-lg"
                        style={{
                            background: `linear-gradient(to right, rgba(27,27,27,0.8), rgba(35,35,35,0.8))`,
                            padding: "4px",
                        }}
                    >
                        {renderBoostButton(
                            1,
                            "blue",
                            defaultEventGradients[1],
                            blueBoostLevel,
                            blueBoostProgressToNextLevel
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BoostRound;
