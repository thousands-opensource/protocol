import { createContext, Dispatch, SetStateAction, useContext } from "react";

interface GlobalInterface {
    loadingSpinner: boolean;
    setLoadingSpinner: Dispatch<SetStateAction<boolean>>;
    loggedIn: boolean | undefined;
    loggedInStatusInitialized: boolean;
    setLoggedIn: Dispatch<SetStateAction<boolean | undefined>>;
}
export const GlobalContext = createContext<GlobalInterface>(
    {} as GlobalInterface
);

/*
 * Helper Context Function to force the pagelayout to re-render
 */
export const useGlobalContext = () => {
    const context = useContext(GlobalContext);

    if (!context) {
        throw new Error("useGlobalContext must be used within an _app.tsx");
    }
    return context;
};
