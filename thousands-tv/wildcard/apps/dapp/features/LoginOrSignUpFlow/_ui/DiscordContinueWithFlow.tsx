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
import DiscordAuthButtons from "./DiscordAuthButtons";
import { THEME_COLOR_SECONDARY } from "@/constants";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { useSearchParams } from "next/navigation";
import FadeInAnimation from "@/components/Animation/FadeInAnimation";
import { validateQueryParamsAndRedirect } from "@/utils/accountsUtil";
import UserRolesAccessCodeInput from "./UserRolesAccessCodeInput";
import Cookies from "js-cookie";
import { COOKIES_IS_DISCORD_LOGIN } from "@/utils/accountAPIUtil";

interface DiscordContinueWithFlowProps {
    setIsSignUp: (isSignUp: boolean) => void;
    isSignUp: boolean;
}

export default function DiscordContinueWithFlow({
    setIsSignUp,
    isSignUp,
}: DiscordContinueWithFlowProps) {
    const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
    const [validAccessCode, setValidAccessCode] = useState<string | null>(null);
    const [isValidatingQueryCode, setIsValidatingQueryCode] = useState(false);

    const searchParams = useSearchParams();

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
     * Handles the sign-in process for Discord provider and constructs the appropriate callback URL
     * based on the presence of a valid access code or a redirect URL.
     */
    const handleContinueWith = async (provider: string) => {
        setIsLoggingIn(true);
        try {
            // Set a cookie to track that this is a Discord login
            Cookies.set(COOKIES_IS_DISCORD_LOGIN, "true", { expires: 1 }); // Expires in 1 day
            
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
                    <LoadingOverlay message="Connecting to Discord..." />
                </Portal>
            );
        }
    };

    // Display the continue with flow JSX (Discord auth button + access code)
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
                    <DiscordAuthButtons
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