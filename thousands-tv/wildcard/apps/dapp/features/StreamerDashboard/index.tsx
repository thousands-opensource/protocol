import { BuyCreditsDrawer } from "@/components/BuyCreditsDrawer";
import { WILDFILE_ROUTES } from "@/constants/routes";
import { useGlobalContext } from "@/contexts/globalContext";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { useInfoNotifications } from "@/hooks/useInfoNotifications";
import {
    CreditPurchaseType,
    useBuyCreditsStore,
} from "@/store/useBuyCreditsStore";
import {
    Text,
    Box,
    Flex,
    useColorModeValue,
    Button,
    useBreakpointValue,
    useDisclosure,
    useToast,
    Icon,
    Input,
} from "@chakra-ui/react";
import axios from "axios";
import { signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAccount, useNetwork, useSignMessage } from "wagmi";
import { UserRole, WildcardApiResponse } from "@repo/interfaces";
import ProfilePic from "@/pages/[serverCode]/wildfile/profile/[tab]/_ui/profilePic";
import axiosAuthClientInstance from "@/lib/axiosAuthClientInstance";
import { CheckIcon } from "@chakra-ui/icons";
import { THEME_COLOR_CLOUD_GREY } from "@/constants/constants";
import StreamerPayoutComponent from "@/components/StreamerPayoutComponent";

const StreamerDashboard = () => {
    const [showModal, setShowModal] = useState<boolean>(false);

    const cardBg = useColorModeValue("white", "purple.800");
    const cardHover = useColorModeValue("gray.100", "gray.700");
    const borderColor = useColorModeValue("purple.200", "purple.600");

    const router = useRouter();
    const { onMessage } = useInfoNotifications();
    const {
        setBuyCreditsPopupOpen,
        setPurchaseType,
        sku,
        xSollaAccessToken,
        setXSollaAccessToken,
        setSku,
    } = useBuyCreditsStore();
    const { setLoadingSpinner } = useGlobalContext();
    const { userDB, setUserDB, setIsLoggedIn } = useWildfileUserContext();
    const isLinked: boolean = Boolean(userDB?.walletProvider?.address);

    const { address, isConnected } = useAccount();
    const [linkedWallet, setLinkedWallet] = useState<boolean>(
        Boolean(userDB?.walletProvider?.address)
    );
    const [isLoggingInWallet, setIsLoggingInWallet] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>("");
    const { chain } = useNetwork();
    const isMobile = useBreakpointValue({
        base: true,
        md: true,
        lg: false,
    });

    const linkWalletDisclosure = useDisclosure();
    const [isLinkingWallet, setIsLinkingWallet] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [steamId, setSteamId] = useState<string>("");
    const toast = useToast();

    const openModal = async () => {
        setLoadingSpinner(true);
        setShowModal(true);
        setLoadingSpinner(false);
    };

    const closeModal = () => {
        setShowModal(false);
    };

    const { signMessage: signInWithWalletMessage, reset: resetSignMessage } =
        useSignMessage({
            onSuccess: (data: any, variables: any) => {
                setLoadingMessage("Logging in...");
                callLinkWalletApi(data, variables.message);
            },
            onError: (error) => {
                setIsLoggingInWallet(false);

                if (
                    error.message.includes("User rejected") ||
                    error.message.includes("User denied")
                ) {
                    onMessage({
                        title: "Action needed",
                        description:
                            "To continue, please approve the sign-in request in your wallet",
                        status: "warning",
                    });
                    return;
                }

                onMessage({
                    title: "Unable to sign in",
                    description:
                        "Something went wrong with your wallet connection. Please try again",
                    status: "error",
                });
            },
        });

    const callLinkWalletApi = async (
        signature: string,
        message: string
    ): Promise<void> => {
        if (!address) return;

        const body = {
            wildcardSessionTokenParams: {
                signature,
                message,
                address,
                userDBId: userDB?._id?.toString(),
            },
        };
        console.log(body);
        const resp = await axios.post("/api/auth/wildcard/link-wallet", body);
        const linkResponse: WildcardApiResponse = resp.data;

        if (!linkResponse.success) {
            onMessage({
                description: linkResponse.err,
                status: "error",
            });
        } else {
            onMessage({
                description: `Successfully linked wallet ${address}`,
                status: "success",
            });

            setUserDB(linkResponse?.data?.updatedUser);
            setLinkedWallet(true);
            setIsLoggingInWallet(false);
        }
    };

    const handleLogin = async () => {
        if (!isConnected) return;

        try {
            setIsLoggingInWallet(true);
            setLoadingMessage(
                isMobile
                    ? "Sign message to login... You may need to switch your wallet app."
                    : "Sign message to login..."
            );
            resetSignMessage();

            const nonce = `${Date.now()}${Math.floor(Math.random() * 100000)}`;
            const message = `I am publicly revealing that this wallet is linked to my Thousands account. \nNonce: ${nonce}`;

            await signInWithWalletMessage({ message });
        } catch (error) {
            setIsLoggingInWallet(false);
            setLoadingMessage("");
            console.error("Wallet connection error:", error);
            onMessage({
                title: "Wallet connection",
                description:
                    "Unable to connect to your wallet. Please check if it's unlocked and try again",
                status: "error",
            });
        }
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
                borderRadius={6}
                border="1px solid"
                alignItems="center"
                justifyContent="center"
                borderColor={borderColor}
                onClick={async () => {
                    handleLogout();
                }}
            >
                Logout
            </Button>
        );
    };

    useEffect(() => {
        const loadXsollaWidget = (accessToken: string) => {
            if (!accessToken) {
                return;
            }

            const script = document.createElement("script");
            script.src =
                "https://cdn.xsolla.net/payments-bucket-prod/embed/1.5.0/widget.min.js";
            script.async = true;
            script.onload = () => {
                if (window) {
                    // window.XPayStationWidget?.init({ access_token: accessToken });
                    const options = {
                        access_token: accessToken,
                        lightbox: {
                            width: "800px",
                            height: "600px",
                            overlayOpacity: 0.6,
                            overlayBackground: "#000000",
                            closeByClick: true,
                            closeByKeyboard: true,
                        },
                        sandbox: true, // Use sandbox for testing
                    };
                    window.XPayStationWidget?.init(options);
                    window.XPayStationWidget?.open();
                    // Remove the purchase credit popup
                    setBuyCreditsPopupOpen(false);
                }
            };
            document.head.appendChild(script);
        };

        loadXsollaWidget(xSollaAccessToken);
    }, [xSollaAccessToken]);

    const assignStreamerRole = async () => {
        try {
            setIsLoading(true);
            if (userDB?.roles.includes(UserRole.STREAMER)) {
                toast({
                    description: "User has streamer role.",
                    status: "info",
                    duration: 3000,
                    position: "top",
                });
                return;
            }

            const { data }: { data: WildcardApiResponse } =
                await axiosAuthClientInstance.post("/api/addRole", {
                    role: UserRole.STREAMER,
                });

            if (!data.success) {
                const msg = "Unable to assign streamer role";
                toast({
                    description: msg,
                    status: "error",
                    duration: 3000,
                    position: "top",
                });
                return;
            }

            setUserDB(data.data);
            toast({
                description: "Successfully assign stream role",
                status: "success",
                duration: 3000,
                position: "top",
            });
            return;
        } catch (e: any) {
            const msg = "Error - failed to assign streamer role";
            toast({
                description: msg,
                status: "error",
                duration: 3000,
                position: "top",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // const fetchXSollaAccessToken = async () => {
    //     try {
    //         const body = {
    //             userId: userDB?._id?.toString(),
    //             userName: userDB?.twitchProvider?.name,
    //             userEmail: userDB?.twitchProvider?.email,
    //             sku: sku,
    //         };
    //         const response = await waxios.post(
    //             "/api/xsolla/payment-token",
    //             body
    //         );

    //         if (!response.data) {
    //             return;
    //         }

    //         if (!response.data.success) {
    //             return;
    //         }

    //         setXSollaAccessToken(response.data.token);
    //     } catch (e: any) {
    //         console.error("Failed to fetch payment token", e);
    //         setSku("");
    //     }
    // };

    const handlePickPaymentType = (paymentType: CreditPurchaseType) => {
        setBuyCreditsPopupOpen(true);
        setPurchaseType(paymentType);
    };

    const [steps, setSteps] = useState<{
        streamRole: boolean;
        linkSteam: boolean;
    }>({ streamRole: false, linkSteam: false });

    // Simple state change for basic checklist
    useEffect(() => {
        if (userDB?.roles.includes(UserRole.STREAMER)) {
            setSteps((prev) => ({ ...prev, streamRole: true }));
        }
        if (userDB?.beamableProvider?.id) {
            setSteps((prev) => ({ ...prev, linkSteam: true }));
        }
    }, [userDB]);

    const renderCirculStep = (stepNum: number, stepIsCompleted: boolean) => {
        if (stepIsCompleted) {
            return <Icon as={CheckIcon} fontSize="22px" color="green" />;
        }

        return (
            <Text
                fontSize={"xl"}
                sx={{
                    borderRadius: "full",
                }}
            >
                {stepNum}
            </Text>
        );
    };

    const renderChecklist = () => {
        return (
            <Flex flexDirection={"column"} gap={4}>
                <Flex>
                    <Flex
                        flexDirection={"row"}
                        alignItems={"center"}
                        width={"205px"}
                        gap={4}
                        color={
                            steps.streamRole ? THEME_COLOR_CLOUD_GREY : "white"
                        }
                    >
                        {renderCirculStep(1, steps.streamRole)}
                        <Text fontSize={"2xl"}>Sign up</Text>
                    </Flex>
                    {!userDB?.roles.includes(UserRole.STREAMER) ? (
                        <Button
                            flexDirection="column-reverse"
                            p={4}
                            textAlign="center"
                            borderRadius={6}
                            border="1px solid"
                            h="45px"
                            gap={1}
                            alignItems="center"
                            justifyContent="center"
                            cursor="pointer"
                            background="linear-gradient(to right, #2D0F4F, #2D0F4F)"
                            borderColor={borderColor}
                            onClick={assignStreamerRole}
                            zIndex={5}
                            isLoading={isLoading}
                            w="100%"
                        >
                            <Text fontSize="md">Stream Wildcard on Twitch</Text>
                        </Button>
                    ) : (
                        <Flex
                            flexDirection="column-reverse"
                            p={4}
                            textAlign="center"
                            h="45px"
                            gap={1}
                            alignItems="center"
                            justifyContent="center"
                            w="100%"
                        >
                            <Text fontSize="md">
                                You are signed-up to stream on Twitch.
                            </Text>
                        </Flex>
                    )}
                </Flex>
                <Flex>
                    <Flex
                        flexDirection={"row"}
                        alignItems={"center"}
                        width={"205px"}
                        gap={4}
                        color={
                            steps.linkSteam ? THEME_COLOR_CLOUD_GREY : "white"
                        }
                    >
                        {renderCirculStep(2, steps.linkSteam)}
                        <Text fontSize={"2xl"}>Link Steam</Text>
                    </Flex>
                    <Flex>
                        {!userDB?.beamableProvider?.id ? (
                            <Flex
                                direction="column"
                                gap={2}
                                w="100%"
                                p={4}
                                border="1px solid"
                                borderColor={borderColor}
                                borderRadius={6}
                            >
                                <Input
                                    zIndex={5}
                                    placeholder="Enter Steam ID"
                                    value={steamId}
                                    onChange={(e) => setSteamId(e.target.value)}
                                />
                                <Button
                                    onClick={handleLinkBeamableProvider}
                                    zIndex={5}
                                    isDisabled={!steamId}
                                >
                                    Save
                                </Button>
                            </Flex>
                        ) : (
                            <Flex
                                flexDirection="column-reverse"
                                p={4}
                                textAlign="center"
                                h="45px"
                                gap={1}
                                alignItems="center"
                                justifyContent="center"
                                w="100%"
                            >
                                <Text fontSize="md">
                                    You have linked your steam.
                                </Text>
                            </Flex>
                        )}
                    </Flex>
                </Flex>
            </Flex>
        );
    };

    const handleLinkBeamableProvider = async () => {
        if (!steamId) {
            return;
        }

        try {
            const { data }: { data: WildcardApiResponse } = await axios.post(
                `/api/storeBeamableProvider`,
                {
                    steamId,
                }
            );

            if (!data.success) {
                toast({
                    description: "Failed to store steam data",
                    status: "error",
                    duration: 3000,
                    position: "top",
                });
                return;
            }

            setUserDB(data.data);
        } catch (e: any) {
            toast({
                description: "Error storing steam data",
                status: "error",
                duration: 3000,
                position: "top",
            });
        } finally {
            setSteamId("");
        }
    };

    return (
        <Box
            p={8}
            minH="inherit"
            position="relative"
            backgroundImage={
                "linear-gradient(135deg, rgba(182, 5, 157, 0.9), rgba(43, 9, 81, 0.9)  45%, rgba(43, 9, 81, 0.9) 55%, rgba(255, 0, 48, 0.9)), url(/images/UserDashboard/dot_pattern_destop.svg)"
            }
            backgroundRepeat={"no-repeat"}
            backgroundPosition={"top left"}
            backgroundSize={"cover"}
        >
            <Flex flexDirection={"column"} alignItems={"center"} zIndex={5}>
                <Flex
                    flexDirection={"column"}
                    gap={4}
                    minW={["320px", "480px", "768px"]}
                >
                    <Flex
                        flexDirection={"column"}
                        alignItems={"center"}
                        justifyContent={"center"}
                    >
                        {userDB && <ProfilePic showEditIcon={false} />}
                        <Text
                            fontSize={"3xl"}
                            marginTop={"-30px"}
                            casing={"uppercase"}
                        >
                            {userDB?.preferences?.displayName}
                        </Text>
                    </Flex>
                    <Flex gap={4} mb={0} flexWrap="wrap" position="relative">
                        <Box
                            flex="1"
                            transition="all 0.2s"
                            display="flex"
                            justifyContent="center"
                            gap={4}
                        >
                            {renderChecklist()}
                        </Box>
                        <Flex justifyContent={"center"} w="100%" zIndex={5} mb={4}>
                            <StreamerPayoutComponent />
                        </Flex>
                        <Flex justifyContent={"center"} w="100%" zIndex={5}>
                            {renderSignOut()}
                        </Flex>
                    </Flex>
                    <BuyCreditsDrawer />
                    <Box />
                </Flex>
            </Flex>
            <Box
                position="absolute"
                top={0}
                left={0}
                w="100%"
                h="100%"
                backgroundImage={"/images/UserDashboard/thousandsoverlay.svg"}
                backgroundRepeat={"no-repeat"}
                backgroundPosition={"top left"}
                backgroundSize={"auto"}
                zIndex={3}
                opacity={0.1}
            />
        </Box>
    );
};

export default StreamerDashboard;
