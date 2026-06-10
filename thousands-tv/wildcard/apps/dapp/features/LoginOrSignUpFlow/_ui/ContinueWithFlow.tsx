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
import AuthButtons from "./AuthButtons";
import { THEME_COLOR_SECONDARY } from "@/constants";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import FadeInAnimation from "@/components/Animation/FadeInAnimation";
import { validateQueryParamsAndRedirect } from "@/utils/accountsUtil";
import UserRolesAccessCodeInput from "./UserRolesAccessCodeInput";

export interface LoginValues {
    username: string;
    password: string;
}

interface ContinueWithFlowProps {
    setIsSignUp: (isSignUp: boolean) => void;
    isSignUp: boolean;
}

export default function ContinueWithFlow({
    setIsSignUp,
    isSignUp,
}: ContinueWithFlowProps) {
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
    const [validAccessCode, setValidAccessCode] = useState<string | null>(null);
    const [isValidatingQueryCode, setIsValidatingQueryCode] = useState(false);

    const searchParams = useSearchParams();
    const router = useRouter();

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
     * Handles the sign-in process for a given provider and constructs the appropriate callback URL
     * based on the presence of a valid access code or a redirect URL.
     * @dev - handles redirecting to the verify page based on the desired intent (ie. access code or login redirect url)
     */
    const handleContinueWith = async (provider: string) => {
        const callbackUrl = validateQueryParamsAndRedirect(
            validAccessCode,
            false
        );

        await signIn(provider, { callbackUrl });
    };

    // Render the loading overlay JSX
    const renderLoadingOverlayJSX = () => {
        if (isLoggingIn) {
            return (
                <Portal>
                    <LoadingOverlay message="Logging in..." />
                </Portal>
            );
        }
    };

    /**
     * Render the access code input JSX
     */
    const renderAccessCodeInputJSX = () => {
        if (isValidatingQueryCode) {
            return (
                <Center>
                    <Spinner size="sm" />
                </Center>
            );
        }
        if (validAccessCode) {
            return (
                <Text
                    color={THEME_COLOR_SECONDARY}
                    fontSize="xs"
                    align="center"
                >
                    Access code applied! Continue to sign in.
                </Text>
            );
        } else {
            return (
                <UserRolesAccessCodeInput
                    setValidAccessCode={setValidAccessCode}
                />
            );
        }
    };

    /**
     * Render the Twitch login link
     */
    const renderTwitchLoginLink = () => {
        return (
            <Text
                fontSize="sm"
                color={THEME_COLOR_SECONDARY}
                cursor="pointer"
                textAlign="center"
                _hover={{ opacity: 0.8 }}
                onClick={() => router.push('/twitch')}
            >
                Login with Twitch
            </Text>
        );
    };

    /**
     * Render the Discord login link
     */
    const renderDiscordLoginLink = () => {
        return (
            <Text
                fontSize="sm"
                color={THEME_COLOR_SECONDARY}
                cursor="pointer"
                textAlign="center"
                _hover={{ opacity: 0.8 }}
                onClick={() => router.push('/discord')}
            >
                Login with Discord
            </Text>
        );
    };

    // Display the continue with flow JSX (email sign in, sign up, + auth buttons)
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
                    <AuthButtons
                        onEmailClick={() => setShowEmailForm(true)}
                        onContinueWith={(provider) =>
                            handleContinueWith(provider)
                        }
                        isLoggingIn={isLoggingIn}
                        validAccessCode={validAccessCode}
                    />
                </Flex>
{/*
                <Divider />

                {renderAccessCodeInputJSX()}
                
                <Flex direction="row" gap="20px" justify="center" mt="10px">
                    {renderTwitchLoginLink()}
                    {renderDiscordLoginLink()}
                </Flex>
*/}
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
