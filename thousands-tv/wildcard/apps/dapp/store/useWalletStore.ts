import { convertTokenUnit } from "@/utils/util";
import { create, StateCreator } from "zustand";

interface BalancesState {
    // An object mapping contract addresses to token balances (as numbers)
    balances: Record<string, number>;
    // Replaces the entire balances object (incoming values are bigints)
    setBalances: (balances: Record<string, bigint>) => void;
    // Updates (or adds) a single balance for a specific contract address (incoming value is a bigint)
    updateBalance: (contractAddress: string, balance: bigint) => void;
}

const createBalancesStore: StateCreator<BalancesState> = (set, get) => ({
    balances: {},
    setBalances: (balances: Record<string, bigint>) =>
        set({
            balances: Object.keys(balances).reduce((acc, key) => {
                acc[key] = Number(balances[key]);
                return acc;
            }, {} as Record<string, number>),
        }),
    updateBalance: (contractAddress: string, balance: bigint) =>
        set((state) => ({
            balances: {
                ...state.balances,
                [contractAddress]: convertTokenUnit(balance),
            },
        })),
});

export const useBalancesStore = create<BalancesState>(createBalancesStore);
