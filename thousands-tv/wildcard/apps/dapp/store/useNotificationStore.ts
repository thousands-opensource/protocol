import { create } from "zustand";

export interface TabNotification {
    id: string;
    tabTitle: string;
    message: string;
    timestamp: number;
    read: boolean;
}

interface NotificationState {
    // Change from array to single notification
    activeNotification: TabNotification | null;
    activeTabIndex: number;
    tabContents: Array<{ title: string }>;

    // Actions
    addNotification: (tabTitle: string, message: string) => void;
    clearActiveNotification: () => void;
    setActiveTabIndex: (index: number) => void;
    updateTabContents: (tabs: Array<{ title: string }>) => void;
}

let userSelectedTabIndex = 0;

/**
 * Chat Notification store
 */
export const useNotificationStore = create<NotificationState>((set, get) => ({
    // Single active notification instead of array
    activeNotification: null,
    activeTabIndex: 0,
    tabContents: [],

    // Update tab contents
    updateTabContents: (tabs) => {
        set({ tabContents: tabs });
    },

    // Simplified addNotification - only keeps the most recent notification
    addNotification: (tabTitle, message) => {
        const { activeTabIndex, tabContents } = get();
        const currentTabTitle = tabContents[activeTabIndex]?.title;

        // Only set a notification if it's not for the current active tab
        if (tabTitle !== currentTabTitle) {
            set({
                activeNotification: {
                    id: Math.random().toString(36).substring(2, 9),
                    tabTitle,
                    message,
                    timestamp: Date.now(),
                    read: false,
                },
            });
        } else {
            console.log(`Skipping notification for active tab: ${tabTitle}`);
        }
    },

    // Clear the active notification
    clearActiveNotification: () => set({ activeNotification: null }),

    setActiveTabIndex: (index) => {
        userSelectedTabIndex = index;
        set((state) => {
            // Auto-clear notification if it's for the new active tab
            const currentTabTitle = state.tabContents[index]?.title;
            if (
                state.activeNotification &&
                state.activeNotification.tabTitle === currentTabTitle
            ) {
                return {
                    activeTabIndex: index,
                    activeNotification: null,
                };
            }
            return { activeTabIndex: index };
        });
    },
}));

export const shouldShowNotification = (tabTitle: string) => {
    const { activeTabIndex, tabContents } = useNotificationStore.getState();
    const currentTabTitle = tabContents[activeTabIndex]?.title;
    return currentTabTitle !== tabTitle;
};
