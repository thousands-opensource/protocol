import { COOKIES_ACCESS_TOKEN_WILDCARD } from "@/utils/accountAPIUtil";
import axios from "axios";
import { create } from "zustand";
import Cookies from "js-cookie";
import { getMyCoinsUrl } from "@/utils/environmentUtilWCA";

interface ChatAppMyCoinsState {
    myCoinPositions: any[];
    setMyCoinPositions: (topCoinPositions: any[]) => void;
    fetchMyPositions: () => Promise<void>;
}

async function getMyCoinPositionsApi() {
    try {
        const wildcardAccessToken = Cookies.get(COOKIES_ACCESS_TOKEN_WILDCARD);
        const myCoinsUrl = getMyCoinsUrl();
        const myCoinPositionsResponse = await axios.get(myCoinsUrl, {
            headers: {
                Authorization: `Bearer ${wildcardAccessToken}`,
                "Content-Type": "application/json",
            },
        });

        return myCoinPositionsResponse.data;
    } catch (e: any) {
        const errMsg = "Failed to fetch my position for streme coin";
        console.error(errMsg, e);
    }
}

/**
 * chat app my coin store - Global state for chat app top coin state management.
 */
export const useChatAppMyCoinsStore = create<ChatAppMyCoinsState>((set) => ({
    myCoinPositions: [],
    setMyCoinPositions: (myCoinPositions) => set({ myCoinPositions }),
    fetchMyPositions: async () => {
        const myCoinpositionsResponse = await getMyCoinPositionsApi();
        const myCoinPositions = myCoinpositionsResponse.map(
            (position: any) => ({
                CoinName: position.CoinHolding.CoinName,
                Quantity: position.CoinHolding.Quantity,
            })
        );

        set({ myCoinPositions });
    },
}));
