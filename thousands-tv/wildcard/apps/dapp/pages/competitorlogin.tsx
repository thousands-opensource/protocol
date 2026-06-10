import { useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";
import {
    Box,
    Button,
    Spinner,
    Stack,
    Text,
    useColorModeValue,
    VStack,
} from "@chakra-ui/react";
import {
    getCookieValue,
    getDiscordLoginRedirectUrl,
} from "@/utils/accountsUtil";
import { COOKIES_USER_SERVER_PREFERENCES } from "@/utils/accountAPIUtil";
import { FaDiscord } from "react-icons/fa";
import WalletConnectButton from "@/features/LoginOrSignUpFlow/_ui/WalletConnectButton";

const CompetitorLogin = () => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const panelBg = useColorModeValue(
        "rgba(255, 255, 255, 0.75)",
        "rgba(255, 255, 255, 0.18)"
    );
    const panelBorder = useColorModeValue(
        "rgba(255, 255, 255, 0.55)",
        "rgba(255, 255, 255, 0.35)"
    );
    const glassPanelProps = {
        borderRadius: "2xl",
        border: "1px solid",
        borderColor: panelBorder,
        backdropFilter: "blur(4px)",
        backgroundClip: "padding-box",
        boxShadow: "0 18px 50px rgba(0, 0, 0, 0.25)",
        p: { base: 8, md: 12 },
        maxW: "520px",
        w: "full",
    };

    useEffect(() => {
        if (status === "authenticated" && session) {
            const serverPreferences = getCookieValue(
                COOKIES_USER_SERVER_PREFERENCES
            );
            const serverCode = serverPreferences?.serverCode || "thousands";
            router.push(`/${serverCode}/competitor`);
        }
    }, [status, session, router]);

    const handleDiscordLogin = () => {
        const serverPreferences = getCookieValue(
            COOKIES_USER_SERVER_PREFERENCES
        );
        const serverCode = serverPreferences?.serverCode || "thousands";
        const callbackUrl = `/${serverCode}/competitor`;
        signIn("discord", { callbackUrl });
    };

    if (status === "loading") {
        return (
            <>
                <Head>
                    <title>Competitor Login - Thousands.tv</title>
                    <meta
                        name="description"
                        content="Login to Thousands.tv competitor experience"
                    />
                </Head>
                <Box
                    minH="100vh"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    backgroundImage={
                        "linear-gradient(135deg, rgba(182, 5, 157, 0.9), rgba(43, 9, 81, 0.9) 45%, rgba(43, 9, 81, 0.9) 55%, rgba(255, 0, 48, 0.9)), url(/images/UserDashboard/dot_pattern_destop.svg)"
                    }
                    backgroundRepeat="no-repeat"
                    backgroundPosition="top left"
                    backgroundSize="cover"
                >
                    <Spinner size="xl" color="purple.200" thickness="4px" />
                </Box>
            </>
        );
    }

    return (
        <>
            <Head>
                <title>Competitor Login - Thousands.tv</title>
                <meta
                    name="description"
                    content="Login to Thousands.tv competitor experience"
                />
            </Head>
            <Box
                minH="100vh"
                display="flex"
                alignItems="center"
                justifyContent="center"
                px={4}
                backgroundImage={
                    "linear-gradient(135deg, rgba(182, 5, 157, 0.9), rgba(43, 9, 81, 0.9) 45%, rgba(43, 9, 81, 0.9) 55%, rgba(255, 0, 48, 0.9)), url(/images/UserDashboard/dot_pattern_destop.svg)"
                }
                backgroundRepeat="no-repeat"
                backgroundPosition="top left"
                backgroundSize="cover"
            >
                <VStack
                    spacing={8}
                    textAlign="center"
                    {...glassPanelProps}
                    bg={panelBg}
                    color="white"
                >
                    <Stack spacing={3}>
                        <Text fontSize="3xl" fontWeight="bold">
                            Wildcard Competitors
                        </Text>
                        <Text color="whiteAlpha.800">
                            Sign in with Discord or your Wallet to access standings and rewards.
                        </Text>
                    </Stack>
                    <Button
                        size="lg"
                        leftIcon={<FaDiscord />}
                        onClick={handleDiscordLogin}
                        bgGradient="linear(to-r, #7c3aed, #b5179e)"
                        color="white"
                        w="full"
                        maxW="360px"
                        alignSelf="center"
                        h="56px"
                        px={10}
                        py={6}
                        _hover={{
                            bgGradient: "linear(to-r, #8b5cf6, #c026d3)",
                            transform: "translateY(-1px)",
                            boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
                        }}
                        _active={{ transform: "translateY(0px)" }}
                    >
                        Continue with Discord
                    </Button>
                    <WalletConnectButton
                        isLoggingIn={false}
                        validAccessCode={null}
                        redirectUrl="/thousands/competitor/"
                        buttonProps={{
                            size: "lg",
                            w: "full",
                            maxW: "360px",
                            alignSelf: "center",
                            h: "56px",
                            variant: "solid",
                            bgGradient: "linear(to-r, #7c3aed, #b5179e)",
                            color: "white",
                            px: 10,
                            py: 6,
                            _hover: {
                                bgGradient: "linear(to-r, #8b5cf6, #c026d3)",
                                transform: "translateY(-1px)",
                                boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
                            },
                            _active: { transform: "translateY(0px)" },
                        }}
                    />
                </VStack>
            </Box>
        </>
    );
};

export default CompetitorLogin;
