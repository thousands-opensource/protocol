import { create } from "zustand";

interface OrderConfirmationState {
    isLoadingFetchPriceQuote: boolean;
    setIsLoadingFetchPriceQuote: (isLoadingFetchPriceQuote: boolean) => void;
    openPopup: boolean;
    setOpenPopup: (openPopup: boolean) => void;
    errorMessage: string;
    setErrorMessage: (errorMessage: string) => void;
    popupMessage: string;
    setPopupMessage: (popupMessage: string) => void;
    isLoadingConfirmation: boolean;
    setIsLoadingConfirmation: (isLoadingConfirmation: boolean) => void;
    isOrderCompleted: boolean;
    setIsOrderCompleted: (isOrderCompleted: boolean) => void;
}

/**
 * Order confirmation store - Global state for order confirmation state management.
 */
export const useOrderConfirmationStore = create<OrderConfirmationState>(
    (set) => ({
        isLoadingFetchPriceQuote: false,
        setIsLoadingFetchPriceQuote: (isLoadingFetchPriceQuote) =>
            set({ isLoadingFetchPriceQuote }),
        openPopup: false,
        setOpenPopup: (openPopup) => set({ openPopup }),
        errorMessage: "",
        setErrorMessage: (errorMessage) => set({ errorMessage }),
        popupMessage: "",
        setPopupMessage: (popupMessage) => set({ popupMessage }),
        isLoadingConfirmation: false,
        setIsLoadingConfirmation: (isLoadingConfirmation) =>
            set({ isLoadingConfirmation }),
        isOrderCompleted: false,
        setIsOrderCompleted: (isOrderCompleted) => set({ isOrderCompleted }),
    })
);
