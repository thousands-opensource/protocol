import axios, {
    AxiosError,
    AxiosInstance,
    AxiosResponse,
    InternalAxiosRequestConfig,
} from "axios";
import { signOut } from "next-auth/react";
import Cookies from "js-cookie";
import { decodeToken } from "@/utils/accountsUtil";
import { COOKIES_ACCESS_TOKEN_WILDCARD } from "@/utils/accountAPIUtil";
import { WILDFILE_ROUTES } from "@/constants/routes";
import useLoadingStore from "@/store/useLoadingStore";

const AXIOS_TIMEOUT_MS = 20_000;
const EXPIRED_TOKEN_REDIRECT_MS = 5_000; // the delay to show a message (via UI overlay) before redirecting a user
const SESSION_EXPIRED_MESSAGE = "Session expired. Please sign back in...";

/**
 * @dev - Extend InternalAxiosRequestConfig to include the custom `showLoading` property. as part of the axios request config.
 */
export interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
    showLoading?: boolean;
}

/**
 * Get Wildcard access token from cookies.
 */
const getWildcardAccessTokenTokenFromCookies = (): string | null => {
    return Cookies.get(COOKIES_ACCESS_TOKEN_WILDCARD) || null;
};

/**
 * Utility: Logout the user and clear cookies.
 */
const callSignOut = async (message: string): Promise<void> => {
    console.warn(message);
    Cookies.remove(COOKIES_ACCESS_TOKEN_WILDCARD);
    await signOut({ callbackUrl: WILDFILE_ROUTES.LOGIN.url });
};

// Track active requests to manage loading state globally
let activeRequests = 0;

/**
 * Prevents subsequent API calls from being made if the token is expired.
 * provides time to display a message (e.g., "session expired...") before signing the user out.
 */
let tokenExpiredFlag = false;

/**
 * Custom Axios instance for making authenticated HTTP requests with optional loading overlay logic.
 */
const axiosAuthClientInstance: AxiosInstance = axios.create({
    baseURL: "/",
    timeout: AXIOS_TIMEOUT_MS,
    headers: {
        "Content-Type": "application/json",
    },
});

/**
 * Interceptor to attach the Authorization header and manage loading state.
 */
axiosAuthClientInstance.interceptors.request.use(
    (config: CustomAxiosRequestConfig) => {
        const { setLoading } = useLoadingStore.getState();

        // Show loading overlay only if `showLoading` flag is true and no critical flow is active
        if (config.showLoading && !tokenExpiredFlag) {
            if (activeRequests === 0) {
                setLoading(true);
            }
            activeRequests++;
        }

        const token = getWildcardAccessTokenTokenFromCookies();
        if (token) {
            const decodedToken = decodeToken(token);
            const currentTime = Math.floor(Date.now() / 1000);

            if (!decodedToken || decodedToken.exp < currentTime) {
                if (!tokenExpiredFlag) {
                    tokenExpiredFlag = true;
                    setLoading(true, SESSION_EXPIRED_MESSAGE);
                    setTimeout(async () => {
                        setLoading(false);
                        tokenExpiredFlag = false;
                        await callSignOut(SESSION_EXPIRED_MESSAGE);
                    }, EXPIRED_TOKEN_REDIRECT_MS);
                }
                return Promise.reject(
                    new AxiosError("Token expired. User logged out.")
                );
            }

            // Attach token to the headers
            config.headers = {
                ...config.headers,
                Authorization: `Bearer ${token}`,
            } as any;
        }
        return config;
    },
    (error: AxiosError) => {
        const { setLoading } = useLoadingStore.getState();
        if (!tokenExpiredFlag) {
            setLoading(false);
        }
        return Promise.reject(error);
    }
);

/**
 * Interceptor to manage loading state and handle errors.
 */
axiosAuthClientInstance.interceptors.response.use(
    (response: AxiosResponse) => {
        const { setLoading } = useLoadingStore.getState();
        const config = response.config as CustomAxiosRequestConfig;

        // Decrement active request count and hide loading if no active requests
        if (config.showLoading && !tokenExpiredFlag) {
            activeRequests--;
            if (activeRequests === 0) {
                setLoading(false);
            }
        }

        return response;
    },
    async (error) => {
        const { setLoading } = useLoadingStore.getState();
        const config = error.config as CustomAxiosRequestConfig;

        // Decrement active request count and hide loading if no active requests
        if (config?.showLoading && !tokenExpiredFlag) {
            activeRequests--;
            if (activeRequests === 0) {
                setLoading(false);
            }
        }

        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            if (!tokenExpiredFlag) {
                tokenExpiredFlag = true;
                setLoading(true, SESSION_EXPIRED_MESSAGE);
                setTimeout(async () => {
                    setLoading(false);
                    tokenExpiredFlag = false;
                    await callSignOut(SESSION_EXPIRED_MESSAGE);
                }, EXPIRED_TOKEN_REDIRECT_MS);
            }
            return Promise.reject(error);
        }

        const errMsg = error.response?.data?.message || error.message;
        console.error(
            "API Error:",
            JSON.stringify(
                {
                    status: error.response?.status,
                    message: errMsg,
                    url: error.config?.url,
                    method: error.config?.method,
                },
                null,
                2
            )
        );

        return Promise.reject(error);
    }
);

export default axiosAuthClientInstance;
