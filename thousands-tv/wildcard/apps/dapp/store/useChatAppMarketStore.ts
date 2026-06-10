import { MarketOrder } from "@/features/Stream";
import { AxiosResponse } from "axios";
import { create } from "zustand";

interface ChatAppMarketState {
    streamScore: number;
    setStreamScore: (score: number) => void;

    priceQuoteGuid: string;
    setPriceQuoteGuid: (priceQuoteGuid: string) => void;
    handleFetchPriceQuote: (
        orderType: string,
        name: string,
        quantity: number
    ) => Promise<AxiosResponse<any, any>>;
    renderConfirmationOrderEntryText: (
        marketOrder: MarketOrder,
        coinName: string,
        quantity: number,
        price: number,
        tax: number
    ) => string;
}

// /**
//  * chat app market store - Global state for chat app market (price quote) state management.
//  */
// export const useChatAppMarketStore = create<ChatAppMarketState>((set) => ({
//     streamScore: 0,
//     setStreamScore: (score) => set({ streamScore: score }),

//     priceQuoteGuid: string,
//     setPriceQuoteGuid: (priceQuoteGuid) => set({ priceQuoteGuid}),
//     handleFetchPriceQuote: (
//         orderType: string,
//         name: string,
//         quantity: number
//     ) => Promise<AxiosResponse<any, any>>,
//     renderConfirmationOrderEntryText: (
//         marketOrder: MarketOrder,
//         coinName: string,
//         quantity: number,
//         price: number,
//         tax: number
//     ) => string;
// }));
