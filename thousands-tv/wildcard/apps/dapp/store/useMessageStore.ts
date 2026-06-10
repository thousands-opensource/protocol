import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface MessageState {
    messageQueue: CooldownMessage[]; // timestamp for now maybe message with time?
    rateLimitTier: number;
    setMessageQueue: (message: CooldownMessage[]) => void;
    setRateLimitTier: (rateLimitTier: number) => void;
    getLastMessageSentTimestamp: () => number;
    isReadySendMessage: (newRateLimitTier: number) => boolean;
    determineRateLimitTier: (messagesInPastMin: number) => number;
}

export interface CooldownMessage {
    // userId: string
    message: string;
    timestamp: number;
    // timetoken: number
    // cooldownEnd: number
}

export const MESSAGE_COOLDOWN_SECONDS = 5;
export const MESSAGE_COOLDOWN_MILLISECOND = MESSAGE_COOLDOWN_SECONDS * 1000;
export const ONE_MINUTE_IN_MS = 60 * 1000;

export const TIERS = [0, 3, 5];
export const MESSAGE_COOLDOWN_MILLISECONDS = [0, 15000, 60000];
export const MESSAGE_RATE_LIMIT_TIER: { [key: number]: number } =
    Object.fromEntries(
        TIERS.map((tier, index) => [tier, MESSAGE_COOLDOWN_MILLISECONDS[index]])
    );

/**
 * message queue store - Global state for message queue store state management.
 */
export const useMessageStore = create<MessageState>()(
    persist(
        (set, get) => ({
            messageQueue: [],
            rateLimitTier: 0,
            setRateLimitTier: (rateLimitTier: number) => set({ rateLimitTier }),
            setMessageQueue: (messageQueue: CooldownMessage[]) => {
                set({ messageQueue });
            },
            getLastMessageSentTimestamp: () =>
                get().messageQueue?.[0]?.timestamp || 0,
            isReadySendMessage: (newRateLimitTier: number) =>
                Date.now() - get().getLastMessageSentTimestamp() >
                MESSAGE_RATE_LIMIT_TIER[newRateLimitTier],
            determineRateLimitTier: (messagesInPastMin: number) => {
                if (messagesInPastMin >= 5) {
                    return 5;
                } else if (messagesInPastMin >= 3) {
                    return 3;
                }

                return 0;
            },
        }),
        {
            name: "chat-message-rate-limit",
            storage: createJSONStorage(() => localStorage),
        }
    )
);
