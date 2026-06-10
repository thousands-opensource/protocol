import { create } from "zustand";
import { BoostTrigger } from "@/types";
import { ChatApp } from "@repo/interfaces";

// Boost types from HEAD version
export interface ActiveBoost {
    userId: string;
    userName: string;
    pfpUrl: string;
    boostType: string;
    borderColor: string;
    boostLevel: number;
    spawnRate: number;
    spawnCount: number; // should be 1
    startTime: number;
    intervalId: NodeJS.Timeout | null;
}

interface BoostState {
    activeBoosts: ActiveBoost[];
    addActiveBoost: (activeBoost: ActiveBoost) => void;
    boostProcessingInterval: NodeJS.Timeout | null;
    startUserBoost: (boostData: ActiveBoost) => void;
    simulateMultipleBoosts: () => void;
    updateBoostInterval: (userId: string, intervalId: NodeJS.Timeout) => void;
    removeBoost: (userId: string) => void;
    clearAllBoosts: () => void;
    roundNumber: number;
    setRoundNumber: (roundNumber: number) => void;
    eventMatchStartTime: number;
    setEventMatchStartTime: (eventMatchStartTime: number) => void;
    redComboMultiplier: number;
    setRedComboMultiplier: (redComboMultiplier: number) => void;
    blueComboMultiplier: number;
    setBlueComboMultiplier: (blueComboMultiplier: number) => void;
    redBlueRatio: number;
    setRedBlueRatio: (redBlueRatio: number) => void;
    isBoostChatApp: (chatApp: ChatApp) => boolean;
    isMatchRunning: boolean;
    setIsMatchingRunning: (isMatchRunning: boolean) => void;
    triggerBoosts: (triggers: BoostTrigger[]) => void;
    processNextBoost: () => void;
    startBoostProcessing: () => void;
    mapBoostTriggerToActiveBoost: (trigger: BoostTrigger) => ActiveBoost;
    startProcessingActiveBoost: () => void;
    isProcessingActiveBoosts: boolean;
    lastBoostAddedTime: number;

    queue: BoostTrigger[];
    isQueueEmpty: () => boolean;
    peek: () => BoostTrigger | undefined;
    enqueue: (items: BoostTrigger[]) => void;
    dequeue: () => void;

    totalRedBoost: number;
    setTotalRedBoost: (totalRedBoost: number) => void;
    redBoostLevel: number;
    setRedBoostLevel: (redBoostLevel: number) => void;
    redBoostProgress: number;
    setRedBoostProgress: (redBoostProgress: number) => void;
    redPersonalProgressStartTime: number;
    setRedPersonalProgressStartTime: (
        redPersonalProgressStartTime: number
    ) => void;
    redPersonalProgressTotalDelayTime: number;
    setRedPersonalProgressTotalDelayTime: (
        redPersonalProgressStartTime: number
    ) => void;
    redBoostProgressToNextLevel: number;
    setRedBoostProgressToNextLevel: (
        redBoostProgressToNextLevel: number
    ) => void;

    totalBlueBoost: number;
    setTotalBlueBoost: (totalBlueBoost: number) => void;
    blueBoostLevel: number;
    setBlueBoostLevel: (redBoostLevel: number) => void;
    blueBoostProgress: number;
    setBlueBoostProgress: (redBoostProgress: number) => void;
    bluePersonalProgressStartTime: number;
    setBluePersonalProgressStartTime: (
        redPersonalProgressStartTime: number
    ) => void;
    bluePersonalProgressTotalDelayTime: number;
    setBluePersonalProgressTotalDelayTime: (
        redPersonalProgressStartTime: number
    ) => void;
    blueBoostProgressToNextLevel: number;
    setBlueBoostProgressToNextLevel: (
        redBoostProgressToNextLevel: number
    ) => void;

    dateTimeOffset: number;
    setDateTimeOffset: (dateTime: number) => void;
    updateComboMultiplier: (
        boostType: string,
        totalBoost: number,
        dateTimeOffset: number,
        eventMatchStartTime: number
    ) => void;
    updateButtonState: (
        boostType: string,
        boostProgress: number,
        dateTimeOffset: number,
        personalProgressStartTime: number
    ) => void;

    tokenRewardsTextDisplay: string;
    setTokenRewardsTextDisplay: (tokenRewardsTextDisplay: string) => void;

    chartData: { time: number; red: number; blue: number }[];
    addChartData: (redBlueRatio: number) => void;
    clearChartData: () => void;

    redCreditsSpent: number;
    setRedCreditsSpent: (redCreditsSpent: number) => void;
    blueCreditsSpent: number;
    setBlueCreditsSpent: (blueCreditsSpent: number) => void;
    redAvgPurchasePrice: number;
    setRedAvgPurchasePrice: (redAvgPurchasePrice: number) => void;
    blueAvgPurchasePrice: number;
    setBlueAvgPurchasePrice: (blueAvgPurchasePrice: number) => void;
    redAvgPoints: number;
    setRedAvgPoints: (redAvgPoints: number) => void;
    blueAvgPoints: number;
    setBlueAvgPoints: (blueAvgPoints: number) => void;
    totalUniqueUserCount: number;
    setTotalUniqueUser: (totalUniqueUserCount: number) => void;
}

const mergeUniqueBoosts = (
    existing: ActiveBoost[],
    newBoosts: ActiveBoost[]
): ActiveBoost[] => {
    const combined = [...existing, ...newBoosts];
    const unique: ActiveBoost[] = [];
    combined.forEach((boost) => {
        if (
            !unique.some(
                (b) =>
                    b.userId === boost.userId && boost.startTime === b.startTime
            )
        ) {
            unique.push(boost);
        }
    });
    return unique;
};

const BOOST_THROTTLE_MS = 100; // Minimum time between boost additions
const PROCESSING_LOCK_RELEASE_DELAY_MS = 100; // Time to wait before releasing the processing lock
const MAX_ACTIVE_BOOSTS = 20; // Maximum number of active boosts to keep in memory
const TWO_MINUTES_MS = 2 * 60 * 1000;

export const useBoostStore = create<BoostState>((set, get) => ({
    activeBoosts: [],
    isProcessingActiveBoosts: false,
    lastBoostAddedTime: 0,

    addActiveBoost: (activeBoost) => {
        try {
            // Skip if already processing boosts (prevents concurrent updates)
            if (get().isProcessingActiveBoosts) {
                console.log("Already processing boosts, skipping new boost");
                return;
            }

            // Add rate limiting (prevent too many updates in short time)
            const now = Date.now();
            const lastBoostTime = get().lastBoostAddedTime || 0;
            if (now - lastBoostTime < BOOST_THROTTLE_MS) {
                console.log("Throttling rapid boost additions");
                return;
            }

            // Create a unique ID for this boost to prevent duplicates
            const boostId = `${activeBoost.userId}-${
                activeBoost.startTime || now
            }`;

            // Check for duplicates
            const isDuplicate = get().activeBoosts.some(
                (existingBoost) =>
                    `${existingBoost.userId}-${
                        existingBoost.startTime || 0
                    }` === boostId
            );

            if (isDuplicate) {
                console.log("Duplicate boost detected, skipping:", boostId);
                return;
            }

            let newBoosts = [...get().activeBoosts];

            // If we exceed limit, remove oldest boosts
            if (newBoosts.length >= MAX_ACTIVE_BOOSTS) {
                newBoosts = newBoosts.slice(-MAX_ACTIVE_BOOSTS + 1);
            }

            // Add the new boost
            newBoosts.push({
                ...activeBoost,
                startTime: activeBoost.startTime || now,
            });

            // Update state with processing flag to prevent further updates
            set({
                isProcessingActiveBoosts: true,
                activeBoosts: newBoosts,
                lastBoostAddedTime: now,
            });

            // Release the processing lock after a delay
            setTimeout(() => {
                set({ isProcessingActiveBoosts: false });
            }, PROCESSING_LOCK_RELEASE_DELAY_MS);
        } catch (error) {
            // Handle the error gracefully
            console.warn("Error in addActiveBoost, recovering:", error);

            // Make sure we reset any processing flags
            set({ isProcessingActiveBoosts: false });
        }
    },
    boostProcessingInterval: null,
    startUserBoost: (boostData: ActiveBoost) =>
        set((state) => ({
            activeBoosts: [
                ...state.activeBoosts,
                { ...boostData, startTime: Date.now(), intervalId: null },
            ],
        })),
    updateComboMultiplier: (
        boostType: string,
        totalBoost: number,
        dateTimeOffset: number,
        eventMatchStartTime: number
    ) => {
        //Calculate the adjusted front end time using the dateTimeOffset (which is the difference between client and server)
        //const frontendTimestamp = Date.now() + dateTimeOffset;

        // console.log("boostType: ", boostType);

        const timeDecayFactor = 0.0;
        let adjustedTotalBoost = totalBoost; /* -
            (frontendTimestamp - eventMatchStartTime) * 0.001 * timeDecayFactor;*/

        // console.log("eventMatchStartTime", eventMatchStartTime);
        // console.log("timeDecay: ", ((frontendTimestamp - eventMatchStartTime) * 0.001 * timeDecayFactor));
        // console.log("totalBoost: ", totalBoost);

        if (adjustedTotalBoost < 0) adjustedTotalBoost = 0;

        // console.log("adjustedTotalBoost: ", adjustedTotalBoost);

        let comboMultiplier = 1 + 0.001 * Math.sqrt(adjustedTotalBoost);
        if (comboMultiplier < 1.0) comboMultiplier = 1.0;

        // console.log("comboMultiplier: ", comboMultiplier);

        if (boostType == "red") {
            get().setRedComboMultiplier(comboMultiplier);
        } else {
            get().setBlueComboMultiplier(comboMultiplier);
        }
    },
    updateButtonState: (
        boostType: string,
        boostProgress: number,
        dateTimeOffset: number,
        personalProgressStartTime: number
    ) => {
        //Calculate the adjusted front end time using the dateTimeOffset (which is the difference between client and server)
        //const frontendTimestamp = Date.now() + dateTimeOffset;

        //This is temporary until we get the "join" setting the initial values
        /*
        if (personalProgressStartTime < 1) {
            personalProgressStartTime = frontendTimestamp;
            if (boostType === "red") {
                get().setRedPersonalProgressStartTime(
                    personalProgressStartTime
                );
            } else {
                get().setBluePersonalProgressStartTime(
                    personalProgressStartTime
                );
            }
        }
        */

        //Set adjustedBoostProgress to the decayed value by using the time since personalProgressStartTime.  We multiply time by 0.001 because time is in ms.
        const timeDecayFactor = 0.0;
        let adjustedPersonalBoostProgress = boostProgress; /* -
            (frontendTimestamp - personalProgressStartTime) *
                0.001 *
                timeDecayFactor;*/

        //adjustedBoostProgress can't go less than zero
        /*
        if (adjustedPersonalBoostProgress < 0) {
            adjustedPersonalBoostProgress = 0;

            const adjustCurrentTimeStampByBoostProgress =
                frontendTimestamp -
                boostProgress * (1.0 / 0.001) * (1.0 / timeDecayFactor);
            if (boostType === "red") {
                get().setRedPersonalProgressStartTime(
                    adjustCurrentTimeStampByBoostProgress
                );
            } else {
                get().setBluePersonalProgressStartTime(
                    adjustCurrentTimeStampByBoostProgress
                );
            }
        }
            */
        //Calculate the level by dividing by 100.  Add 1 because level is 1 based.
        var adjustedPersonalBoostLevel =
            Math.floor(adjustedPersonalBoostProgress / 100.0) + 1;
        //Cap the level at 7
        if (adjustedPersonalBoostLevel > 7) {
            adjustedPersonalBoostLevel = 7;
        }
        //Calculate the boost progress to next level using the remainder using % 100
        const adjustedBoostProgressToNextLevel = Math.round(
            adjustedPersonalBoostProgress % 100
        );

        if (boostType === "red") {
            get().setRedBoostLevel(adjustedPersonalBoostLevel);
            get().setRedBoostProgressToNextLevel(
                adjustedBoostProgressToNextLevel
            );
        } else {
            get().setBlueBoostLevel(adjustedPersonalBoostLevel);
            get().setBlueBoostProgressToNextLevel(
                adjustedBoostProgressToNextLevel
            );
        }
    },
    simulateMultipleBoosts: () => {
        const simulatedMessages: BoostTrigger[] = [
            // {
            //     timestamp: new Date(),
            //     userId: "1",
            //     userName: "Alex",
            //     pfpUrl: "/images/pfps/azuki.jpg",
            //     boostType: "fire",
            //     boostLevel: 1,
            //     boostProgress: 0,
            // },
            //   {
            //     timestamp: new Date(),
            //     userId: "2",
            //     userName: "Taylor",
            //     pfpUrl: "/images/pfps/remyd.png",
            //     boostType: "water",
            //     boostLevel: 2,
            //     boostProgress: 0,
            //   },
            //   {
            //     timestamp: new Date(),
            //     userId: "3",
            //     userName: "Jordan",
            //     pfpUrl: "/images/pfps/cbasstalent.jpg",
            //     boostType: "fire",
            //     boostLevel: 3,
            //     boostProgress: 0,
            //   },
        ];
        get().enqueue(simulatedMessages);
    },
    updateBoostInterval: (userId: string, intervalId: NodeJS.Timeout) =>
        set((state) => ({
            activeBoosts: state.activeBoosts.map((boost) =>
                boost.userId === userId ? { ...boost, intervalId } : boost
            ),
        })),
    removeBoost: (userId: string) =>
        set((state) => ({
            activeBoosts: state.activeBoosts.filter(
                (boost) => boost.userId !== userId
            ),
        })),
    clearAllBoosts: () => {
        // get().activeBoosts.forEach((boost) => {
        //     if (boost.intervalId) clearInterval(boost.intervalId);
        // });
        set({ activeBoosts: [] });
    },
    setRoundNumber: (roundNumber: number) => set({ roundNumber }),
    setEventMatchStartTime: (eventMatchStartTime: number) =>
        set({ eventMatchStartTime }),
    // Additional state properties
    redComboMultiplier: 1.0,
    setRedComboMultiplier: (redComboMultiplier: number) =>
        set({ redComboMultiplier }),
    blueComboMultiplier: 1.0,
    setBlueComboMultiplier: (blueComboMultiplier: number) =>
        set({ blueComboMultiplier }),
    redBlueRatio: 0.5,
    roundNumber: 1,
    eventMatchStartTime: 0,
    setRedBlueRatio: (redBlueRatio: number) => set({ redBlueRatio }),
    isBoostChatApp: (chatApp: ChatApp) => chatApp === ChatApp.BOOST,
    isMatchRunning: false,
    setIsMatchingRunning: (isMatchRunning: boolean) => set({ isMatchRunning }),
    triggerBoosts: (triggers: BoostTrigger[]) => {
        set((state) => {
            const newBoosts = triggers.map(get().mapBoostTriggerToActiveBoost);
            return {
                activeBoosts: mergeUniqueBoosts(state.activeBoosts, newBoosts),
            };
        });
    },
    processNextBoost: () => {
        const { activeBoosts, dequeue } = get();
        if (activeBoosts.length > 0) {
            dequeue();
        }
    },

    // Start a timer that processes one boost per second
    startBoostProcessing: () => {
        if (get().boostProcessingInterval) return;
        const intervalId = setInterval(() => {
            if (get().activeBoosts.length > 0) {
                get().processNextBoost();
            } else {
                // Optionally, clear the interval when the queue is empty
                clearInterval(get().boostProcessingInterval!);
                set({ boostProcessingInterval: null });
            }
        }, 10000);
        set({ boostProcessingInterval: intervalId });
    },
    mapBoostTriggerToActiveBoost: (trigger: BoostTrigger) => {
        return {
            userId: trigger.userId,
            userName: trigger.userName,
            pfpUrl: trigger.pfpUrl,
            boostType: trigger.boostType,
            borderColor:
                trigger.boostType === "red"
                    ? "rgb(239, 68, 68)"
                    : trigger.boostType === "blue"
                    ? "rgb(59, 130, 246)"
                    : "rgb(34, 197, 94)",
            boostLevel: trigger.boostLevel,
            spawnRate: 1000,
            spawnCount: 1,
            startTime: Date.now(),
            intervalId: null,
        };
    },

    startProcessingActiveBoost: () => {
        if (!get().boostProcessingInterval) {
            setTimeout(() => get().startBoostProcessing(), 0);
        }
    },

    queue: [],
    isQueueEmpty: () => get().queue.length <= 0,
    peek: () => get().queue[0],
    enqueue: (items: BoostTrigger[]) =>
        set((state) => ({ queue: [...state.queue, ...items] })),
    dequeue: () => {
        if (get().queue.length === 0) return;
        set((state) => ({ queue: state.queue.slice(1) }));
    },

    totalRedBoost: 0,
    setTotalRedBoost: (totalRedBoost: number) => set({ totalRedBoost }),
    redBoostLevel: 1,
    setRedBoostLevel: (redBoostLevel: number) => set({ redBoostLevel }),
    redBoostProgress: 0,
    setRedBoostProgress: (redBoostProgress: number) =>
        set({ redBoostProgress }),
    redPersonalProgressStartTime: 0,
    setRedPersonalProgressStartTime: (redPersonalProgressStartTime: number) =>
        set({ redPersonalProgressStartTime }),
    redPersonalProgressTotalDelayTime: 0,
    setRedPersonalProgressTotalDelayTime: (
        redPersonalProgressTotalDelayTime: number
    ) => set({ redPersonalProgressTotalDelayTime }),
    redBoostProgressToNextLevel: 0,
    setRedBoostProgressToNextLevel: (redBoostProgressToNextLevel: number) =>
        set({ redBoostProgressToNextLevel }),

    totalBlueBoost: 0,
    setTotalBlueBoost: (totalBlueBoost: number) => set({ totalBlueBoost }),
    blueBoostLevel: 1,
    setBlueBoostLevel: (blueBoostLevel: number) => set({ blueBoostLevel }),
    blueBoostProgress: 0,
    setBlueBoostProgress: (blueBoostProgress: number) =>
        set({ blueBoostProgress }),
    bluePersonalProgressStartTime: 0,
    setBluePersonalProgressStartTime: (bluePersonalProgressStartTime: number) =>
        set({ bluePersonalProgressStartTime }),
    bluePersonalProgressTotalDelayTime: 0,
    setBluePersonalProgressTotalDelayTime: (
        bluePersonalProgressTotalDelayTime: number
    ) => set({ bluePersonalProgressTotalDelayTime }),
    blueBoostProgressToNextLevel: 0,
    setBlueBoostProgressToNextLevel: (blueBoostProgressToNextLevel: number) =>
        set({ blueBoostProgressToNextLevel }),

    dateTimeOffset: 0,
    setDateTimeOffset: (dateTimeOffset: number) => set({ dateTimeOffset }),

    tokenRewardsTextDisplay: "",
    setTokenRewardsTextDisplay: (tokenRewardsTextDisplay: string) =>
        set({ tokenRewardsTextDisplay }),

    chartData: [],
    addChartData: (redBlueRatio: number) => {
        const now = Date.now();
        set((state) => ({
            chartData: [
                ...state.chartData.filter(
                    (point) => now - point.time < TWO_MINUTES_MS
                ),
                {
                    time: now,
                    red: redBlueRatio,
                    blue: 1 - redBlueRatio,
                },
            ],
        }));
    },
    clearChartData: () => set({ chartData: [] }),

    redCreditsSpent: 0,
    setRedCreditsSpent: (redCreditsSpent: number) => set({ redCreditsSpent }),
    blueCreditsSpent: 0,
    setBlueCreditsSpent: (blueCreditsSpent: number) =>
        set({ blueCreditsSpent }),
    redAvgPurchasePrice: 0,
    setRedAvgPurchasePrice: (redAvgPurchasePrice: number) =>
        set({ redAvgPurchasePrice }),
    blueAvgPurchasePrice: 0,
    setBlueAvgPurchasePrice: (blueAvgPurchasePrice: number) =>
        set({ blueAvgPurchasePrice }),
    redAvgPoints: 0,
    setRedAvgPoints: (redAvgPoints: number) => set({ redAvgPoints }),
    blueAvgPoints: 0,
    setBlueAvgPoints: (blueAvgPoints: number) => set({ blueAvgPoints }),
    totalUniqueUserCount: 0,
    setTotalUniqueUser: (totalUniqueUserCount: number) =>
        set({ totalUniqueUserCount }),
}));
