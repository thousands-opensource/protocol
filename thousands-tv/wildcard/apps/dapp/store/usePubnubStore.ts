import { Channel, Chat } from "@pubnub/chat";
import { create } from "zustand";

interface PubnubState {
    pubnub: Chat | null;
    setPubNub: (pubnub: Chat | null) => void;
    activeChannel: Channel | null;
    setActiveChannel: (activeChannel: Channel | null) => void;
    generalChannel: Channel | null;
    setGeneralChannel: (generalChannel: Channel | null) => void;
    setToken: (token: string) => void;
    fetchChannel: (channelId: string) => Promise<Channel | null>;
}

/**
 * Pubnub store - Global state for pubnub state management.
 */
const usePubnubStore = create<PubnubState>((set, get) => ({
    pubnub: null,
    setPubNub: (pubnub) => set({ pubnub }),
    activeChannel: null,
    setActiveChannel: (activeChannel) => set({ activeChannel }),
    generalChannel: null,
    setGeneralChannel: (generalChannel) => set({ generalChannel }),

    /**
     * Sets PubNub auth token
     */
    setToken: (token: string) => {
        const pubnub = get().pubnub;
        if (!pubnub) {
            console.error("Cannot set token: PubNub instance is null");
            return;
        }
        pubnub.sdk.setToken(token);
    },

    /**
     * Fetches a channel by ID and returns it
     * Note: Now returns the channel instead of void for better usability
     */
    fetchChannel: async (channelId: string) => {
        const pubnub = get().pubnub;
        if (!pubnub) {
            return null;
        }

        try {
            const updatedChannel = await pubnub.getChannel(channelId);
            console.log("Now fetching channel:", channelId, updatedChannel);

            return updatedChannel;
        } catch (e: any) {
            console.error("Error unable to fetch channel:", channelId, e);
            return null;
        }
    },
}));

export default usePubnubStore;
