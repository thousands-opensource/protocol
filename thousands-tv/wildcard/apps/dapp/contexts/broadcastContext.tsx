import useBroadcastSDK, {
    BroadcastStateContextType,
} from "@/hooks/useBroadcastSDK";
import { ReactNode, createContext } from "react";

type ContextProviderProps = {
    children?: ReactNode;
};

const BROADCAST_STATUS = {
    LIVE: "LIVE",
    OFFLINE: "OFFLINE",
    LOADING: "LOADING",
    ERROR: "ERROR",
};

const BroadcastContext = createContext<BroadcastStateContextType>(
    {} as BroadcastStateContextType
);

const BroadcastProvider = ({ children }: ContextProviderProps) => {
    const state = useBroadcastSDK();

    return (
        <BroadcastContext.Provider value={state}>
            {children}
        </BroadcastContext.Provider>
    );
};

export default BroadcastProvider;
export { BroadcastContext, BROADCAST_STATUS };
