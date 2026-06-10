import { create } from "zustand";

interface StreamScoreState {
    streamScore: number;
    setStreamScore: (score: number) => void;
}

/**
 * Stream Score store - Global state for stream score state management.
 */
export const useStreamScoreStore = create<StreamScoreState>((set) => ({
    streamScore: 0,
    setStreamScore: (score) => set({ streamScore: score }),
}));
