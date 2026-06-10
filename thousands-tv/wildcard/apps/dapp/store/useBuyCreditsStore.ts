import { create } from "zustand";

export type CreditPurchaseType = "crypto" | "fiat";
interface BuyCreditsStore {
    isBuyCreditsPopupOpen: boolean;
    setBuyCreditsPopupOpen: (open: boolean) => void;
    purchaseType: CreditPurchaseType;
    setPurchaseType: (purchaseType: CreditPurchaseType) => void;
    xSollaAccessToken: string;
    setXSollaAccessToken: (xSollaAccessToken: string) => void;
    sku: string;
    setSku: (sku: string) => void;
}

export const useBuyCreditsStore = create<BuyCreditsStore>((set) => ({
    isBuyCreditsPopupOpen: false,
    setBuyCreditsPopupOpen: (open: boolean) =>
        set({ isBuyCreditsPopupOpen: open }),
    purchaseType: "crypto",
    setPurchaseType: (purchaseType: CreditPurchaseType) =>
        set({ purchaseType }),
    sku: "",
    setSku: (sku: string) => set({ sku }),
    xSollaAccessToken: "",
    setXSollaAccessToken: (xSollaAccessToken: string) =>
        set({ xSollaAccessToken }),
}));
