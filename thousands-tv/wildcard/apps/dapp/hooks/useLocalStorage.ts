import { CHANNEL_TYPES, ORIENTATION } from "@/utils/userSettings";
import { useState, useEffect } from "react";

const useLocalStorage = (
    key: string,
    defaultValue:
        | string
        | boolean
        | undefined
        | number
        | CHANNEL_TYPES
        | ORIENTATION,
    saveSettings = false
) => {
    const [value, setValue] = useState(() => {
        let currentValue;

        try {
            currentValue = JSON.parse(
                localStorage.getItem(key) || String(defaultValue)
            );
        } catch (error) {
            currentValue = defaultValue;
        }

        return currentValue;
    });

    useEffect(() => {
        if (saveSettings || key === "rememberSettings")
            localStorage.setItem(key, JSON.stringify(value));
    }, [value, key, saveSettings]);

    return [value, setValue];
};

export default useLocalStorage;
