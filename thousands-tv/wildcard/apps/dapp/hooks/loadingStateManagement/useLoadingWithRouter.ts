import { useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import useLoadingStore from "@/store/useLoadingStore";

/**
 * Use loading with router
 * @dev - used to show loading spinner when router is in the middle of pushing to the redirect page
 * Automatically resets the loading state when the route change is complete
 */
const useLoadingWithRouter = (autoReset: boolean = true) => {
    const router = useRouter();
    const { setLoading } = useLoadingStore();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const navigationStartTime = useRef<number | null>(null);

    const clearLoadingState = useCallback(() => {
        setLoading(false);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, [setLoading]);

    useEffect(() => {
        if (!autoReset) return;

        const handleStart = () => {
            navigationStartTime.current = Date.now();
            setLoading(true);
        };

        /**
         * Handle the completion of a route change.
         */
        const handleComplete = async () => {
            await new Promise((resolve) => {
                if ("requestIdleCallback" in window) {
                    window.requestIdleCallback(resolve);
                } else {
                    setTimeout(resolve, 0);
                }
            });

            // adds a minimum delay to prevent flickering between pages (during fast navigation)
            const navigationTime = navigationStartTime.current
                ? Date.now() - navigationStartTime.current
                : 0;
            if (navigationTime < 100) {
                await new Promise((resolve) =>
                    setTimeout(resolve, 100 - navigationTime)
                );
            }

            clearLoadingState();
            navigationStartTime.current = null;
        };

        const handleError = (err: Error) => {
            console.error("Navigation error:", err);
            clearLoadingState();
            navigationStartTime.current = null;
        };

        // Listen to Next.js router events
        router.events.on("routeChangeStart", handleStart);
        router.events.on("routeChangeComplete", handleComplete);
        router.events.on("routeChangeError", handleError);

        const handleVisibilityChange = () => {
            if (!document.hidden && router.isReady) {
                handleComplete();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            router.events.off("routeChangeStart", handleStart);
            router.events.off("routeChangeComplete", handleComplete);
            router.events.off("routeChangeError", handleError);
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );

            clearLoadingState();
        };
    }, [router, clearLoadingState, setLoading, autoReset]);

    /**
     * Start loading state and shoe the global loading spinner
     */
    const startLoading = useCallback(
        (message: string = "Loading...") => {
            setLoading(true, message);
            navigationStartTime.current = Date.now();
        },
        [setLoading]
    );

    const stopLoading = useCallback(() => {
        clearLoadingState();
        navigationStartTime.current = null;
    }, [clearLoadingState]);

    return { startLoading, stopLoading };
};

export default useLoadingWithRouter;
