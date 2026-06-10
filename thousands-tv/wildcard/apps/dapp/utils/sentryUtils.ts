/**
 * Utility functions for Sentry error filtering and handling
 */

type AxiosErrorLike = {
    isAxiosError?: boolean;
    message?: string;
    code?: string;
    response?: {
        status: number;
    };
};

/**
 * List of errors to ignore in Sentry reporting
 * These are common benign errors that don't indicate application issues
 */
export const SENTRY_IGNORED_ERRORS = [
    // Browser/environment noise
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications.",
    "Failed to fetch",
    "NetworkError",
    "AbortError",
    "BodyStreamBuffer was aborted",
    "The user aborted a request",
    "Request aborted",
    "Error checking Cross-Origin-Opener-Policy",
    "The video element does not support the Picture-in-Picture mode.",

    // Routing noise
    "Route Cancelled",
    "Route did not complete loading",

    // Wallet and WebSocket noise
    "UserRejectedRequestError",
    "User denied transaction signature",
    "WebSocket connection failed for host: wss://relay.walletconnect.org",
    "WebSocket connection failed for host: wss://relay.walletconnect.com",
    "Socket stalled when trying to connect to wss://relay.walletconnect.org",
    "Socket stalled when trying to connect to wss://relay.walletconnect.com",
    "No matching key. session topic doesn't exist",
    "Connection request reset. Please try again.",
    "Failed to fetch balance for wallet",

    // Extension/External service noise
    "Extension context invalidated.",
    "MetaMask: Received invalid isUnlocked parameter.",
    "Method not found",

    // Sentry capturing non-error promises
    "Non-Error promise rejection captured with value: null",
    "Non-Error promise rejection captured with value: 404",

    // Axios badly formatted logs
    "API Error: [object Object]",

    // JavaScript/runtime benign errors
    "Cannot destructure property 'register' of 'undefined'",
    "Loading initial props cancelled",
    "Load failed",

    // Environment warnings
    "ETH_RPC_PROVIDER environment variable not set",
    "RPC_PROVIDER environment variable not set",

    // Web3 / RPC / ABI noise
    "Cannot decode zero data", // AbiDecodingZeroDataError - bug reported to thirdweb Team

    // WalletConnect subscription logs
    "Restore will override",

    "IOST is not defined",
    "Cannot set property ethereum of #<Window> which has only a getter",
    "Failed to execute 'transaction' on 'IDBDatabase': The database connection is closing",
    "Failed to execute 'requestPictureInPicture' on 'HTMLVideoElement': Metadata for the video element are not loaded yet",
    "Failed to switch to chain", // wallet_switchEthereumChain
    "Provider already initialized\\.",
    "'defineProperty' on proxy: trap returned falsish for property 'request'",
    "Clover: Disconnected from Clover background. Page reload required",
];

/**
 * Determines whether an Axios error should be reported to Sentry
 * Returns true if not an Axios error
 *
 * @param error - The error object to evaluate
 * @returns boolean - true if the error should be reported, false otherwise
 */
export function shouldReportAxiosError(error: unknown): boolean {
    // Check if the error is an Axios error
    if (!error || typeof error !== "object" || !("isAxiosError" in error)) {
        return true;
    }

    const axiosError = error as AxiosErrorLike;

    // Network errors (typically user navigation or connection issues)
    if (axiosError.message === "Network Error") {
        return false; // Don't report network errors
    }

    // Cancelled requests (user navigated away)
    if (
        axiosError.code === "ECONNABORTED" ||
        (axiosError.message && axiosError.message.includes("aborted"))
    ) {
        return false; // Don't report cancelled requests
    }

    // Handle common client errors that aren't bugs
    if (axiosError.response) {
        const status = axiosError.response.status;

        // Filter out auth errors (401, 403) and validation errors (400)
        if (status === 401 || status === 403 || status === 400) {
            return false;
        }

        // Filter out not found errors
        if (status === 404) {
            return false;
        }
    }

    // Report all other Axios errors (including server errors 500+)
    return true;
}
