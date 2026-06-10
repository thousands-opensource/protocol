import { COOKIES_ACCESS_TOKEN_WILDCARD } from "@/utils/accountAPIUtil";
import axios from "axios";
import { create } from "zustand";
import Cookies from "js-cookie";
import { getTopCoinsUrl } from "@/utils/environmentUtilWCA";

interface StreamCoin {
    CoinName: string;
    Price: number;
}

interface ChatAppTopCoinsState {
    topCoinPositions: StreamCoin[];
    setTopCoinPositions: (topCoinPositions: StreamCoin[]) => void;
    fetchTopPositions: () => Promise<void>;
}

async function getTopPositionsApi() {
    try {
        const wildcardAccessToken = Cookies.get(COOKIES_ACCESS_TOKEN_WILDCARD);
        const topCoinsUrl = getTopCoinsUrl();
        const topPositionsResponse = await axios.get(topCoinsUrl, {
            headers: {
                Authorization: `Bearer ${wildcardAccessToken}`,
                "Content-Type": "application/json",
            },
        });
        return topPositionsResponse.data;
    } catch (e: any) {
        const errMsg = "Error failed to fetch top streme coin positions";
        console.error(errMsg, e);
    }
}

/**
 * chat app top coin store - Global state for chat app top coin state management.
 */
export const useChatAppTopCoinsStore = create<ChatAppTopCoinsState>((set) => ({
    topCoinPositions: [],
    setTopCoinPositions: (topCoinPositions) => set({ topCoinPositions }),
    fetchTopPositions: async () => {
        const positions = await getTopPositionsApi();
        set({ topCoinPositions: positions });
    },
}));
