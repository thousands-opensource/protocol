import {
    Button,
    Box,
    Text,
    Flex,
    Hide,
    useToast,
    Divider,
    Image,
} from "@chakra-ui/react";
import * as styles from "./styles";
import { LinkedAccountProvider, WildcardApiResponse } from "@repo/interfaces";
import axios from "axios";
import { useAccount, useSignMessage } from "wagmi";
import { useGlobalContext } from "@/contexts/globalContext";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";
import WCLogoGold from "@/public/images/wildcard-gold-logo.png";
import WildfileTabList from "./WildfileTabList";
import { UserMenu } from "@/components/DashboardNavigation/TopNav/_ui/UserMenu";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import {
    ColorObject,
    THOUSANDS_SERIES_NAME,
    UserServerPreferences,
} from "@/types";
import { NotificationBellPopover } from "@/components/DashboardNavigation/TopNav/_ui/Notification/Notification";
import CustomWalletConnectButton from "@/components/CustomWalletConnectButton";
import { COOKIES_USER_SERVER_PREFERENCES } from "@/utils/accountAPIUtil";
import { getCookieValue } from "@/utils/accountsUtil";
import NavigationHeader, { getServerConfig } from "./NavigationHeader";
import { getServerCodeFromPath, ServerName } from "@/utils/serverUtil";

interface WildfileNavigationProps {
    avatarThemeColor?: ColorObject;
    thousandsSeriesName?: THOUSANDS_SERIES_NAME;
    personalCredit?: number;
    isSquareCorner?: boolean;
}

enum ResponsivenessEnum {
    DESKTOP = "desktop",
    MOBILE = "mobile",
}

const WildfileNavigation = ({
    avatarThemeColor,
    thousandsSeriesName,
    personalCredit = 0,
    isSquareCorner = false,
}: WildfileNavigationProps) => {
    const { setLoggedIn, loggedIn, setLoadingSpinner } = useGlobalContext();
    const { address, isConnected } = useAccount();
    const router = useRouter();
    const toast = useToast();

    const serverCodeViaRoute = getServerCodeFromPath(router);

    // Use state to hold serverPrimaryLogoUrl
    const [serverPrimaryLogoUrl, setServerPrimaryLogoUrl] =
        useState<string>("");
    const [serverCode, setServerCode] = useState<string>("");

    const { userDB } = useWildfileUserContext();

    const accumulatedUserCredits: number =
        userDB?.accumulatedPersonalCredits ?? 0;

    // State to hold combined credits
    // @dev - Provides the banked credits by default - if on event page / personal credits is included -> provide the (ephemeral personal credits + banked credits)
    const [combinedCredits, setCombinedCredits] = useState(
        personalCredit + accumulatedUserCredits
    );

    useEffect(() => {
        const userServerPreferences: UserServerPreferences = getCookieValue(
            COOKIES_USER_SERVER_PREFERENCES
        );

        if (userServerPreferences && userServerPreferences.serverCode) {
            setServerPrimaryLogoUrl(userServerPreferences.serverPrimaryLogoUrl);
            setServerCode(userServerPreferences.serverCode);
        }
    }, [serverCodeViaRoute]);

    const serverConfig = getServerConfig(serverCodeViaRoute as ServerName);

    // accumulated personal credits + personal credits
    useEffect(() => {
        setCombinedCredits(personalCredit + accumulatedUserCredits);
    }, [personalCredit, accumulatedUserCredits]);

    /**
     * Handle logging out user via api call
     */
    const logout = async () => {
        const resp = await axios.post("/api/auth/logout");
        const logoutResp: WildcardApiResponse = resp.data;
        if (logoutResp.success) {
            setLoggedIn(false);
        }
    };

    /**
     * Handle login in user by first signing message then calling api
     */
    function login() {
        // create a message
        const nonce = `${Date.now()}${Math.floor(Math.random() * 100000)}`;
        const message = `Please sign this message to login to Wildcard and verify ownership of your account. This is READ-ONLY access and will NOT trigger any blockchain transactions or incur any fees.\nNonce: ${nonce}`;

        signLoginMessage({ message });
    }

    const { signMessage: signLoginMessage } = useSignMessage({
        onSuccess(data, variables) {
            // user signed login message, send api request to login
            callLoginApi(data, variables.message);
        },
    });

    /**
     * Handles successfully signed message to then call login api
     * @param signature - signature result from message signed
     * @param message - message signed
     */
    const callLoginApi = async (
        signature: `0x${string}`,
        message: string | Uint8Array
    ) => {
        if (!isConnected) return;
        const body = {
            provider: LinkedAccountProvider.WALLET,
            message,
            signature,
            address,
        };
        const resp = await axios.post("/api/loginWalletProvider/", body);
        const loginResp: WildcardApiResponse = resp.data;
        if (!loginResp.success) {
            toast({
                position: "top",
                variant: "solid",
                description: loginResp.err || "",
                status: "warning",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        setLoadingSpinner(true);
        router.reload();
    };

    // Login/Logout button
    const loginLogoutButton = () => {
        return (
            <Button
                sx={styles.loginLogoutButton(isConnected)}
                size={["sm", "md", "md"]}
                onClick={() => {
                    if (loggedIn) {
                        logout();
                    } else {
                        login();
                    }
                }}
            >
                {loggedIn ? "Logout" : "Login"}
            </Button>
        );
    };

    // Render tab list component
    const renderTabList = () => {
        if (router.pathname === "/userId/[userId]") {
            return <WildfileTabList avatarThemeColor={avatarThemeColor} />;
        }

        return null;
    };

    /**
     * Render Thousands series name if provided
     */
    const renderThousandsSeriesName = () => {
        if (!thousandsSeriesName) {
            return;
        }
        return (
            <>
                <Divider
                    sx={styles.thousandsSeriesDividerSX}
                    orientation="vertical"
                />
                <Flex sx={styles.thousandsSeriesImageFlexSx}>
                    <Image
                        src="/images/Thousands/thousands-wildcard-series-green.png"
                        h="30px"
                        w="fit"
                        alt="Wildcard logo"
                    />
                    <Text sx={styles.thousandsSeriesNameTextSx}>
                        {thousandsSeriesName}
                    </Text>
                </Flex>
            </>
        );
    };

    // /**
    //  * Render Season Name JSX
    //  */
    // const renderseriesNameJSX = () => {
    //     if (isLoadingSeason) {
    //         return <Spinner sx={styles.seriesNameSpinnerSx} />;
    //     }

    //     if (!season) {
    //         return;
    //     }

    //     return (
    //         <Text
    //             sx={styles.seriesNameTextSx}
    //             className={poppinsLight.className}
    //         >
    //             {season?.seriesName}
    //         </Text>
    //     );
    // };

    /**
     * Render Series Points JSX (memoized)
     */
    const renderSeriesPointsJSX = useMemo(() => {
        return null;
        /*
        return (
            <Flex flexDirection={"column"} alignItems={"center"}>
                <Flex flexDirection={"row"}>
                    <CombinedCreditsScore credits={combinedCredits} />
                </Flex>
                {renderseriesNameJSX()}
            </Flex>
        );
        */
    }, [personalCredit, userDB]);

    /**
     * Render Wallet Connect Button JSX for Navigation Bar
     * @param accountDisplayType - account status to determine if address or avatar should be displayed
     * @returns
     */
    const renderWalletConnectButtonJSX = (
        accountDisplayType: "address" | "full" | "avatar" | undefined
    ) => {
        return (
            <CustomWalletConnectButton
                accountStatus={accountDisplayType}
                showNetwork={false}
                sx={{
                    ...styles.customWalletConnectButton,
                    border: "1px solid rgba(255,255,255,1.0)",
                }}
            />
        );
    };

    /**
     * Render a main component. It is responsible for rendering the coxnnect/disconnect button, login/logout, and hamburger menu
     * @returns connect button, login/logout button, hamburger menu jsx
     */
    const renderConnectWallet = (mode: ResponsivenessEnum) => {
        const displayType =
            mode === ResponsivenessEnum.MOBILE ? "avatar" : "address";

        if (!loggedIn) {
            return (
                <Flex alignItems="center" gap="10px">
                    {renderWalletConnectButtonJSX(displayType)}
                    {/* User Menu Dropdown */}
                    {/*<NotificationBellPopover />*/}
                    <UserMenu userDB={userDB} />
                    <Flex>{renderSeriesPointsJSX}</Flex>
                </Flex>
            );
        }

        return (
            <Flex alignItems="center" gap="20px" mr={2}>
                {renderWalletConnectButtonJSX(displayType)}
                {/* User Menu Dropdown */}
                {/*false && mode !== ResponsivenessEnum.MOBILE && (
                    <NotificationBellPopover />
                )*/}
                <UserMenu userDB={userDB} />
                {/*
                <Flex>{renderSeriesPointsJSX}</Flex>
                */}
            </Flex>
        );
    };

    return (
        <Box id="WildfileNavigation" sx={styles.navigationBarSx}>
            <Flex
                sx={styles.navigationBarFlexSx(isSquareCorner)}
                top={0}
                left={0}
                right={0}
                bottom={0}
                bgGradient="none"
                bg="transparent"
                opacity={1}
                w="100%"
                borderBottom="none"
            >
                <NavigationHeader
                    serverCode={serverCodeViaRoute as string}
                    serverPrimaryLogoUrl={serverPrimaryLogoUrl}
                />

                <Flex sx={styles.hamburgerMenuFlexSx}>
                    {renderConnectWallet(ResponsivenessEnum.MOBILE)}
                </Flex>

                <Flex>
                    <Hide below="lg">
                        {renderConnectWallet(ResponsivenessEnum.DESKTOP)}
                    </Hide>
                </Flex>
            </Flex>
        </Box>
    );
};

export default React.memo(WildfileNavigation);
