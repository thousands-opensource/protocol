import React, {
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";
import { Flex, Box, useToast, useColorModeValue } from "@chakra-ui/react";
import {
    getAllowedThemeColorObjectByColorName,
    alabasterColorObj,
} from "@/utils/wildpassUtil";
import { ColorObject, UserServerPreferences } from "@/types";
import { CURRENT_SERIES_NAME, THEME_COLOR_BG_PRIMARY } from "@/constants";
import { useRouter } from "next/router";
import { getCookieValue, mapErrorToMessage } from "@/utils/accountsUtil";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import ProfileContext from "@/features/Wildfile/WildfileContext";
import { AvatarBackgroundGlow } from "@/features/Wildfile/WildFileProfile/Main/AvatarImage";
import { avatarBackgroundGlowWrapperSx } from "@/features/Wildfile/WildFileProfile/styles";
import WildfileNavigation from "@/features/Wildfile/WildFileProfile/WildfileNavigation";
import { motion } from "framer-motion";
import { COOKIES_USER_SERVER_PREFERENCES } from "@/utils/accountAPIUtil";
import { getServerCodeFromPath } from "@/utils/serverUtil";

interface ThousandsLayoutProps {
    children: ReactNode;
    userDB?: any;
    connectedUserDBProviderId: string;
    connectedUserDBEmail: string | null;
}

//motion causes needless rerenders if inside a component
const MotionBox = motion(Box);

const ThousandsLayout = ({
    children,
    userDB,
    connectedUserDBProviderId,
    connectedUserDBEmail,
}: ThousandsLayoutProps) => {
    const toast = useToast();
    const router = useRouter();
    const { pageOwnerUser } = useContext(ProfileContext);
    const {
        setUserDB,
        setIsLoggedIn,
        setConnectedUserDBProviderId,
        setConnectedUserDBEmail,
    } = useWildfileUserContext();
    const [serverPrimaryLogoUrl, setServerPrimaryLogoUrl] =
        useState<string>("");
    const [serverCode, setServerCode] = useState<string>("");

    const [selectedServerListing, setSelectedAsset] = useState<string | null>(
        serverCode
    );

    useEffect(() => {
        const serverCode = getServerCodeFromPath(router);
        if (serverCode) {
            setSelectedAsset(serverCode);
        }
    }, [router.asPath]);

    useEffect(() => {
        if (userDB) {
            setUserDB(userDB);
            setConnectedUserDBProviderId(connectedUserDBProviderId);
            if (connectedUserDBEmail) {
                setConnectedUserDBEmail(connectedUserDBEmail);
            }
        }
    }, [
        userDB,
        connectedUserDBProviderId,
        connectedUserDBEmail,
        setUserDB,
        setConnectedUserDBProviderId,
        setConnectedUserDBEmail,
    ]);

    useEffect(() => {
        const userServerPreferences: UserServerPreferences = getCookieValue(
            COOKIES_USER_SERVER_PREFERENCES
        );

        if (userServerPreferences && userServerPreferences.serverCode) {
            setServerPrimaryLogoUrl(userServerPreferences.serverPrimaryLogoUrl);
            setServerCode(userServerPreferences.serverCode);
        }
    }, []);

    useEffect(() => {
        const errorMsg = router.query.error;
        if (errorMsg) {
            toast({
                title: "Something went wrong:",
                description: mapErrorToMessage(errorMsg),
                status: "error",
                duration: 9000,
                isClosable: true,
                position: "top",
            });
        }
    }, [router.query.error, toast]);

    const themeColorObj = getAllowedThemeColorObjectByColorName(
        pageOwnerUser?.preferences?.avatarThemeColor || alabasterColorObj
    );

    const [avatarThemeColor, setAvatarThemeColor] =
        useState<ColorObject>(themeColorObj);

    useEffect(() => {
        if (!pageOwnerUser) {
            return;
        }
        const avatarThemeColorObj = getAllowedThemeColorObjectByColorName(
            pageOwnerUser?.preferences?.avatarThemeColor
        );

        if (!avatarThemeColorObj) {
            return;
        }

        setAvatarThemeColor(avatarThemeColorObj);
    }, [pageOwnerUser]);

    const renderServerNavigationJSX = () => {
        return (
            <Flex pt="0" height="100vh" overflow="hidden">
                <MotionBox
                    flex={1}
                    position="relative"
                    zIndex={2}
                    overflow="auto"
                    height={{ base: "calc(100vh - 62px)", md: "calc(100vh - 62px)" }}
                    mt={{ base: "62px", md: "62px" }}
                >
                    <Box pl={4} pr={4}>{children}</Box>
                </MotionBox>
            </Flex>
        );
    };

    const renderAvatarBackgroundOverlay = () => {
        return (
            <Box sx={avatarBackgroundGlowWrapperSx}>
                {/*<AvatarBackgroundGlow avatarThemeColor={avatarThemeColor} />*/}
            </Box>
        );
    };

    const navBg = useColorModeValue(
        "rgba(255,255,255,0.75)",
        "rgba(255,255,255,0.14)"
    );
    const navBorder = useColorModeValue(
        "rgba(255,255,255,0.55)",
        "rgba(255,255,255,0.25)"
    );

    return (
        <Flex
            direction="column"
            minH="100vh"
            maxH="100vh"
            bg={THEME_COLOR_BG_PRIMARY}
            backgroundImage={
                "linear-gradient(135deg, rgba(255, 0, 48, 0.9), rgba(43, 9, 81, 0.9) 70%, rgba(43, 9, 81, 0.9) 100%, rgba(43, 9, 81, 0.9)), url(/images/UserDashboard/dot_pattern_destop.svg)"
            }
            backgroundRepeat="no-repeat"
            backgroundPosition="top left"
            backgroundSize="100% 100%, 2100px auto"
            position="relative"
            overflow="hidden"
        >
            {/* Top Navigation Bar */}
            <Box
                position="fixed"
                top={0}
                left={0}
                right={0}
                zIndex={1000}
                bg={navBg}
                borderBottom="1px solid"
                borderColor={navBorder}
                backdropFilter="blur(12px)"
                boxShadow="0 20px 60px rgba(0,0,0,0.25)"
            >
                <WildfileNavigation
                    avatarThemeColor={avatarThemeColor}
                    thousandsSeriesName={CURRENT_SERIES_NAME}
                />
            </Box>

            {/* Main Content Area with Server Navigation */}
            {renderServerNavigationJSX()}

            {/* Background Overlay */}
            <Box
                position="fixed"
                top={0}
                left={0}
                right={0}
                bottom={0}
                zIndex={1}
                pointerEvents="none"
            >
                {renderAvatarBackgroundOverlay()}
            </Box>
        </Flex>
    );
};

export default ThousandsLayout;
