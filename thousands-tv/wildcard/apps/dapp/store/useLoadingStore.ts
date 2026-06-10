import { create } from "zustand";

interface LoadingState {
    isLoading: boolean;
    loadingMessage: string;
    setLoading: (loading: boolean, message?: string) => void;
}

/**
 * Loading store - Global state for loading state management.
 */
const useLoadingStore = create<LoadingState>((set) => ({
    isLoading: false,
    loadingMessage: "Loading...",
    setLoading: (loading, message = "Loading...") =>
        set({ isLoading: loading, loadingMessage: message }),
}));

export default useLoadingStore;
