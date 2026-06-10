import {
    createContext,
    Dispatch,
    ReactNode,
    SetStateAction,
    useContext,
    useMemo,
    useState,
} from "react";

interface ConfirmationProviderProps {
    children: ReactNode | ReactNode[];
}

interface ConfirmationContextInterface {
    isLoadingFetchPriceQuote: boolean;
    setIsLoadingFetchPriceQuote: Dispatch<SetStateAction<boolean>>;
    openPopup: boolean;
    setOpenPopup: Dispatch<SetStateAction<boolean>>;
    errorMessage: string;
    setErrorMessage: Dispatch<SetStateAction<string>>;
    popupMessage: string;
    setPopupMessage: Dispatch<SetStateAction<string>>;
    isLoadingConfirmation: boolean;
    setIsLoadingConfirmation: Dispatch<SetStateAction<boolean>>;
    isOrderCompleted: boolean;
    setIsOrderCompleted: Dispatch<SetStateAction<boolean>>;
}

const ConfirmationContext = createContext<ConfirmationContextInterface>(
    {} as ConfirmationContextInterface
);

const useConfirmationContext = () => {
    const context = useContext(ConfirmationContext);

    if (!context) {
        throw new Error(
            "useConfirmationContext must be used within an [streamId].tsx"
        );
    }
    return context;
};

const ConfirmationProvider = ({ children }: ConfirmationProviderProps) => {
    const [isLoadingFetchPriceQuote, setIsLoadingFetchPriceQuote] =
        useState<boolean>(false);
    const [openPopup, setOpenPopup] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [popupMessage, setPopupMessage] = useState<string>("");
    const [isLoadingConfirmation, setIsLoadingConfirmation] =
        useState<boolean>(false);
    const [isOrderCompleted, setIsOrderCompleted] = useState<boolean>(false);

    const confirmationState = useMemo(
        () => ({
            isLoadingFetchPriceQuote,
            setIsLoadingFetchPriceQuote,
            openPopup,
            setOpenPopup,
            errorMessage,
            setErrorMessage,
            popupMessage,
            setPopupMessage,
            isLoadingConfirmation,
            setIsLoadingConfirmation,
            isOrderCompleted,
            setIsOrderCompleted,
        }),
        [
            isLoadingFetchPriceQuote,
            openPopup,
            errorMessage,
            popupMessage,
            isLoadingConfirmation,
            isOrderCompleted,
        ]
    );

    return (
        <ConfirmationContext.Provider value={confirmationState}>
            {children}
        </ConfirmationContext.Provider>
    );
};

export default ConfirmationProvider;
export { useConfirmationContext };
