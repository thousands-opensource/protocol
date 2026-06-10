import { useState, useEffect } from "react";
import { Box, useColorModeValue } from "@chakra-ui/react";
import { GlobalContext } from "../contexts/globalContext";
import {
    BACKGROUND_COLOR_WHITE,
    THEME_COLOR_YELLOW,
} from "@/constants/constants";
import axios from "axios";
import { useAccount } from "wagmi";
import Backdrop from "@/components/Backdrop";
import { useRouter } from "next/router";
import { getWhitelistedUrlsFromAuthorization } from "@/utils/routeUtil";

interface LayoutProps {
    children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
    const [loadingSpinner, setLoadingSpinner] = useState<boolean>(false);
    const [loggedInStatusInitialized, setloggedInStatusInitialized] =
        useState(false);
    const [loggedIn, setLoggedIn] = useState<boolean | undefined>();
    const { address } = useAccount();
    const router = useRouter();

    // Gets the array of whitelisted pages that do not require authorization to view
    const whitelistPages = getWhitelistedUrlsFromAuthorization();

    useEffect(() => {
        if (whitelistPages.includes(router.pathname)) {
            return;
        }

        // @dev - validate user login status before rendering the page
        const validateLoginStatus = async () => {
            try {
                if (!address) {
                    return;
                }

                // only when a valid
                const resp = await axios.post("/api/validateUserLogin/", {
                    address,
                });
                const isLoggedInResp = resp.data;

                if (!isLoggedInResp.success) {
                    // If not logged in, redirect to the login page
                    router.push("/login");
                    return;
                }

                setLoggedIn(isLoggedInResp.success);
            } catch (error: any) {
                console.error(
                    "Failed to validate login:",
                    error?.message || "User not logged in"
                );
            }
        };

        if (address) {
            validateLoginStatus();
        }
    }, [address, router, setLoggedIn]);

    // set state to flag that loggedIn status has been initialized
    useEffect(() => {
        if (loggedIn != undefined && !loggedInStatusInitialized) {
            setloggedInStatusInitialized(true);
        }
    }, [loggedIn]);

    /**
     * Set the context with the variable names we want here
     * @returns - object of global context to be passed around
     */
    function setGlobalContext() {
        return {
            loadingSpinner: loadingSpinner,
            setLoadingSpinner: setLoadingSpinner,
            loggedIn,
            setLoggedIn,
            loggedInStatusInitialized,
        };
    }

    return (
        <GlobalContext.Provider value={setGlobalContext()}>
            <Box
                display="flex"
                flexDir="column"
                bgColor={BACKGROUND_COLOR_WHITE}
            >
                {/* <NavBanner /> */}
                <Backdrop
                    isOpen={loadingSpinner}
                    onClose={() => setLoadingSpinner(false)}
                />
                <Box
                    bgRepeat="no-repeat"
                    bgColor={BACKGROUND_COLOR_WHITE}
                    borderColor={useColorModeValue(
                        "gray.100",
                        THEME_COLOR_YELLOW
                    )}
                    minHeight="100vh"
                >
                    {children}
                    {/* Show Connected/ Supported Network Info */}
                </Box>
            </Box>
        </GlobalContext.Provider>
    );
};
export default Layout;
