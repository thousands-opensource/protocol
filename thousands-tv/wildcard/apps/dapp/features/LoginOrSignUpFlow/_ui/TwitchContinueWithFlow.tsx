import React, { useEffect, useState } from "react";
import {
    Flex,
    VStack,
    Image,
    Text,
    Divider,
    Portal,
    Center,
    Spinner,
} from "@chakra-ui/react";
import { signIn } from "next-auth/react";
import axios from "axios";
import TwitchAuthButtons from "./TwitchAuthButtons";
import { THEME_COLOR_SECONDARY } from "@/constants";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { useSearchParams } from "next/navigation";
import FadeInAnimation from "@/components/Animation/FadeInAnimation";
import { validateQueryParamsAndRedirect } from "@/utils/accountsUtil";
import UserRolesAccessCodeInput from "./UserRolesAccessCodeInput";
import Cookies from "js-cookie";
import {
    COOKIES_IS_TWITCH_LOGIN,
    COOKIES_IS_TWITCH_STREAMER_LOGIN,
} from "@/utils/accountAPIUtil";
import { useRouter } from "next/router";

interface TwitchContinueWithFlowProps {
    setIsSignUp: (isSignUp: boolean) => void;
    isSignUp: boolean;
}

export default function TwitchContinueWithFlow({
    setIsSignUp,
    isSignUp,
}: TwitchContinueWithFlowProps) {
    const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
    const [validAccessCode, setValidAccessCode] = useState<string | null>(null);
    const [isValidatingQueryCode, setIsValidatingQueryCode] = useState(false);

    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = router.pathname;

    useEffect(() => {
        const validateQueryAccessCode = async () => {
            const accessCode = searchParams.get("accessCode");
            if (accessCode) {
                setIsValidatingQueryCode(true);
                try {
                    const response = await axios.get(
                        `/api/accessCode/validateAccessCode`,
                        {
                            params: { code: accessCode },
                        }
                    );
                    if (response.data.data.isValid) {
                        setValidAccessCode(accessCode);
                    }
                } catch (error) {
                    console.error("Error validating query access code:", error);
                } finally {
                    setIsValidatingQueryCode(false);
                }
            }
        };

        validateQueryAccessCode();
    }, [searchParams]);

    /**
     * Handles the sign-in process for Twitch provider and constructs the appropriate callback URL
     * based on the presence of a valid access code or a redirect URL.
     */
    const handleContinueWith = async (provider: string) => {
        setIsLoggingIn(true);
        try {
            let twitchCookie = COOKIES_IS_TWITCH_LOGIN;
            twitchCookie = pathname.toLowerCase().includes("streamontwitch")
                ? COOKIES_IS_TWITCH_STREAMER_LOGIN
                : twitchCookie;

            // Set a cookie to track that this is a Twitch login
            Cookies.set(twitchCookie, "true", { expires: 1 }); // Expires in 1 day

            const callbackUrl = validateQueryParamsAndRedirect(
                validAccessCode,
                false
            );

            await signIn(provider, { callbackUrl });
        } catch (error) {
            console.error("Error during sign in:", error);
            setIsLoggingIn(false);
        }
    };

    // Render the loading overlay JSX
    const renderLoadingOverlayJSX = () => {
        if (isLoggingIn) {
            return (
                <Portal>
                    <LoadingOverlay message="Connecting to Twitch..." />
                </Portal>
            );
        }
    };

    // Display the continue with flow JSX (Twitch auth button + access code)
    const renderContinueWithFlowJSX = () => {
        return (
            <VStack spacing={"10px"} mt="40px" py="100px">
                <Image
                    src="/images/thousands-login-icon.svg"
                    h="20"
                    w="20"
                    alt="Wildcard logo"
                />

                <Flex flexDirection={"column"} my="30px" gap="10px">
                    <TwitchAuthButtons
                        onContinueWith={(provider) =>
                            handleContinueWith(provider)
                        }
                        isLoggingIn={isLoggingIn}
                    />
                </Flex>
            </VStack>
        );
    };

    return (
        <FadeInAnimation>
            <Flex
                justifyContent="center"
                flexDirection={"column"}
                alignItems={"center"}
                bg="unset"
            >
                {renderContinueWithFlowJSX()}
                {renderLoadingOverlayJSX()}
            </Flex>
        </FadeInAnimation>
    );
}
