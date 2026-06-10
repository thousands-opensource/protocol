import connectToDb from "@/db/connectToDb";
import ThousandsLayout from "@/layouts/ThousandsLayout";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { AuthorizedUserData } from "@/utils/backend/sessionServerUtil";
import { checkUserAuthorizedForPage } from "@/utils/profileUtil";
import { redirectUserIfUnauthorized } from "@/utils/sessionUtil";
import { diContainer } from "@/inversify.config";
import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Avatar,
    Box,
    Button,
    Flex,
    Grid,
    GridItem,
    Heading,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Portal,
    Stat,
    StatLabel,
    StatNumber,
    Stack,
    Table,
    Tbody,
    Td,
    Th,
    Thead,
    Tr,
    Text,
    useColorModeValue,
    useToast,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";
import { AccountProviderType, IUser, KycStatus } from "@repo/interfaces";
import axios from "axios";
import { GetServerSideProps } from "next";
import { signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";
import IPlayerEarningsRepository from "@/repositories/interfaces/IPlayerEarningsRepository";
import ITournamentsRepository, {
    DailyTournamentReward,
} from "@/repositories/interfaces/ITournamentsRepository";
import RainbowkitCustomConnectButton from "@/components/RainbowkitCustomConnectButton";
import { API_AUTH_ROUTES } from "@/constants/routes";

declare global {
    interface Window {
        Stripe?: any;
    }
}

const STRIPE_JS_URL = "https://js.stripe.com/v3/";
const STRIPE_PUBLISHABLE_KEY =
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
const KYC_BUTTON_GRADIENT = "linear-gradient(135deg, #C084FC, #7C3AED)";

const normalizeKycStatus = (status?: string | null) =>
    status?.toString().toLowerCase() ?? "";

interface CompetitorHomeProps {
    userDBStr: string;
    connectedUserDBEmail: string;
    connectedUserDBProviderId: string;
    playerEarnings: number;
    dailyTournament: DailyTournamentReward[];
    stripeSignUpComplete: boolean;
    stripeLoginLinkUrl: string | null;
}

const CompetitorOverview = ({
    userDB,
    onLogout,
    onUserDbUpdate,
    playerEarnings,
    dailyTournament,
    stripeSignUpComplete,
    stripeLoginLinkUrl,
}: {
    userDB: IUser | null;
    onLogout: () => Promise<void>;
    onUserDbUpdate?: (nextUser: IUser | null) => void;
    playerEarnings: number;
    dailyTournament: DailyTournamentReward[];
    stripeSignUpComplete: boolean;
    stripeLoginLinkUrl: string | null;
}) => {
    const [userDBState, setUserDBState] = useState(userDB);
    const panelBg = useColorModeValue(
        "rgba(255, 255, 255, 0.75)",
        "rgba(255, 255, 255, 0.18)"
    );
    const panelBorder = useColorModeValue(
        "rgba(255, 255, 255, 0.55)",
        "rgba(255, 255, 255, 0.35)"
    );
    const toast = useToast();
    const { address, isConnected } = useAccount();
    const { disconnect } = useDisconnect();
    const { signMessage: signLinkWalletMessage } = useSignMessage({
        onSuccess: (data: any, variables: any) => {
            callLinkWalletApi(data, variables.message);
        },
        onError: (error) => {
            setIsLinkingWallet(false);
            console.error("Failed to sign message:", error);
            toast({
                title: "Unable to sign",
                description: "Please approve the wallet signature request.",
                status: "warning",
                duration: 5000,
                isClosable: true,
                position: "top",
            });
        },
    });
    const maskAddress = (address?: string) => {
        if (!address) return null;
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };
    const statBg = useColorModeValue(
        "rgba(255, 255, 255, 0.6)",
        "rgba(255, 255, 255, 0.14)"
    );
    const glassPanelProps = {
        borderRadius: "xl",
        border: "1px solid",
        borderColor: panelBorder,
        backdropFilter: "blur(4px)",
        backgroundClip: "padding-box",
        boxShadow: "0 18px 50px rgba(0, 0, 0, 0.25)",
    };
    const [wildcardCode, setWildcardCode] = useState("");
    const [isLinking, setIsLinking] = useState(false);
    const router = useRouter();
    const [linkSuccess, setLinkSuccess] = useState(false);
    const [linkError, setLinkError] = useState<string | null>(null);
    const [isStartingPayout, setIsStartingPayout] = useState(false);
    const [payoutError, setPayoutError] = useState<string | null>(null);
    const [showStripeCompleteMessage, setShowStripeCompleteMessage] =
        useState(false);
    const [isPayoutMethodOpen, setIsPayoutMethodOpen] = useState(false);
    const [isLinkWalletOpen, setIsLinkWalletOpen] = useState(false);
    const [isLinkingWallet, setIsLinkingWallet] = useState(false);
    const [kycCompleted, setKycCompleted] = useState(false);
    const [kycLoading, setKycLoading] = useState(false);
    const [kycError, setKycError] = useState<string | null>(null);
    const kycRefreshAttemptsRef = useRef(0);
    const stripeInstanceRef = useRef<any | null>(null);
    const stripeScriptPromiseRef = useRef<Promise<void> | null>(null);

    const earningsInDollars = (playerEarnings ?? 0) / 100;
    const showGetPayoutButton =
        Boolean(stripeLoginLinkUrl) && userDBState?.payoutMethod === "USD";
    const showStripeOnboardingButton = earningsInDollars >= 10;
    const kycStatus = normalizeKycStatus(userDBState?.kyc?.status);
    const isKycPending =
        !!kycStatus &&
        kycStatus !== "notstarted" &&
        kycStatus !== "completed" &&
        kycStatus !== "failed";
    
    const statCardMinHeight = showStripeOnboardingButton ? "152px" : undefined;
    const formattedEarnings = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
    }).format(earningsInDollars);
    const payoutStatus = useMemo(() => {
        const payoutMethod = userDBState?.payoutMethod;
        const kycCompleted =
            normalizeKycStatus(userDBState?.kyc?.status) === "completed";

        if (payoutMethod === "USDC") {
            return kycCompleted
                ? "Ready to Receive Payout"
                : "Waiting for KYC";
        }

        if (payoutMethod === "USD") {
            return stripeSignUpComplete
                ? "Ready to Receive Payout"
                : "Waiting for Stripe Setup";
        }

        return "Waiting for Payout Method";
    }, [stripeSignUpComplete, userDBState?.payoutMethod, userDBState?.kyc?.status]);
    const isPayoutReady = payoutStatus === "Ready to Receive Payout";

    const handleLinkWildcardAccount = async () => {
        if (!wildcardCode.trim()) {
            setLinkError("Please enter your Wildcard Code.");
            return;
        }

        try {
            setIsLinking(true);
            setLinkError(null);
            await axios.post("/api/beamable/link-wildcard-player", {
                code: wildcardCode.trim(),
            });
            setLinkSuccess(true);
            router.reload();
        } catch (error) {
            console.error("Failed to link Wildcard account:", error);
            setLinkError(
                "We couldn't link your account. Please double-check your code and try again."
            );
        } finally {
            setIsLinking(false);
        }
    };

    useEffect(() => {
        if (userDB) {
            setUserDBState(userDB);
        }
    }, [userDB]);

    useEffect(() => {
        if (!router.isReady) {
            return;
        }

        const popupFlag = router.query.popupstripecompletemessage;
        const shouldShow = Array.isArray(popupFlag)
            ? popupFlag.includes("true")
            : popupFlag === "true";
        if (shouldShow) {
            setShowStripeCompleteMessage(true);
        }
    }, [router.isReady, router.query.popupstripecompletemessage]);

    useEffect(() => {
        if (normalizeKycStatus(userDBState?.kyc?.status) === "completed") {
            setKycCompleted(true);
        }
    }, [userDBState]);

    useEffect(() => {
        const status = normalizeKycStatus(userDBState?.kyc?.status);
        const sessionId = userDBState?.kyc?.sessionId;

        if (!sessionId || status === "completed" || status === "failed") {
            return;
        }

        let isMounted = true;
        const refreshKycStatus = async () => {
            try {
                const response = await fetch(
                    "/api/stripe/verification-session",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                    }
                );
                const payload = await response.json();
                if (!payload?.success) {
                    return;
                }
                const refreshedStatus = normalizeKycStatus(
                    payload?.data?.status
                );
                if (!isMounted) {
                    return;
                }
                if (refreshedStatus === "completed") {
                    setKycCompleted(true);
                } else if (refreshedStatus === "failed") {
                    setKycCompleted(false);
                    setKycError(
                        "Verification failed - please contact support."
                    );
                }
            } catch (error) {
                console.error(
                    "[CompetitorHome] Failed to refresh KYC status",
                    error
                );
            }
        };

        refreshKycStatus();

        return () => {
            isMounted = false;
        };
    }, [userDBState?.kyc?.sessionId, userDBState?.kyc?.status]);

    const refreshUserDb = useCallback(async (walletAddressOverride?: string) => {
        const walletAddress =
            walletAddressOverride ?? userDBState?.walletProvider?.address;
        if (!walletAddress) {
            return;
        }

        try {
            const response = await fetch(
                `/api/fetchUser?walletAddress=${encodeURIComponent(
                    walletAddress
                )}`
            );
            const payload = await response.json();
            if (payload?.success && payload?.data) {
                setUserDBState((prev) => {
                    if (!prev) {
                        return payload.data;
                    }
                    const nextKyc = payload?.data?.kyc ?? prev.kyc;
                    const nextPayoutMethod =
                        payload?.data?.payoutMethod ?? prev.payoutMethod;
                    const nextWalletProvider =
                        payload?.data?.walletProvider ?? prev.walletProvider;
                    const nextUser = {
                        ...prev,
                        ...payload.data,
                        kyc: nextKyc,
                        payoutMethod: nextPayoutMethod,
                        walletProvider: nextWalletProvider,
                        beamableProvider:
                            payload?.data?.beamableProvider ??
                            prev.beamableProvider,
                    };
                    onUserDbUpdate?.(nextUser);
                    return nextUser;
                });
            }
        } catch (error) {
            console.error(
                "[CompetitorHome] Failed to refresh user",
                error
            );
        }
    }, [onUserDbUpdate, userDBState?.walletProvider?.address]);

    useEffect(() => {
        if (!kycCompleted || kycStatus === "completed") {
            return;
        }

        let isMounted = true;
        const attemptRefresh = async () => {
            if (!isMounted) {
                return;
            }
            if (kycRefreshAttemptsRef.current >= 5) {
                return;
            }
            kycRefreshAttemptsRef.current += 1;
            await refreshUserDb();
            if (
                isMounted &&
                normalizeKycStatus(userDBState?.kyc?.status) !== "completed"
            ) {
                window.setTimeout(attemptRefresh, 1500);
            }
        };

        attemptRefresh();

        return () => {
            isMounted = false;
        };
    }, [kycCompleted, kycStatus, refreshUserDb, userDBState?.kyc?.status]);

    useEffect(() => {
        if (!userDBState && address) {
            refreshUserDb(address);
        }
    }, [address, refreshUserDb, userDBState]);

    const handleBeginStripeOnboarding = async () => {
        if (typeof window === "undefined") {
            return;
        }

        try {
            setPayoutError(null);
            setIsStartingPayout(true);

            const serverCodeParam = "thousands";
            const sanitizedAsPath =
                typeof router.asPath === "string"
                    ? router.asPath.split("?")[0]
                    : "/competitor";
            const basePath = serverCodeParam
                ? `/${serverCodeParam}/competitor`
                : sanitizedAsPath || "/competitor";

            const refreshUrl = `${window.location.origin}${basePath}`;
            const returnUrl = `${window.location.origin}${basePath}?popupstripecompletemessage=true`;

            const response = await axios.post(
                "/api/payments/stripe/competitor-onboarding",
                {
                    refreshUrl,
                    returnUrl,
                }
            );

            const onboardingUrl = response.data?.url;
            if (!onboardingUrl) {
                throw new Error("Missing onboarding URL");
            }

            window.location.href = onboardingUrl;
        } catch (error) {
            console.error("Failed to start Stripe onboarding:", error);
            setPayoutError(
                "We couldn't start the payout onboarding. Please try again."
            );
        } finally {
            setIsStartingPayout(false);
        }
    };

    const ensureStripeLoaded = useCallback(async () => {
        if (!STRIPE_PUBLISHABLE_KEY) {
            throw new Error("Stripe publishable key is not configured");
        }

        if (stripeInstanceRef.current) {
            return stripeInstanceRef.current;
        }

        if (typeof window === "undefined") {
            throw new Error("Stripe is only available in the browser");
        }

        if (!window.Stripe) {
            if (!stripeScriptPromiseRef.current) {
                stripeScriptPromiseRef.current = new Promise<void>(
                    (resolve, reject) => {
                        const script = document.createElement("script");
                        script.src = STRIPE_JS_URL;
                        script.async = true;
                        script.onload = () => resolve();
                        script.onerror = () =>
                            reject(new Error("Failed to load Stripe.js"));
                        document.body.appendChild(script);
                    }
                );
            }

            await stripeScriptPromiseRef.current;
        }

        if (!window.Stripe) {
            throw new Error("Stripe.js failed to initialize");
        }

        stripeInstanceRef.current = window.Stripe(STRIPE_PUBLISHABLE_KEY);
        return stripeInstanceRef.current;
    }, []);

    const handleCompleteKyc = useCallback(async () => {
        if (kycCompleted || kycLoading) {
            return;
        }

        setKycError(null);
        setKycLoading(true);

        try {
            const response = await fetch("/api/stripe/verification-session", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const payload = await response.json();

            if (!payload?.success) {
                throw new Error(
                    payload?.err || "Failed to create verification session"
                );
            }

            const { sessionId, clientSecret, status } = payload?.data || {};

            if (normalizeKycStatus(status) === "completed") {
                setKycCompleted(true);
                setUserDBState((prev) =>
                    prev
                        ? {
                              ...prev,
                              kyc: {
                                  ...(prev.kyc ?? {}),
                                  status: KycStatus.COMPLETED,
                              },
                          }
                        : prev
                );
                return;
            } else if (normalizeKycStatus(status) === "failed") {
                setKycCompleted(false);
                setKycError("Verification Failed - Please contact support.");
                return;
            }

            if (!clientSecret) {
                throw new Error("Missing verification authorization");
            }

            const stripe = await ensureStripeLoaded();

            if (!stripe) {
                throw new Error("Verification failed to initialize");
            }

            let verificationResult: any;

            if (stripe.identity?.verifySession) {
                verificationResult = await stripe.identity.verifySession(
                    sessionId,
                    {
                        clientSecret,
                    }
                );
            } else if (stripe.verifyIdentity) {
                verificationResult = await stripe.verifyIdentity(clientSecret);
            } else {
                throw new Error("Identity Verification is not available");
            }

            if (verificationResult?.error) {
                throw new Error(verificationResult.error.message);
            }

            setKycCompleted(true);
            setUserDBState((prev) =>
                prev
                    ? {
                          ...prev,
                          kyc: {
                              ...(prev.kyc ?? {}),
                              status: KycStatus.COMPLETED,
                          },
                      }
                    : prev
            );
        } catch (error: any) {
            console.error("[CompetitorHome] verification failed", error);
            setKycError(error?.message || "Verification failed to start");
        } finally {
            await refreshUserDb();
            setKycLoading(false);
        }
    }, [ensureStripeLoaded, kycCompleted, kycLoading, refreshUserDb]);

    const handleOpenPayoutMethod = () => {
        setIsPayoutMethodOpen(true);
    };

    const handleClosePayoutMethod = () => {
        if (!isStartingPayout) {
            setIsPayoutMethodOpen(false);
        }
    };

    const handleSelectUsdPayout = async () => {
        handleClosePayoutMethod();
        await updatePayoutMethod("USD");
        if (!stripeSignUpComplete) {
            await handleBeginStripeOnboarding();
        }
    };

    const handleCloseLinkWallet = () => {
        if (!isLinkingWallet) {
            setIsLinkWalletOpen(false);
        }
    };

    const updatePayoutMethod = async (method: "USD" | "USDC") => {
        try {
            const response = await axios.post(
                "/api/users/updatePayoutMethod",
                { payoutMethod: method }
            );
            if (!response?.data?.success) {
                throw new Error("Failed to update payout method");
            }
            setUserDBState((prev) => {
                if (!prev) {
                    return prev;
                }
                const nextUser = {
                    ...prev,
                    payoutMethod: method,
                };
                onUserDbUpdate?.(nextUser);
                return nextUser;
            });
            await refreshUserDb();
        } catch (error) {
            console.error("Failed to update payout method:", error);
            setPayoutError(
                "We couldn't update your payout method. Please try again."
            );
        }
    };

    const callLinkWalletApi = async (
        signature: `0x${string}`,
        message: string | Uint8Array
    ) => {
        if (!isConnected || !address || !userDBState?._id) {
            setIsLinkingWallet(false);
            return;
        }

        try {
            const body = {
                wildcardSessionTokenParams: {
                    accountProviderType: AccountProviderType.WALLET,
                    userDBId: userDBState._id.toString(),
                    address,
                    signature,
                    message,
                },
            };

            const resp = await axios.post(
                API_AUTH_ROUTES.AUTH.WILDCARD.LINK_WALLET,
                body
            );

            if (!resp?.data?.success) {
                throw new Error(resp?.data?.message || "Link wallet failed");
            }

            toast({
                title: "Wallet linked",
                description: "Your wallet was linked successfully.",
                status: "success",
                duration: 4000,
                isClosable: true,
                position: "top",
            });

            setIsLinkingWallet(false);
            handleCloseLinkWallet();
            setUserDBState((prev) => {
                if (!prev) {
                    return prev;
                }
                const nextUser = {
                    ...prev,
                    walletProvider: {
                        ...prev.walletProvider,
                        address,
                    },
                };
                onUserDbUpdate?.(nextUser);
                return nextUser;
            });
            await updatePayoutMethod("USDC");
        } catch (error) {
            console.error("Failed to link wallet:", error);
            setIsLinkingWallet(false);
            toast({
                title: "Unable to link wallet",
                description:
                    "We couldn't link your wallet. This is likely due to your wallet address already being used in another Thousands account. Please use a different wallet address or contact support for assistance.",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "top",
            });
        }
    };

    const handleLinkWallet = () => {
        if (!isConnected || !address) {
            toast({
                title: "Connect your wallet",
                description: "Please connect your wallet to continue.",
                status: "info",
                duration: 4000,
                isClosable: true,
                position: "top",
            });
            return;
        }

        try {
            setIsLinkingWallet(true);
            const nonce = `${Date.now()}${Math.floor(Math.random() * 100000)}`;
            const message =
                "Please sign this message to link your wallet to Wildcard and verify ownership of your account. This is READ-ONLY access and will NOT trigger any blockchain transactions or incur any fees.\n" +
                `Nonce: ${nonce}`;
            signLinkWalletMessage({ message });
        } catch (error) {
            setIsLinkingWallet(false);
            console.error("Failed to sign message:", error);
        }
    };

    const handleSelectUsdcPayout = async () => {
        handleClosePayoutMethod();
        if (!userDBState?.walletProvider?.address) {
            setIsLinkWalletOpen(true);
            return;
        }
        await updatePayoutMethod("USDC");
    };

    return (
        <Stack spacing={6}>
            <Box {...glassPanelProps} bg={panelBg} p={{ base: 4, md: 5 }}>
                <Flex justify="space-between" align="center" position="relative" zIndex={1}>
                    <Heading size="lg">
                        Welcome back{userDBState?.preferences?.displayName
                            ? `, ${userDBState.preferences.displayName}`
                            : ""}{" "}
                    </Heading>
                    <Menu placement="bottom-end" matchWidth={false}>
                        <MenuButton
                            as={Button}
                            variant="ghost"
                            p={0}
                            minW="auto"
                            _hover={{ bg: "transparent" }}
                            _active={{ bg: "transparent" }}
                            aria-label="Account menu"
                            position="relative"
                            zIndex={2}
                        >
                            <Flex align="center" gap={2}>
                                <Avatar
                                    size="sm"
                                    src={userDBState?.discordProvider?.image || undefined}
                                    name={
                                        userDBState?.discordProvider?.name ||
                                        userDBState?.preferences?.displayName ||
                                        "User avatar"
                                    }
                                />
                                <ChevronDownIcon />
                            </Flex>
                        </MenuButton>
                        <Portal>
                            <MenuList zIndex={2000}>
                                {userDBState?.walletProvider?.address ? (
                                    <MenuItem as="a" href="/thousands/home/">
                                        Franchise Dashboard
                                    </MenuItem>
                                ) : null}
                                <MenuItem onClick={onLogout}>Log out</MenuItem>
                            </MenuList>
                        </Portal>
                    </Menu>
                </Flex>
            </Box>
            {showStripeCompleteMessage && (
                <Alert status="success" flexDirection="column" alignItems="flex-start">
                    <Flex align="center" width="100%" gap={3}>
                        <AlertIcon />
                        <Box>
                            <AlertDescription>
                                Thanks for setting up your payout account.  December PreSeason Rewards will be paid out as you connect your payout account (please allow a few days for processing).  For official Wildcard tournaments, payouts will be processed during the first week of every month for players with a balance of $100 or more.
                            </AlertDescription>
                        </Box>
                    </Flex>
                    <Button
                        mt={4}
                        alignSelf="flex-start"
                        onClick={() => setShowStripeCompleteMessage(false)}
                        size="sm"
                        colorScheme="purple"
                    >
                        Close
                    </Button>
                </Alert>
            )}

            {!userDBState?.beamableProvider && (
                <Box
                    {...glassPanelProps}
                    bg={panelBg}
                    p={{ base: 6, md: 8 }}
                >
                    <Text color="whiteAlpha.700" fontSize="md">
                        {linkSuccess
                            ? "Thank you for linking your Wildcard account!"
                            : "Please complete the following to link your Wildcard game account to your Thousands account.  You can access the Wildcard Code to enter below from within the Wildcard game."}
                    </Text>
                    {!linkSuccess && (
                        <Stack mt={6} spacing={3}>
                            <Flex gap={4} wrap="wrap" align="center">
                                <Input
                                    placeholder="Wildcard Code"
                                    value={wildcardCode}
                                    onChange={(event) =>
                                        setWildcardCode(event.target.value)
                                    }
                                    maxW="320px"
                                    flex="1"
                                    bg="whiteAlpha.50"
                                    color="white"
                                    _placeholder={{ color: "whiteAlpha.700" }}
                                />
                            <Button
                                colorScheme="purple"
                                size="lg"
                                onClick={handleLinkWildcardAccount}
                                isLoading={isLinking}
                                isDisabled={wildcardCode.trim().length !== 7}
                            >
                                Link Wildcard Account
                            </Button>
                            </Flex>
                            {linkError && (
                                <Text color="red.400" fontSize="sm">
                                    {linkError}
                                </Text>
                            )}
                        </Stack>
                    )}
                </Box>
            )}

            <Grid
                templateColumns={{ base: "1fr", lg: "repeat(3, 1fr)" }}
                gap={4}
                alignItems="stretch"
            >
                <GridItem>
                    <Box
                        {...glassPanelProps}
                        bg={statBg}
                        p={6}
                        h="100%"
                        minH={statCardMinHeight}
                        display="flex"
                        flexDirection="column"
                        justifyContent="space-between"
                    >
                        <Stat>
                            <StatLabel color="whiteAlpha.700">
                                Prize Balance
                            </StatLabel>
                            <StatNumber fontSize="2xl">
                                {formattedEarnings}
                            </StatNumber>
                        </Stat>
                    </Box>
                </GridItem>
                <GridItem>
                    <Box
                        {...glassPanelProps}
                        bg={statBg}
                        p={6}
                        h="100%"
                        minH={statCardMinHeight}
                        display="flex"
                        flexDirection="column"
                        justifyContent="space-between"
                        gap={4}
                    >
                        <Stat>
                            <StatLabel color="whiteAlpha.700">
                                Payout Method
                            </StatLabel>
                            <Flex
                                align="baseline"
                                justify="space-between"
                                gap={3}
                                flexWrap="wrap"
                            >
                                <StatNumber fontSize="2xl">
                                    {userDBState?.payoutMethod ?? "Not set"}
                                </StatNumber>
                                {userDBState?.payoutMethod === "USDC" && (
                                    <StatNumber fontSize="2xl">
                                        {userDBState?.walletProvider?.address
                                            ? maskAddress(
                                                  userDBState.walletProvider.address
                                              )
                                            : "Missing Wallet Address"}
                                    </StatNumber>
                                )}
                                {userDBState?.payoutMethod === "USD" && (
                                    <StatNumber fontSize="2xl">
                                        Stripe
                                    </StatNumber>
                                )}
                            </Flex>
                        </Stat>
                        <Flex gap={3} flexWrap="wrap">
                            {showStripeOnboardingButton && (
                                <Button
                                    size="sm"
                                    colorScheme="purple"
                                    variant="solid"
                                    onClick={handleOpenPayoutMethod}
                                    isLoading={isStartingPayout}
                                >
                                    {userDBState?.payoutMethod
                                        ? "Change Payout Method"
                                        : "Connect Payout Account"}
                                </Button>
                            )}
                            {userDBState?.payoutMethod === "USDC" &&
                                normalizeKycStatus(userDBState?.kyc?.status) !==
                                    "completed" && (
                                    <Button
                                        size="sm"
                                        bgGradient={KYC_BUTTON_GRADIENT}
                                        color="white"
                                        variant="solid"
                                        onClick={handleCompleteKyc}
                                        isLoading={kycLoading}
                                        isDisabled={
                                            kycCompleted ||
                                            kycLoading ||
                                            !STRIPE_PUBLISHABLE_KEY
                                        }
                                        _hover={{
                                            bgGradient: KYC_BUTTON_GRADIENT,
                                            boxShadow:
                                                "0 20px 40px rgba(124, 58, 237, 0.35)",
                                            transform: "translateY(-1px)",
                                        }}
                                        _active={{
                                            transform: "translateY(0px)",
                                        }}
                                    >
                                        {kycCompleted
                                            ? "KYC Completed"
                                            : isKycPending
                                            ? "Resume KYC"
                                            : "Complete KYC"}
                                    </Button>
                                )}
                            {showGetPayoutButton && (
                                <Button
                                    size="sm"
                                    colorScheme="purple"
                                    variant="outline"
                                    as="a"
                                    href={stripeLoginLinkUrl || undefined}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    View Payouts
                                </Button>
                            )}
                        </Flex>
                        {userDBState?.payoutMethod === "USDC" &&
                            normalizeKycStatus(userDBState?.kyc?.status) !==
                                "completed" &&
                            !STRIPE_PUBLISHABLE_KEY && (
                                <Text color="orange.300" fontSize="sm">
                                    Stripe publishable key is not configured.
                                </Text>
                            )}
                        {userDBState?.payoutMethod === "USDC" &&
                            normalizeKycStatus(userDBState?.kyc?.status) !==
                                "completed" &&
                            kycError && (
                                <Text color="red.300" fontSize="sm">
                                    {kycError}
                                </Text>
                            )}
                    </Box>
                </GridItem>
                <GridItem>
                    <Box
                        {...glassPanelProps}
                        bg={statBg}
                        p={6}
                        h="100%"
                        minH={statCardMinHeight}
                        display="flex"
                        flexDirection="column"
                        justifyContent="space-between"
                    >
                        <Stat>
                            <StatLabel color="whiteAlpha.700">
                                Payout Status
                            </StatLabel>
                            <StatNumber fontSize="2xl">
                                <Flex align="center" gap={2}>
                                    {isPayoutReady ? (
                                        <Box
                                            as={FiCheckCircle}
                                            color="green.300"
                                        />
                                    ) : (
                                        <Box
                                            as={FiXCircle}
                                            color="red.300"
                                        />
                                    )}
                                    <Text as="span">{payoutStatus}</Text>
                                </Flex>
                            </StatNumber>
                        </Stat>
                    </Box>
                </GridItem>
            </Grid>
            {payoutError && (
                <Text color="red.300" fontSize="sm">
                    {payoutError}
                </Text>
            )}
            <Modal
                isOpen={isPayoutMethodOpen}
                onClose={handleClosePayoutMethod}
                isCentered
                size="md"
            >
                <ModalOverlay bg="blackAlpha.700" />
                <ModalContent
                    bg={panelBg}
                    border="1px solid"
                    borderColor={panelBorder}
                    backdropFilter="blur(12px)"
                    boxShadow="0 20px 60px rgba(0,0,0,0.25)"
                >
                    <ModalHeader color="white">
                        Choose Payout Method
                    </ModalHeader>
                    <ModalCloseButton color="whiteAlpha.700" />
                    <ModalBody pb={6}>
                        <Stack spacing={4}>
                            <Button
                                colorScheme="purple"
                                variant="solid"
                                onClick={handleSelectUsdPayout}
                                isLoading={isStartingPayout}
                            >
                                USD via Stripe ($50 minimum)
                            </Button>
                            <Button
                                variant="outline"
                                colorScheme="purple"
                                onClick={handleSelectUsdcPayout}
                            >
                                USDC via Wallet ($10 minimum)
                            </Button>
                        </Stack>
                    </ModalBody>
                </ModalContent>
            </Modal>
            <Modal
                isOpen={isLinkWalletOpen}
                onClose={handleCloseLinkWallet}
                isCentered
                size="md"
            >
                <ModalOverlay bg="blackAlpha.700" />
                <ModalContent
                    bg={panelBg}
                    border="1px solid"
                    borderColor={panelBorder}
                    backdropFilter="blur(12px)"
                    boxShadow="0 20px 60px rgba(0,0,0,0.25)"
                >
                    <ModalHeader color="white">Link Wallet</ModalHeader>
                    <ModalCloseButton color="whiteAlpha.700" />
                    <ModalBody pb={6}>
                        <Stack spacing={4}>
                            {!isConnected ? (
                                <RainbowkitCustomConnectButton
                                    buttonProps={{
                                        size: "lg",
                                        w: "full",
                                        maxW: "360px",
                                        alignSelf: "center",
                                        h: "56px",
                                        variant: "solid",
                                        bgGradient:
                                            "linear(to-r, #7c3aed, #b5179e)",
                                        color: "white",
                                        px: 10,
                                        py: 6,
                                        _hover: {
                                            bgGradient:
                                                "linear(to-r, #8b5cf6, #c026d3)",
                                            transform: "translateY(-1px)",
                                            boxShadow:
                                                "0 10px 25px rgba(0,0,0,0.25)",
                                        },
                                        _active: {
                                            transform: "translateY(0px)",
                                        },
                                    }}
                                />
                            ) : (
                                <Stack spacing={2}>
                                    <Text color="whiteAlpha.800" fontSize="sm">
                                        Connected wallet: {address}
                                    </Text>
                                    <Button
                                        variant="outline"
                                        colorScheme="purple"
                                        size="sm"
                                        alignSelf="flex-start"
                                        onClick={() => disconnect()}
                                        isDisabled={isLinkingWallet}
                                    >
                                        Disconnect Wallet
                                    </Button>
                                </Stack>
                            )}
                            <Button
                                colorScheme="purple"
                                variant="solid"
                                onClick={handleLinkWallet}
                                isLoading={isLinkingWallet}
                                isDisabled={!isConnected}
                            >
                                Link Wallet
                            </Button>
                        </Stack>
                    </ModalBody>
                </ModalContent>
            </Modal>

            <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={4}>
                <Box {...glassPanelProps} bg={panelBg} p={6}>
                    <Heading size="md" mb={4}>
                        Weekly Tournament Standings
                    </Heading>
                    {dailyTournament.length ? (
                        <Table variant="simple" borderColor="rgba(255,255,255,0.25)">
                            <Thead borderBottomWidth="1px" borderColor="rgba(255,255,255,0.25)">
                                <Tr>
                                    <Th
                                        textAlign="left"
                                        color="whiteAlpha.700"
                                        borderBottomColor="rgba(255,255,255,0.25)"
                                    >
                                        Rank
                                    </Th>
                                    <Th
                                        color="whiteAlpha.700"
                                        borderBottomColor="rgba(255,255,255,0.25)"
                                    >
                                        Name
                                    </Th>
                                    <Th
                                        textAlign="right"
                                        color="whiteAlpha.700"
                                        borderBottomColor="rgba(255,255,255,0.25)"
                                    >
                                        Score
                                    </Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {dailyTournament.map((entry) => (
                                    <Tr
                                        key={entry.rank}
                                        _last={{ borderBottomWidth: 0 }}
                                    >
                                        <Td
                                            textAlign="left"
                                            borderBottomWidth="1px"
                                            borderColor="rgba(255,255,255,0.25)"
                                        >
                                            {entry.rank}
                                        </Td>
                                        <Td
                                            borderBottomWidth="1px"
                                            borderColor="rgba(255,255,255,0.25)"
                                        >
                                            {entry.username || "Unknown player"}
                                        </Td>
                                        <Td
                                            textAlign="right"
                                            borderBottomWidth="1px"
                                            borderColor="rgba(255,255,255,0.25)"
                                        >
                                            {entry.s.toLocaleString()}
                                        </Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    ) : (
                        <Text color="whiteAlpha.700" fontSize="md">
                            No tournament results available yet.
                        </Text>
                    )}
                </Box>
                <Box {...glassPanelProps} bg={panelBg} p={6}>
                    <Heading size="md" mb={4}>
                        Resources
                    </Heading>
                    {
                    <Stack spacing={3}>
                        <ResourceLink title="Git Book TOS" href="https://wildcard-alliance.gitbook.io/wildcard/wildcard-end-user-license-agreement" />
                        <ResourceLink title="Wildcard on Steam" href="https://store.steampowered.com/app/497120/Wild" />
                        <ResourceLink title="Wildcard Discord" href="https://discord.com/invite/wildcardarena" />
                    </Stack>
                    }
                </Box>
            </Grid>
        </Stack>
    );
};

const ActionItem = ({
    title,
    description,
}: {
    title: string;
    description: string;
}) => (
    <Box>
        <Heading size="sm">{title}</Heading>
        <Text color="gray.500" fontSize="sm">
            {description}
        </Text>
    </Box>
);

const ResourceLink = ({ title, href }: { title: string, href: string }) => (
    <Button variant="ghost" justifyContent="flex-start" colorScheme="purple" as="a" href={href} target="_blank" rel="noopener noreferrer">
        {title}
    </Button>
);

const CompetitorHome = ({
    userDBStr,
    connectedUserDBEmail,
    connectedUserDBProviderId,
    playerEarnings,
    dailyTournament,
    stripeSignUpComplete,
    stripeLoginLinkUrl,
}: CompetitorHomeProps) => {
    const userDB = useMemo(
        () => (userDBStr ? JSON.parse(userDBStr) : null),
        [userDBStr]
    );
    const { setUserDB, setConnectedUserDBEmail, setConnectedUserDBProviderId } =
        useWildfileUserContext();
    const router = useRouter();

    const handleLogout = useCallback(async () => {
        try {
            const response = await axios.post("/api/auth/logout");
            if (response.status !== 200) {
                throw new Error("Logout failed");
            }
        } catch (error) {
            console.error("Failed to log out via API", error);
        }

        try {
            await signOut({ redirect: false });
        } catch (error) {
            console.error("Failed to sign out through NextAuth", error);
        }

        router.push("/competitorlogin");
    }, [router]);

    useEffect(() => {
        setUserDB(userDB);
        setConnectedUserDBEmail(connectedUserDBEmail);
        setConnectedUserDBProviderId(connectedUserDBProviderId);
    }, [userDBStr, connectedUserDBEmail, connectedUserDBProviderId]);

    return (
        /*
        <ThousandsLayout
            userDB={userDB}
            connectedUserDBProviderId={connectedUserDBProviderId}
            connectedUserDBEmail={connectedUserDBEmail}
        >
            */
            <Box
                minH="inherit"
                px={{ base: 4, md: 8 }}
                py={10}
                position="relative"
                backgroundImage={
                    "linear-gradient(135deg, rgba(182, 5, 157, 0.9), rgba(43, 9, 81, 0.9)  45%, rgba(43, 9, 81, 0.9) 55%, rgba(255, 0, 48, 0.9)), url(/images/UserDashboard/dot_pattern_destop.svg)"
                }
                backgroundRepeat="no-repeat"
                backgroundPosition="top left"
                backgroundSize="cover"
                display="flex"
                justifyContent="center"
            >
                <Box width="100%" maxW="1200px" pb={10}>
                    <CompetitorOverview
                        userDB={userDB}
                        onLogout={handleLogout}
                        onUserDbUpdate={setUserDB}
                        playerEarnings={playerEarnings}
                        dailyTournament={dailyTournament}
                        stripeSignUpComplete={stripeSignUpComplete}
                        stripeLoginLinkUrl={stripeLoginLinkUrl}
                    />
                </Box>
            </Box>
            /*
        </ThousandsLayout>
        */
    );
};

export default CompetitorHome;

export const getServerSideProps: GetServerSideProps<
    | CompetitorHomeProps
    | { redirect: { destination: string; permanent: boolean } }
> = async (context) => {
    const authCheck = await checkUserAuthorizedForPage(context);

    if (!authCheck.success) {
        return authCheck.data as {
            redirect: { destination: string; permanent: boolean };
        };
    }

    const authorizedUserData = authCheck.data as AuthorizedUserData;
    const userDB: IUser | null = authorizedUserData?.userDB;
    const {
        wildcardAccessToken,
        connectedUserDBEmail,
        connectedUserDBProviderId,
    } = authorizedUserData;

    const redirect = redirectUserIfUnauthorized(
        wildcardAccessToken,
        userDB,
        context
    );

    if (redirect) {
        return redirect;
    }

    let playerEarnings = 0;
    let dailyTournament: DailyTournamentReward[] = [];
    if (userDB?.beamableProvider?.id) {
        try {
            const playerEarningsRepository =
                diContainer.get<IPlayerEarningsRepository>(
                    "IPlayerEarningsRepository"
                );
            const earningsDoc = await playerEarningsRepository.getPlayerEarnings(
                userDB.beamableProvider.id
            );
            playerEarnings = earningsDoc?.earnings ?? 0;
        } catch (error) {
            console.error("Failed to fetch player prize balance", error);
        }
    }

    if (userDB?.beamableProvider?.id) {
        try {
            const tournamentsRepository =
                diContainer.get<ITournamentsRepository>(
                    "ITournamentsRepository"
                );
            const yesterday = new Date();
            yesterday.setUTCHours(0, 0, 0, 0);
            yesterday.setUTCDate(yesterday.getUTCDate() - 2);
            dailyTournament = await tournamentsRepository.getDailyTournament(
                yesterday
            );
        } catch (error) {
            console.error("Failed to fetch tournament standings", error);
        }
    }

    let stripeSignUpComplete = false;
    let stripeLoginLinkUrl: string | null = null;
    const competitorStripeId = userDB?.competitorStripeId;
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (competitorStripeId && stripeSecretKey) {
        try {
            const { default: Stripe } = await import("stripe");
            const stripe = new Stripe(stripeSecretKey);
            const account = await stripe.accounts.retrieve(competitorStripeId);
            //console.log(JSON.stringify(account, null, 2));
            stripeSignUpComplete = Boolean(account?.details_submitted);
            const loginLink = await stripe.accounts.createLoginLink(
                competitorStripeId
            );
            stripeLoginLinkUrl = loginLink?.url ?? null;
        } catch (error) {
            console.error("Failed to verify competitor Stripe account", error);
        }
    }

    try {
        await connectToDb();

        return {
            props: {
                userDBStr: JSON.stringify(userDB),
                connectedUserDBEmail: connectedUserDBEmail ?? "",
                connectedUserDBProviderId: connectedUserDBProviderId ?? "",
                playerEarnings,
                dailyTournament,
                stripeSignUpComplete,
                stripeLoginLinkUrl,
            },
        };
    } catch (error) {
        console.error("Failed to load competitor home", error);
        return {
            props: {
                userDBStr: JSON.stringify(userDB),
                connectedUserDBEmail: connectedUserDBEmail ?? "",
                connectedUserDBProviderId: connectedUserDBProviderId ?? "",
                playerEarnings,
                dailyTournament,
                stripeSignUpComplete,
                stripeLoginLinkUrl,
            },
        };
    }
};
