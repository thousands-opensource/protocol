import { BuyCreditsDrawer } from "@/components/BuyCreditsDrawer";
import LinkWalletModal from "@/components/Wallet/LinkAdditionalWalletsModal";
import { WILDFILE_ROUTES } from "@/constants/routes";
import { useGlobalContext } from "@/contexts/globalContext";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { useInfoNotifications } from "@/hooks/useInfoNotifications";
import {
    BoostSummaries,
    CreditPurchasesTable,
} from "@/pages/[serverCode]/wildfile/profile/[tab]/_ui/credit-purchases";
import {
    CreditPurchaseType,
    useBuyCreditsStore,
} from "@/store/useBuyCreditsStore";
import {
    Text,
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box,
    Flex,
    Heading,
    useColorModeValue,
    Button,
    useBreakpointValue,
    useDisclosure,
    Divider,
} from "@chakra-ui/react";
import axios from "axios";
import { signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { BiLogOut } from "react-icons/bi";
import { FaBitcoin, FaMoneyBillWave } from "react-icons/fa";
import OAuthButton from "../LoginOrSignUpFlow/_ui/OAuthButton";
import { MdOutlineWallet } from "react-icons/md";
import { handleLogin } from "@/utils/backend/accountsBackendUtil";
import { useAccount, useNetwork, useSignMessage } from "wagmi";
import { WildcardApiResponse } from "@repo/interfaces";
import LinkWalletProviderModal from "@/pages/[serverCode]/wildfile/profile/[tab]/_ui/connected-accounts/_ui/LinkWalletProviderModal";
import { THEME_COLOR_SECONDARY } from "@/constants";
import { shorten } from "@/utils/util";
import Image from "next/image";
import waxios from "@/utils/waxios";
import { ResponsiveContainer } from "recharts";
import CreditBalanceDisplay from "@/components/DashboardNavigation/TopNav/_ui/CreditBalanceDisplay";
import ProfilePic from "@/pages/[serverCode]/wildfile/profile/[tab]/_ui/profilePic";
import Body from "../Stream/Body";

const UserDashboard = () => {
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

    return (
        <Box
            p={8}
            // bg={useColorModeValue("purple.50", "purple.900")}
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

                    <Flex
                        justifyContent={"space-between"}
                        alignItems={"center"}
                    >
                        <Heading size="md">Credits</Heading>
                        <CreditBalanceDisplay />
                    </Flex>
                    <Divider orientation="horizontal" />
                    <Flex gap={4} mb={0} flexWrap="wrap" position="relative">
                        <Box
                            flex="1"
                            transition="all 0.2s"
                            display="flex"
                            flexDirection="column"
                            justifyContent="space-between"
                            gap={4}
                            _hover={{ boxShadow: "lg" }}
                        >
                            <Box>
                                <Flex gap={4} w="100%">
                                    <Heading size="md" mb={2}>
                                        Purchase Credits
                                    </Heading>
                                    <Flex
                                        flexDirection="column-reverse"
                                        ml="auto"
                                        p={1}
                                        textAlign="center"
                                        borderRadius={18}
                                        boxShadow="md"
                                        border="1px solid"
                                        h="36px"
                                        w="150px"
                                        gap={1}
                                        alignItems="right"
                                        justifyContent="center"
                                        cursor="pointer"
                                        background="linear-gradient(to right, #00c2e8, #006fff)"
                                        borderColor={borderColor}
                                        onClick={() => {
                                            handlePickPaymentType("crypto");
                                        }}
                                        zIndex={5}
                                    >
                                        <Text fontSize="md">Purchase</Text>
                                    </Flex>
                                </Flex>
                            </Box>
                        </Box>

                        {/* <Box
                    flex="1"
                    p={6}
                    bg={cardBg}
                    borderRadius="lg"
                    boxShadow="md"
                    border="1px solid"
                    borderColor={borderColor}
                    transition="all 0.2s"
                    display="flex"
                    flexDirection="column"
                    justifyContent="space-between"
                    gap={4}
                    _hover={{ boxShadow: "lg" }}
                >
                    <Box>
                        <Heading size="md" mb={2}>
                            Connect a Wallet
                        </Heading>
                    </Box>
                  
                    <Button
                        onClick={() => linkWalletDisclosure.onOpen()}
                        isDisabled={isLinked}
                        width="full"
                        bg="glass.bg"
                        border="1px solid"
                        borderColor={THEME_COLOR_SECONDARY}
                    >
                        {isLinked
                            ? `Connected to ${shorten(
                                  userDB?.walletProvider?.address
                              )}`
                            : "Link Wallet"}
                    </Button>
                    <LinkWalletModal
                        showModal={showModal}
                        closeModal={closeModal}
                        label="primary"
                    /> 
                    <LinkWalletProviderModal
                        isOpen={linkWalletDisclosure.isOpen}
                        onClose={linkWalletDisclosure.onClose}
                        account={null}
                        setIsLinkingWallet={setIsLinkingWallet}
                        isLinkingWallet={isLinkingWallet}
                    />
                </Box> */}
                    </Flex>
                    <Divider orientation="horizontal" />
                    <Box borderRadius="lg" position="relative" zIndex={5}>
                        <Heading size="md" mb={4}>
                            Recent Credit History
                        </Heading>
                        <Accordion
                            allowMultiple
                            defaultIndex={[0, 1]}
                            zIndex={5}
                        >
                            <AccordionItem border={"none"} zIndex={5}>
                                <h2>
                                    <AccordionButton
                                        _expanded={{
                                            color: "white",
                                        }}
                                        px={0}
                                        zIndex={5}
                                    >
                                        <Box flex="1" textAlign="left">
                                            Credits Purchased
                                        </Box>
                                        <AccordionIcon />
                                    </AccordionButton>
                                </h2>
                                <AccordionPanel>
                                    <CreditPurchasesTable hide={true} />
                                </AccordionPanel>
                            </AccordionItem>
                            <AccordionItem border={"none"} zIndex={5}>
                                <h2>
                                    <AccordionButton
                                        _expanded={{
                                            color: "white",
                                        }}
                                        px={0}
                                        zIndex={5}
                                    >
                                        <Box flex="1" textAlign="left">
                                            Credits Spent
                                        </Box>
                                        <AccordionIcon />
                                    </AccordionButton>
                                </h2>
                                <AccordionPanel>
                                    <BoostSummaries />
                                </AccordionPanel>
                            </AccordionItem>
                        </Accordion>
                        <Flex justifyContent={"center"} w="100%" zIndex={5}>
                            {renderSignOut()}
                        </Flex>
                    </Box>
                    <BuyCreditsDrawer />
                    {/* dot pattern - Overlay over gradient at 25% opacity */}
                    <Box />
                    {/* MAIN - LIGHTER - red (#ff0030) to purple (#341358) */}
                    {/* <Box
                position="absolute"
                top={0}
                left={0}
                width="100vw"
                height="100vh"
                background="linear-gradient(to right, #ff0030, #341358)"
                zIndex={0}
            /> */}
                    {/* MAIN - DARKER - red (#dd0332) to purple (#2b0951) */}
                    {/* <Box
                position="absolute"
                top={0}
                left={0}
                width="100vw"
                height="100vh"
                background="linear-gradient(to right, #dd0332, #2b0951)"
                // opacity={0.6}
                zIndex={1}
            /> */}
                    {/* PURPLE - lt purple (#b6059d) to purple (#341358) */}
                    {/* <Box
                position="absolute"
                top={0}
                left={0}
                width="100vw"
                height="100vh"
                background="linear-gradient(to right, #b6059d, #341358)"
                // opacity={0.4}
                zIndex={2}
            /> */}
                    {/* Combined */}
                    {/* <Box
                // position="absolute"
                // top={0}
                // left={0}
                // width="100vw"
                // height="100vh"
                // backgroundImage={
                //     "url(/images/UserDashboard/dot_pattern_destop.svg)"
                // }
                backgroundRepeat={"no-repeat"}
                backgroundPosition={"top left"}
                backgroundSize={"cover"}
                background="linear-gradient(135deg, #b6059d, #2b0951 40%, #2b0951 60%, #ff0030)"
                // opacity={0.4}
                zIndex={2}
                mixBlendMode={"difference"}
            /> */}

                    {/* <Box
                position="absolute"
                top={0}
                left={0}
                // width="100vw"
                // height="100vh"
                backgroundImage={"/images/UserDashboard/dot_pattern_destop.svg"}
                backgroundRepeat={"no-repeat"}
                backgroundPosition={"top left"}
                backgroundSize={"auto"}
                zIndex={3}
            /> */}
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

export default UserDashboard;
