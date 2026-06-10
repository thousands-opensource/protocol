import { Leader } from "@/types";
import { create } from "zustand";

interface LeaderboardState {
    currentUserRank: number;
    setCurrentUserRank: (currentUserRank: number) => void;
    chatLeaderboard: Leader[];
    setChatLeaderboard: (chatLeaderboard: Leader[]) => void;
}

/**
 * chat app leaderboard store - Global state for chat app leaderboard state management.
 */
export const useChatAppLeaderboardStore = create<LeaderboardState>((set) => ({
    currentUserRank: 0,
    setCurrentUserRank: (currentUserRank: number) => set({ currentUserRank }),
    chatLeaderboard: [],
    setChatLeaderboard: (chatLeaderboard: Leader[]) => set({ chatLeaderboard }),
}));
