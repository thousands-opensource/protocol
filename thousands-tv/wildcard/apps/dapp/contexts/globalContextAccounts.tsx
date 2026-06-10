import useCreditBalance from "@/hooks/credits/useCreditBalance";
import { IUser } from "@repo/interfaces";
import { createContext, useContext, useEffect, useState } from "react";

export interface UserDetailsMe {
    id: number;
    email: string;
    language?: string;
    scopes: string[];
    thirdPartyAppAssociations: any[];
    deviceIds: any[];
}

interface GamerTag {
    projectId: string;
    gamerTag: number;
}

export interface FindBeamableUser {
    id: number;
    email: string;
    gamerTags: GamerTag[];
    createdTimeMillis: number;
    updatedTimeMillis: number;
    userName: string;
    country: string;
    language: string;
    roleString: string;
}

interface WildfileUserContextType {
    setIsLoggedIn: (isLoggedIn: boolean) => void;
    isLoggedIn: boolean;
    setIsLoadingPage: (isLoading: boolean) => void;
    isLoadingPage: boolean;
    setUserDB: (data: IUser | null) => void;
    userDB: IUser | null;
    setConnectedUserDBProviderId: (connectedUserDBProviderId: string) => void;
    connectedUserDBProviderId: string;
    setConnectedUserDBEmail: (connectedUserDBEmail: string) => void;
    connectedUserDBEmail: string;
    setCreditBalance: (creditBalance: number) => void;
    creditBalance: number;
}

const WildfileUserContext = createContext<WildfileUserContextType>({
    setIsLoggedIn: () => {},
    isLoggedIn: false,
    setIsLoadingPage: () => {},
    isLoadingPage: false,
    setUserDB: () => {},
    userDB: null,
    setConnectedUserDBProviderId: () => {},
    connectedUserDBProviderId: "",
    setConnectedUserDBEmail: () => {},
    connectedUserDBEmail: "",
    setCreditBalance: () => {},
    creditBalance: 0,
});

export function AppWrapper({ children }: { children: React.ReactNode }) {
    let [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [userDB, setUserDB] = useState<IUser | null>(null);
    const [connectedUserDBProviderId, setConnectedUserDBProviderId] =
        useState<string>("");
    const [connectedUserDBEmail, setConnectedUserDBEmail] =
        useState<string>("");
    let [isLoadingPage, setIsLoadingPage] = useState(false);
    const [creditBalance, setCreditBalance] = useState<number>(0);

    const userId = userDB?._id?.toString() || null;
    const { creditBalanceObj } = useCreditBalance(userId);

    // Update the creditBalance when creditBalanceObj changes
    useEffect(() => {
        if (creditBalanceObj?.balance !== undefined) {
            setCreditBalance(creditBalanceObj.balance); // Only pass the balance (number)
        }
    }, [creditBalanceObj]);

    // update logged in state when userDB changes
    useEffect(() => {
        if (userDB?._id) {
            setIsLoggedIn(true);
        } else {
            setIsLoggedIn(false);
        }
    }, [userDB]);

    return (
        <WildfileUserContext.Provider
            value={{
                setIsLoggedIn,
                isLoggedIn,
                setIsLoadingPage,
                isLoadingPage,
                setUserDB,
                userDB,
                setConnectedUserDBProviderId,
                connectedUserDBProviderId,
                setConnectedUserDBEmail,
                connectedUserDBEmail,
                setCreditBalance,
                creditBalance,
            }}
        >
            {children}
        </WildfileUserContext.Provider>
    );
}

export function useWildfileUserContext() {
    return useContext(WildfileUserContext);
}
