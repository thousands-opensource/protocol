"use client";
import {
    Box,
    Button,
    Flex,
    HStack,
    Icon,
    Heading,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Text,
    Stack,
    useColorModeValue,
} from "@chakra-ui/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import UserProfileSettings from "./_ui/profile-user";
import { WILDFILE_ROUTES } from "@/constants/routes";
import {
    TwoFactorSetup,
    TwoFactorSetupDisconnect,
    VerifyTOTPModal,
} from "./_ui/two-factor-authenitcation-settings";
import SignOutEverywhere from "./_ui/sign-out-everywehre";
import ConnectedAccounts from "./_ui/connected-accounts";
import { GetServerSideProps } from "next";
import axios from "axios";
import { ReactNode, useEffect, useState } from "react";
import Web3WalletSettings from "./_ui/web-wallet";
import PanelDescription from "./_ui/advanced-settings/_ui/panel-description";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import {
    AccountProviderType,
    EventPointTypeEnum,
    IUser,
} from "@repo/interfaces";
import { useAccount } from "wagmi";
import { FaWallet, FaTrophy, FaRocket } from "react-icons/fa";
import { FiArrowLeft } from "react-icons/fi";
import { shorten } from "@/utils/util";
import {
    buildServerUrl,
    getWalletAddressByUserDB,
    isOnlyWalletProvider,
} from "@/utils/accountsUtil";
import EmailPreferences from "./_ui/email-preference";
import { signOut } from "next-auth/react";
import { useInfoNotifications } from "@/hooks/useInfoNotifications";
import { redirectUserIfUnauthorized } from "@/utils/sessionUtil";
import {
    AuthorizedUserData,
    authorizeUser,
} from "@/utils/backend/sessionServerUtil";
import { THEME_COLOR_SECONDARY } from "@/constants";
import { isAssociatedWallet } from "@/utils/userUtil";
import { findPointsByQuery } from "@repo/schemas";
import WildcardStats from "./wildcard-stats";
import { getCurrentSeasonId } from "@/utils/environmentUtilWCA";
import { IUserStatsRepository } from "@/repositories/interfaces/iUserStatsRepository";
import { diContainer } from "@/inversify.config";
import ProfilePic from "./_ui/profilePic";
import { checkUserAuthorizedForPage } from "@/utils/profileUtil";
import { CreditPurchases } from "./_ui/credit-purchases";
import { InsightScoreRank } from "@/components/InsightScoreRank";
import ThousandsLayout from "@/layouts/ThousandsLayout";

interface ProfileProps {
    params: { tab: string };
    accountData: any;
    findUser: any;
    setFindUser: any;
    userDB: any;
    connectedUserDBProviderId: any;
    connectedUserDBEmail: any;
    serverCode: string;
    decodedToken: any;
    beamableUser: any;
    followWildcardBool: boolean;
    statsStr: string;
    reload: boolean;
}

export enum ProfileTabEnum {
    GENERAL = "GENERAL",
    CREDIT_PURCHASES = "CREDIT_PURCHASES",
    STATS = "STATS",
    EMAIL = "EMAIL",
    WEB3 = "WEB3",
    PASSWORD_SECURITY = "PASSWORD_SECURITY",
    CONNECTED_ACCOUNTS = "CONNECTED_ACCOUNTS",
}

export const accountsData = [
    {
        name: "GitHub",
        logo: "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
        connected: true,
        username: "john_doe",
    },
    {
        name: "Twitter",
        logo: "https://abs.twimg.com/icons/apple-touch-icon-192x192.png",
        connected: false,
        username: "",
    },
    {
        name: "Google",
        logo: "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png",
        connected: true,
        username: "john.doe",
    },
];

const Profile = ({
    userDB: userDBStringified,
    connectedUserDBEmail,
    connectedUserDBProviderId,
    serverCode,
    followWildcardBool,
    statsStr,
    reload,
}: ProfileProps) => {
    const router = useRouter();

    const {
        userDB,
        setUserDB,
        setConnectedUserDBProviderId,
        setConnectedUserDBEmail,
    } = useWildfileUserContext();

    const userDBParsed: IUser = userDBStringified
        ? JSON.parse(userDBStringified)
        : {};

    const stats = JSON.parse(statsStr);
    const panelBg = useColorModeValue(
        "rgba(255,255,255,0.75)",
        "rgba(255,255,255,0.14)"
    );
    const panelBorder = useColorModeValue(
        "rgba(255,255,255,0.55)",
        "rgba(255,255,255,0.25)"
    );

    const glassProps = {
        bg: panelBg,
        border: "1px solid",
        borderColor: panelBorder,
        borderRadius: "2xl",
        backdropFilter: "blur(12px)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        p: { base: 6, md: 8 },
    };

    // Use useEffect to update userDB in the global state when it changes
    useEffect(() => {
        setUserDB(userDBParsed);
        setConnectedUserDBProviderId(connectedUserDBProviderId);
        setConnectedUserDBEmail(connectedUserDBEmail);
    }, []);

    const { setIsLoggedIn } = useWildfileUserContext();

    const [showMismatchModal, setShowMismatchModal] = useState(false);
    const [followWildcard, setFollowWildcard] =
        useState<boolean>(followWildcardBool);

    const [currentTab, setCurrentTab] = useState<ProfileTabEnum | undefined>(
        ProfileTabEnum.GENERAL
    );

    const { address, isConnected } = useAccount();

    const pathname = usePathname();
    const { onMessage } = useInfoNotifications();

    useEffect(() => {
        // Filter linked accounts to find any of the type 'wallet'.
        const linkedWalletAddress = getWalletAddressByUserDB(userDB);

        if (!linkedWalletAddress) {
            return;
        }

        if (!userDB) {
            return;
        }

        // Check if there are any wallet-type accounts linked.
        const hasLinkedWallets = linkedWalletAddress?.length > 0;

        // Check if the current address matches any linked wallet addresses.
        const isWalletLinked =
            hasLinkedWallets && isAssociatedWallet(address as string, userDB);

        if (isConnected && address && hasLinkedWallets && !isWalletLinked) {
            setShowMismatchModal(true);
        }
    }, [address, isConnected, userDB]);

    const handleLogout = async () => {
        try {
            // Request to the server to clear the access token cookie
            const response = await axios.post("/api/auth/logout");

            if (response.status === 200) {
                // sign out of all states
                setIsLoggedIn(false);

                // Redirect to login page
                await signOut();
                router.push(WILDFILE_ROUTES.LOGIN.url);

                onMessage({
                    title: "Logged Out",
                    description: "You have successfully logged out.",
                    status: "info",
                    duration: 5000,
                    isClosable: true,
                });
            } else {
                throw new Error("Logout failed");
            }
        } catch (error) {
            console.error(error);
        }
    };

    interface ProfileTab {
        name: string;
        component: ReactNode;
        link: string;
        walletSupported: boolean;
        tabEnum?: ProfileTabEnum;
    }

    // Change the profile tab based on the tab enum
    const changeTab = (tab: ProfileTabEnum | undefined) => {
        if (tab === undefined) return;

        setCurrentTab(tab);
        const tabInfo = profileTabs.find((t) => t.tabEnum === tab);
        if (tabInfo) {
            router.push(tabInfo.link);
        }
    };

    const profileTabs: ProfileTab[] = [
        {
            name: "General",
            component: <UserProfileSettings />,
            link: buildServerUrl(
                serverCode,
                WILDFILE_ROUTES.SERVER.WILDFILE.PROFILE.GENERAL.url
            ),
            walletSupported: true,
            tabEnum: ProfileTabEnum.GENERAL,
        },
        {
            name: "Credits",
            component: <CreditPurchases />,
            link: buildServerUrl(
                serverCode,
                WILDFILE_ROUTES.SERVER.WILDFILE.PROFILE.CREDIT_PURCHASES.url
            ),
            walletSupported: true,
            tabEnum: ProfileTabEnum.CREDIT_PURCHASES,
        },
        {
            name: "Stats",
            component: <WildcardStats stats={stats} />,
            link: buildServerUrl(
                serverCode,
                WILDFILE_ROUTES.SERVER.WILDFILE.PROFILE.STATS.url
            ),
            walletSupported: false,
            tabEnum: ProfileTabEnum.STATS,
        },
        {
            name: "Email",
            component: <EmailPreferences />,
            link: buildServerUrl(
                serverCode,
                WILDFILE_ROUTES.SERVER.WILDFILE.PROFILE.EMAIL_PREFERENCE.url
            ),
            walletSupported: false,
            tabEnum: ProfileTabEnum.EMAIL,
        },
        {
            name: "Web3",
            component: <Web3WalletSettings changeTab={changeTab} />,
            link: buildServerUrl(
                serverCode,
                WILDFILE_ROUTES.SERVER.WILDFILE.PROFILE.WEB3_WALLET.url
            ),
            walletSupported: true,
            tabEnum: ProfileTabEnum.WEB3,
        },
        // {
        //     name: "Password & Security",
        //     component: (
        //         <Flex flexDirection={"column"} gap="10px">
        //             <PanelDescription
        //                 title="Multi-Factor Authentication"
        //                 description={<> </>}
        //             >
        //                 <Card
        //                     flex="1"
        //                     borderRadius={"lg"}
        //                     p={4}
        //                     bg="unset"
        //                     border="1px solid gray"
        //                     color="white"
        //                 >
        //                     {/* @audit - implement preferred account provider to choose when multiple emails are presented */}
        //                     {userDB?.preferredProvider ===
        //                         AccountProviderType.WALLET ||
        //                     !userDB?.preferredProvider ? (
        //                         <Text>
        //                             Account provider type not Supported for MFA
        //                         </Text>
        //                     ) : (
        //                         <></>
        //                     )}

        //                     {userDB?.authenticator?.appEnabled ? (
        //                         <Flex flexDirection={"column"} gap="10px">
        //                             <TwoFactorSetupDisconnect />
        //                         </Flex>
        //                     ) : (
        //                         <>
        //                             <TwoFactorSetup />
        //                             <VerifyTOTPModal />
        //                         </>
        //                     )}
        //                 </Card>
        //             </PanelDescription>

        //             <Divider />

        //             <PanelDescription
        //                 title="Sign Out Options"
        //                 description={<></>}
        //             >
        //                 <Card
        //                     flex="1"
        //                     borderRadius={"lg"}
        //                     p={4}
        //                     bg="unset"
        //                     border="1px solid gray"
        //                     color="white"
        //                 >
        //                     <SignOutEverywhere />
        //                 </Card>
        //             </PanelDescription>
        //         </Flex>
        //     ),
        //     link: WILDFILE_ROUTES.WILDFILE.PROFILE.PASSWORD.url,
        //     walletSupported: false,
        //     tabEnum: ProfileTabEnum.PASSWORD_SECURITY,
        // },
        {
            name: "Connected Accounts",
            component: (
                <ConnectedAccounts
                    followWildcard={followWildcard}
                    setFollowWildcard={setFollowWildcard}
                />
            ),
            link: buildServerUrl(
                serverCode,
                WILDFILE_ROUTES.SERVER.WILDFILE.PROFILE.CONNECTED_ACCOUNTS.url
            ),
            walletSupported: true,
            tabEnum: ProfileTabEnum.CONNECTED_ACCOUNTS,
        },
    ];

    // Set the current tab based on the pathname
    useEffect(() => {
        const currentTabInfo = profileTabs.find((tab) =>
            pathname.includes(tab.link)
        );
        if (currentTabInfo) {
            setCurrentTab(currentTabInfo.tabEnum);
        }
    }, [pathname]);

    const renderConnectWalletTextDisplayJSX = () => {
        return (
            <Flex flexDirection={"column"} gap="10px">
                <Flex flexDirection={"row"} alignItems={"center"}>
                    <Text fontSize="lg" color="foreground">
                        Connected Wallet:{" "}
                        <Text as="span" color={THEME_COLOR_SECONDARY}>
                            {shorten(address, { isAddress: true })}
                        </Text>
                    </Text>
                    <Icon as={FaWallet} ml={2} />{" "}
                </Flex>
            </Flex>
        );
    };

    return (
        <ThousandsLayout
            userDB={userDBParsed}
            connectedUserDBProviderId={connectedUserDBProviderId}
            connectedUserDBEmail={connectedUserDBEmail}
        >
            <Box minH="100vh" px={{ base: 4, md: 10 }} py={{ base: 10, md: 14 }}>
                <Stack spacing={8}>
                    <Button
                        as="a"
                        href={`/${serverCode}`}
                        leftIcon={<FiArrowLeft />}
                        size="md"
                        color="white"
                        variant="outline"
                        border="1px solid rgba(255,255,255,0.4)"
                        borderRadius="full"
                        alignSelf="flex-start"
                        _hover={{
                            bg: "rgba(255,255,255,0.2)",
                            transform: "translateX(-4px)",
                        }}
                        transition="all 0.2s"
                    >
                        Back to Home
                    </Button>
                    <Flex
                        direction={{ base: "column", md: "row" }}
                        align={{ base: "flex-start", md: "center" }}
                        justify="space-between"
                        gap={4}
                    >
                        <Box textAlign={{ base: "left", md: "left" }} flex="1">
                            <Heading
                                size="2xl"
                                color="white"
                                textTransform="uppercase"
                                letterSpacing="0.1em"
                            >
                                Wildfile Profile
                            </Heading>
                            <Text color="whiteAlpha.800" mt={3}>
                                Manage your account settings, security, and
                                linked services.
                            </Text>
                        </Box>
                    </Flex>
                    <Box {...glassProps} w="full">
                        <Box maxW="900px" mx="auto" w="full">
                            <Tabs
                                index={profileTabs.findIndex(
                                    (tab) => tab.tabEnum === currentTab
                                )}
                                onChange={(index) =>
                                    changeTab(profileTabs[index].tabEnum)
                                }
                            >
                                <Box overflowX="auto" overflowY="hidden">
                                    {userDB && <ProfilePic showEditIcon={true} />}
                                    {/*<InsightScoreRank 
                                        userId={userDB?._id?.toString()} 
                                        gap={2} 
                                        p={4} 
                                        bg="whiteAlpha.50" 
                                        borderRadius="md"
                                        accuracyFormat="long"
                                    />*/}
                                    <TabList
                                        px="0"
                                        pt="4"
                                        display="flex"
                                        justifyContent="space-between"
                                        color="foreground"
                                    >
                                        <HStack minW="720px">
                                            {profileTabs?.map((tab) => (
                                                <Tab
                                                    _selected={{
                                                        color: THEME_COLOR_SECONDARY,
                                                    }}
                                                    key={tab.name}
                                                    display="flex"
                                                    gap="2"
                                                    whiteSpace="nowrap"
                                                    w="full"
                                                >
                                                    {tab.name}
                                                </Tab>
                                            ))}
                                        </HStack>
                                    </TabList>
                                </Box>

                                <TabPanels>
                                    {profileTabs?.map((tab, i) => {
                                        return (
                                            <TabPanel maxW="800px" mx="auto" key={i}>
                                                {tab.component}
                                            </TabPanel>
                                        );
                                    })}
                                </TabPanels>
                            </Tabs>
                        </Box>
                    </Box>
                </Stack>
            </Box>
        </ThousandsLayout>
    );
};

export default Profile;

export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const userAuthorizedForPageResult = await checkUserAuthorizedForPage(
            context
        );

        if (!userAuthorizedForPageResult.success) {
            // redirect the user if they are not authorized
            return userAuthorizedForPageResult.data as {
                redirect: { destination: string; permanent: boolean };
            };
        }

        const authorizedUserData: AuthorizedUserData =
            userAuthorizedForPageResult.data as AuthorizedUserData;
        const userDB: IUser | null = authorizedUserData?.userDB;

        const {
            connectedUserDBProviderId,
            connectedUserDBEmail,
            wildcardAccessToken,
            serverDoc,
        } = authorizedUserData;

        const redirect = redirectUserIfUnauthorized(
            wildcardAccessToken,
            userDB,
            context
        );
        if (redirect) {
            return redirect;
        }

        const userStatsRepository: IUserStatsRepository = diContainer.get(
            "IUserStatsRepository"
        );

        const pointPromise = findPointsByQuery({
            userId: userDB?._id?.toString(),
            "eventPoints.eventId": EventPointTypeEnum.FOLLOW_WILDCARD,
        });

        const userStatsPromise = userStatsRepository.createOrUpdateUserStats(
            userDB!._id!.toString(),
            getCurrentSeasonId(),
            {}
        );

        const [point, userStats] = await Promise.all([
            pointPromise,
            userStatsPromise,
        ]);

        return {
            props: {
                userDB: JSON.stringify(userDB),
                connectedUserDBProviderId,
                connectedUserDBEmail: connectedUserDBEmail || null,
                serverCode: serverDoc?.serverCode,
                followWildcardBool: Boolean(point),
                statsStr: JSON.stringify(userStats.stats),
                reload: false,
            },
        };
    } catch (e) {
        console.log("failed to get beamable account", e);
        return {
            props: {},
        };
    }
};
