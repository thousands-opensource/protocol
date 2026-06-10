import { create } from "zustand";

export enum VotingState {
    INACTIVE = "INACTIVE",
    STARTED = "STARTED",
    VOTED = "VOTED",
    COMPLETED = "COMPLETED",
}

type VoteOption = {
    optionId: string;
    displayText: string;
    color: string;
    votes: number;
};

export type VotingUpdate = {
    totalVotes: number;
    options: {
        [key: string]: number;
    };
    timeRemaining?: number;
    isFinalUpdate: boolean;
};

export type VoteConfig = {
    title: string;
    options: {
        optionId: string;
        displayText: string;
        color: string;
    }[];
    duration: number;
    initialVotes?: number;
    stageId: string;
};

interface VotingStore {
    currentState: VotingState;
    chartData: VoteOption[];
    totalVotes: number;
    title: string;
    targetEndTime: number | undefined;
    stageId: string;
    isTabVisible: boolean; // New property to handle tab visibility

    setCurrentState: (state: VotingState) => void;
    handleVoteUpdate: (update: VotingUpdate) => void;
    startVoting: (config: VoteConfig) => void;
    setUserVoted: () => void;
    simulateVoteUpdates: () => () => void;
    getRemainingTime: () => number;
    showVotingTab: () => void; // New method to show voting tab
    hideVotingTab: () => void; // New method to hide voting tab
    toggleVotingTab: () => void; // New method to toggle tab visibility
}

export const optionIdsList = ["1", "2", "3", "4", "5", "6", "7", "8"];

export const chartColorsList = ["#ffad00", "#ff08af", "#993bff", "#00a7ff", "#97d400", "#ff4800"];

export const useVotingStore = create<VotingStore>((set, get) => ({
    currentState: VotingState.INACTIVE,
    chartData: [],
    totalVotes: 0,
    title: "",
    targetEndTime: undefined,
    stageId: "",
    isTabVisible: false, // Initialize tab as not visible

    setCurrentState: (state) => set({ currentState: state }),

    getRemainingTime: () => {
        const { targetEndTime } = get();
        if (!targetEndTime) return 0;
        return Math.max(0, Math.floor((targetEndTime - Date.now()) / 1000));
    },

    handleVoteUpdate: (update) => {
        set((state) => {
            const newState: Partial<VotingStore> = {
                totalVotes: update.totalVotes,
                chartData: state.chartData.map((option) => ({
                    ...option,
                    votes: update.options[option.optionId] || 0,
                })),
            };

            if (state.targetEndTime === undefined && update.timeRemaining) {
                newState.targetEndTime =
                    Date.now() + update.timeRemaining * 1000;
            }

            return newState;
        });
    },

    startVoting: (config: VoteConfig) => {
        const initialOptions = config.options.map((option) => ({
            ...option,
            votes: Math.floor(config.initialVotes || 0 / config.options.length),
        }));

        set({
            currentState: VotingState.STARTED,
            chartData: initialOptions,
            totalVotes: config.initialVotes || 0,
            targetEndTime: Date.now() + config.duration * 1000,
            title: config.title,
            stageId: config.stageId,
            isTabVisible: true, // Show the tab when voting starts
        });
    },

    setUserVoted: () => {
        set({ currentState: VotingState.VOTED });
    },

    // New methods to control tab visibility
    showVotingTab: () => {
        set({ isTabVisible: true });
    },

    hideVotingTab: () => {
        set({ isTabVisible: false });
    },

    toggleVotingTab: () => {
        set((state) => ({ isTabVisible: !state.isTabVisible }));
    },

    simulateVoteUpdates: () => {
        const { chartData, targetEndTime } = get();

        const initialUpdate: VotingUpdate = {
            totalVotes: 100,
            options: Object.fromEntries(
                chartData.map((option) => [option.optionId, 25])
            ),
            timeRemaining: get().getRemainingTime(),
            isFinalUpdate: false,
        };

        const store = get();
        store.handleVoteUpdate(initialUpdate);

        const interval = setInterval(() => {
            const remainingTime = get().getRemainingTime();
            const { totalVotes } = get();

            const newVotes: Record<string, number> = {};
            chartData.forEach((option) => {
                newVotes[option.optionId] = Math.floor(Math.random() * 50);
            });

            const newUpdate: VotingUpdate = {
                totalVotes:
                    totalVotes +
                    Object.values(newVotes).reduce((a, b) => a + b, 0),
                options: newVotes,
                timeRemaining: remainingTime,
                isFinalUpdate: false,
            };

            store.handleVoteUpdate(newUpdate);

            if (remainingTime === 0) {
                set({ currentState: VotingState.COMPLETED });
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    },
}));
