import React from "react";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import useLoadingStore from "@/store/useLoadingStore";

/**
 * Global loading overlay component.
 */
export const GlobalLoadingOverlay = () => {
    const { isLoading, loadingMessage } = useLoadingStore();

    return isLoading ? <LoadingOverlay message={loadingMessage} /> : null;
};
