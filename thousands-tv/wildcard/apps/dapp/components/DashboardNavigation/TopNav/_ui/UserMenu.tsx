import { WILDFILE_ROUTES } from "@/constants/routes";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { useInfoNotifications } from "@/hooks/useInfoNotifications";
import { IUser } from "@repo/interfaces";
import { buildServerUrl, getCookieValue } from "@/utils/accountsUtil";
import { shorten, truncateString } from "@/utils/util";
import {
    Popover,
    PopoverTrigger,
    Button,
    HStack,
    Avatar,
    Icon,
    PopoverContent,
    PopoverBody,
    Stack,
    Text,
    Divider,
    Box,
    Image,
    Spinner,
} from "@chakra-ui/react";
import axios from "axios";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AiOutlineTransaction, AiOutlineUser } from "react-icons/ai";
import { BiLogOut, BiWallet } from "react-icons/bi";
import { FiChevronDown } from "react-icons/fi";
import { MdManageAccounts, MdOutlineSecurity } from "react-icons/md";
import { IoIosStats } from "react-icons/io";
import { GiPodiumWinner } from "react-icons/gi";
import { Link } from "@chakra-ui/next-js";

import {
    THEME_COLOR_BG_PRIMARY,
    THEME_COLOR_FONT_REQUIRED,
    THEME_COLOR_SECONDARY,
} from "@/constants";
import { getUserProfilePicture } from "@/utils/userUtil";
import {
    alabasterColorObj,
    getAllowedThemeColorObjectByColorName,
} from "@/utils/wildpassUtil";
import { COOKIES_USER_SERVER_PREFERENCES } from "@/utils/accountAPIUtil";
import { useEffect, useMemo, useState } from "react";
import { getSnagLoyaltyPointsHomePageUrl } from "@/utils/environmentUtilWCA";
import CreditBalanceDisplay from "@/components/DashboardNavigation/TopNav/_ui/CreditBalanceDisplay";
import { poppinsBold } from "@/utils/themeUtil";

interface UserMenuProps {
    userDB: IUser | null;
}

/**
 * Styles for the profile (user menu) dropdown button
 */
const profileDropdownButtonSx = {
    w: "100%",
    rounded: "md",
    variant: "menu",
    display: "flex",
    justifyContent: "flex-start",
    gap: "2",
    _hover: {
        bg: "blackAlpha.400",
        _before: {
            content: '""',
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "3px",
            bg: THEME_COLOR_SECONDARY,
            height: "65%",
            alignSelf: "center",
        },
    },
};

/**
 * React component that displays the user menu.
 */
export function UserMenu({}: UserMenuProps) {
    const router = useRouter();
    const { onMessage } = useInfoNotifications();
    const { setIsLoggedIn, userDB, connectedUserDBEmail } =
        useWildfileUserContext();
    const [wcBalance, setWcBalance] = useState<number>(0);
    const [wcLoading, setWcLoading] = useState<boolean>(false);
    const [serverCode, setServerCode] = useState<string>("");
    const referralsUrl = getSnagLoyaltyPointsHomePageUrl();
    // get profile picture to user (either pfp or preferred provdier's image)
    const profPictureSrc = userDB ? getUserProfilePicture(userDB) : "";
    const userDBAvatarThemeColor = userDB?.preferences?.avatarThemeColor;
    const themeColorObj = getAllowedThemeColorObjectByColorName(
        userDBAvatarThemeColor || alabasterColorObj
    );
    const xpPerLevel = 50000;
    const safeXp = Math.max(0, userDB?.thousandsXp ?? 0);
    const level = safeXp > 0 ? Math.floor(safeXp / xpPerLevel) + 1 : 1;
    const progressWithinLevel = safeXp % xpPerLevel;
    const progressPercent = Math.min(progressWithinLevel / xpPerLevel, 1);

    useEffect(() => {
        const userServerPreferences = getCookieValue(
            COOKIES_USER_SERVER_PREFERENCES
        );

        if (userServerPreferences) {
            setServerCode(userServerPreferences.serverCode);
        }
    }, []);

    useEffect(() => {
        if (!userDB?._id) {
            setWcBalance(0);
            setWcLoading(false);
            return;
        }

        let isMounted = true;

        const loadWcBalance = async () => {
            try {
                if (isMounted) {
                    setWcLoading(true);
                }
                const response = await axios.get(
                    "/api/franchises/getUserWc"
                );
                const value =
                    response?.data?.data?.wcBalance;
                const parsed = Number(value);
                if (isMounted) {
                    setWcBalance(
                        Number.isFinite(parsed) ? parsed : 0
                    );
                }
            } catch (error) {
                console.error("Failed to load $WC balance", error);
                if (isMounted) {
                    setWcBalance(0);
                }
            } finally {
                if (isMounted) {
                    setWcLoading(false);
                }
            }
        };

        loadWcBalance();

        return () => {
            isMounted = false;
        };
    }, [userDB?._id]);

    const menuLinks = useMemo(() => {
        if (!serverCode) {
            return [];
        }

        return [
            {
                label: "General",
                color: "black.600",
                path: buildServerUrl(
                    serverCode,
                    WILDFILE_ROUTES.SERVER.WILDFILE.PROFILE.GENERAL.url
                ),
                icon: AiOutlineUser,
            },
            {
                label: "Competitor",
                color: "black.600",
                path: "/thousands/competitor/",
                icon: GiPodiumWinner,
            },
            {
                label: "Credits",
                color: "black.600",
                path: buildServerUrl(
                    serverCode,
                    WILDFILE_ROUTES.SERVER.WILDFILE.PROFILE.CREDIT_PURCHASES.url
                ),
                icon: AiOutlineTransaction,
            },
            ...(referralsUrl
                ? [
                      {
                          label: "Referrals",
                          color: "black.600",
                          path: referralsUrl,
                          icon: MdManageAccounts,
                          isExternal: true,
                      },
                  ]
                : []),
            {
                label: "Stats",
                color: "black.600",
                path: buildServerUrl(
                    serverCode,
                    WILDFILE_ROUTES.SERVER.WILDFILE.PROFILE.STATS.url
                ),
                icon: IoIosStats,
            },
            {
                label: "Web3",
                color: "black.600",
                path: buildServerUrl(
                    serverCode,
                    WILDFILE_ROUTES.SERVER.WILDFILE.PROFILE.WEB3_WALLET.url
                ),
                icon: BiWallet,
            },
            {
                label: "Security",
                color: "black.600",
                path: buildServerUrl(
                    serverCode,
                    WILDFILE_ROUTES.SERVER.WILDFILE.PROFILE.PASSWORD.url
                ),
                icon: MdOutlineSecurity,
            },
            {
                label: "Accounts",
                color: "black.600",
                path: buildServerUrl(
                    serverCode,
                    WILDFILE_ROUTES.SERVER.WILDFILE.PROFILE.CONNECTED_ACCOUNTS
                        .url
                ),
                icon: MdManageAccounts,
            },
        ];
    }, [serverCode]);

    /**
     * Display the user's connected email (truncate if necessary)
     */
    const renderProfileDisplayEmailJSX = (userDB: IUser | null) => {
        if (!userDB || !connectedUserDBEmail) {
            return null;
        }

        return (
            <>
                <Text
                    ml="5px"
                    fontSize="sm"
                    color={THEME_COLOR_SECONDARY}
                    textTransform={"lowercase"}
                >
                    {truncateString(connectedUserDBEmail.toLowerCase(), 20)}
                </Text>
                <Divider my="10px" />
            </>
        );
    };

    /**
     * Handle the logout action
     * @dev - Performs the NextAuth sign out operation and wait for it to complete
     */
    const handleLogout = async () => {
        try {
            const response = await axios.post("/api/auth/logout");
            if (response.status === 200) {
                const signOutResult = await signOut({ redirect: false });

                if (signOutResult?.url) {
                    // Navigate to the sign-out URL if provided (usually not needed when redirect: false)
                    window.location.href = signOutResult.url;
                } else {
                    router.push(WILDFILE_ROUTES.LOGIN.url);

                    setIsLoggedIn(false);
                    onMessage({
                        title: "Logged Out",
                        description: "You have successfully logged out.",
                        status: "info",
                        duration: 5000,
                        isClosable: true,
                    });
                }
            } else {
                throw new Error("Logout failed");
            }
        } catch (error) {
            console.error("Failed to log out:", error);
            onMessage({
                title: "Logout Error",
                description: "Failed to log out. Please try again.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    /**
     *  Render the sign out button
     */
    const renderSignOut = () => {
        return (
            <Button
                sx={profileDropdownButtonSx}
                variant="menu"
                leftIcon={<BiLogOut />}
                onClick={async () => {
                    handleLogout();
                }}
            >
                Logout
            </Button>
        );
    };

    /**
     * Render the menu links
     */
    const renderMenuLinks = () => {
        if (!userDB) {
            return;
        }

        return (
            <HStack>
                <Popover>
                    <PopoverTrigger>
                        <Button variant="unstyled">
                            <HStack>
                                <Avatar
                                    boxSize="26px"
                                    src={profPictureSrc}
                                    name={connectedUserDBEmail ?? ""}
                                    borderWidth="2px"
                                    borderStyle={"solid"}
                                    borderColor={themeColorObj.hexValue}
                                />
                                <Box textAlign="left" ml={1}>
                                    <Text fontSize="sm" fontWeight="bold">
                                        Level {level}
                                    </Text>
                                    <Box
                                        w="80px"
                                        h="6px"
                                        borderRadius="full"
                                        bg="rgba(255,255,255,0.2)"
                                        overflow="hidden"
                                    >
                                        <Box
                                            h="100%"
                                            borderRadius="full"
                                            bgGradient="linear(90deg, #FF5BEF, #FF0030)"
                                            width={`${progressPercent * 100}%`}
                                            transition="width 0.3s ease"
                                        />                                        
                                    </Box>
                                    <Text fontSize="xs" color="whiteAlpha.700">
                                        {Math.floor(safeXp).toLocaleString(
                                            "en-US"
                                        )}{" "}
                                        XP
                                    </Text>
                                </Box>
                                <Icon as={FiChevronDown} />
                            </HStack>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        maxW="210px"
                        mr="1px"
                        px="0"
                        borderColor={"whiteAlpha.300"}
                        borderBottomRadius="lg"
                        borderTopRadius={"0px"}
                        borderTopWidth={"0px"}
                        bg="#553067"
                        mt={"5px"}
                    >
                        <PopoverBody px="2" pb="0" p="10px">
                            {/* {renderProfileDisplayEmailJSX(userDB)} */}
                            <Box
                                mb={3}
                                px={3}
                                py={2}
                                borderRadius="md"
                                bg="whiteAlpha.200"
                            >
                                <Box
                                    className={`flex items-center gap-1 ${poppinsBold.className}`}
                                >
                                    {wcLoading ? (
                                        <Spinner size="sm" />
                                    ) : (
                                        <>
                                            <span>
                                                {Math.round(
                                                    wcBalance
                                                ).toLocaleString("en-US")}
                                            </span>
                                            <Image
                                                src="/images/Credits/wctoken.png"
                                                alt="$WC"
                                                width={5}
                                                height={5}
                                                className="w-4 h-4"
                                            />
                                        </>
                                    )}
                                </Box>
                            </Box>
                            <Box
                                mb={3}
                                px={3}
                                py={2}
                                borderRadius="md"
                                bg="whiteAlpha.200"
                            >                                
                                <CreditBalanceDisplay variant="sm" />
                            </Box>
                            <Stack
                                border="1px solid"
                                borderRadius={"lg"}
                                borderColor={THEME_COLOR_FONT_REQUIRED}
                            >
                                {menuLinks.map((link, index) =>
                                    link.isExternal ? (
                                        <Button
                                            key={index}
                                            sx={profileDropdownButtonSx}
                                            variant="menu"
                                            leftIcon={<link.icon />}
                                            onClick={() =>
                                                window.open(
                                                    link.path,
                                                    "_blank",
                                                    "noopener,noreferrer"
                                                )
                                            }
                                        >
                                            {link.label}
                                        </Button>
                                    ) : (
                                        <Link href={link.path} key={index}>
                                            <Button
                                                sx={profileDropdownButtonSx}
                                                variant="menu"
                                                leftIcon={<link.icon />}
                                            >
                                                {link.label}
                                            </Button>
                                        </Link>
                                    )
                                )}
                                {renderSignOut()}
                            </Stack>
                        </PopoverBody>
                    </PopoverContent>
                </Popover>
            </HStack>
        );
    };

    return renderMenuLinks();
}
