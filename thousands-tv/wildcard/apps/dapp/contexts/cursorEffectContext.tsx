import React, {
    createContext,
    useState,
    useContext,
    ReactNode,
    SetStateAction,
    Dispatch,
} from "react";

interface CursorEffectContextType {
    isCursorEffect: boolean;
    setIsCursorEffect: (isEffect: boolean) => void;
    isBgChanged: boolean;
    setIsBgChanged: Dispatch<SetStateAction<boolean>>;
}

const CursorEffectContext = createContext<CursorEffectContextType | undefined>(
    undefined
);

export const CursorEffectProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const [isCursorEffect, setIsCursorEffect] = useState(false);
    const [isBgChanged, setIsBgChanged] = useState<boolean>(false);

    return (
        <CursorEffectContext.Provider
            value={{
                isCursorEffect,
                setIsCursorEffect,
                isBgChanged,
                setIsBgChanged,
            }}
        >
            {children}
        </CursorEffectContext.Provider>
    );
};

export const useCursorEffect = () => {
    const context = useContext(CursorEffectContext);
    if (context === undefined) {
        throw new Error(
            "useCursorEffect must be used within a CursorEffectProvider"
        );
    }
    return context;
};
