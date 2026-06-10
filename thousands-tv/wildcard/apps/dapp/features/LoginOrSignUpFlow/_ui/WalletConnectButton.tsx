import React, { useEffect, useRef, useState } from "react";
import { useAccount, useNetwork, useSignMessage } from "wagmi";
import OAuthButton from "./OAuthButton";
import { useInfoNotifications } from "@/hooks/useInfoNotifications";
import axios from "axios";
import { AccountProviderType, WildcardApiResponse } from "@repo/interfaces";
import { Portal } from "@chakra-ui/react";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { useRouter } from "next/navigation";
import { THEME_COLOR_SECONDARY } from "@/constants";
import { validateQueryParamsAndRedirect } from "@/utils/accountsUtil";
import { MdOutlineWallet } from "react-icons/md";
import { onExpectedChain } from "@/utils/wagmi";
import NetworkMismatchModal from "./NetworkMismatchModal";
import RainbowkitCustomConnectButton from "@/components/RainbowkitCustomConnectButton";
import { useBreakpointValue } from "@chakra-ui/react";

interface WalletConnectButtonProps {
    isLoggingIn: boolean;
    validAccessCode: string | null | undefined;
    redirectUrl?: string;
    buttonProps?: Omit<
        React.ComponentProps<typeof OAuthButton>,
        "Icon" | "label" | "onClick"
    >;
}

const WalletConnectButton = ({
    isLoggingIn,
    validAccessCode,
    redirectUrl,
    buttonProps,
}: WalletConnectButtonProps) => {
    const { address, isConnected } = useAccount();
    const { onMessage } = useInfoNotifications();
    const [isLoggingInWallet, setIsLoggingInWallet] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>("");
    const router = useRouter();
    const { chain } = useNetwork();
    const isMobile = useBreakpointValue({
        base: true,
        md: true,
        lg: false,
    });

    const initialRenderRef = useRef(true);
    const wasConnectedRef = useRef(false);
    useEffect(() => {
        if (initialRenderRef.current) {
            // On initial render, store the initial connection state
            initialRenderRef.current = false;
            wasConnectedRef.current = isConnected;
            return;
        }

        // Only trigger if we weren't connected before but are now connected
        if (!wasConnectedRef.current && isConnected && address) {
            handleLogin();
        }

        // Update the previous connection state
        wasConnectedRef.current = isConnected;
    }, [isConnected, address]);

    const { signMessage: signInWithWalletMessage, reset: resetSignMessage } =
        useSignMessage({
            onSuccess: (data: any, variables: any) => {
                setLoadingMessage("Logging in...");
                callLoginApi(data, variables.message);
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
            const message = `Please sign this message to login to Wildcard and verify ownership of your account. This is READ-ONLY access and will NOT trigger any blockchain transactions or incur any fees.\nNonce: ${nonce}`;

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

    const callLoginApi = async (signature: string, message: string) => {
        try {
            const body = {
                wildcardSessionTokenParams: {
                    accountProviderType: AccountProviderType.WALLET,
                    address,
                    signature,
                    message,
                },
            };

            const resp = await axios.post("/api/auth/wildcard/token", body);
            const loginResp: WildcardApiResponse = resp.data;

            if (!loginResp.success) {
                setIsLoggingInWallet(false);
                onMessage({
                    title: "Login failed",
                    description:
                        loginResp.err ||
                        "Failed to authenticate with the server",
                    status: "warning",
                });
                return;
            }

            const callbackUrl =
                redirectUrl ??
                validateQueryParamsAndRedirect(validAccessCode, false);
            // Redirect the user to the constructed callback URL
            setTimeout(() => {
                router.push(callbackUrl);
            }, 500);
        } catch (error: any) {
            setIsLoggingInWallet(false);
            console.error("Failed to login:", error);
            onMessage({
                title: "Login failed",
                description:
                    error.response?.data?.message ||
                    "An error occurred during login",
                status: "error",
            });
        }
    };

    if (!isConnected) {
        return (
            <RainbowkitCustomConnectButton
                color={THEME_COLOR_SECONDARY}
                buttonProps={buttonProps}
            />
        );
    }

    const renderLoadingOverlayJSX = () => {
        if (isLoggingInWallet || isLoggingIn) {
            return (
                <Portal>
                    <LoadingOverlay message={loadingMessage} />
                </Portal>
            );
        }
    };

    // Check if the user is on the expected network and show the modal if not
    const isOnExpectedChain = onExpectedChain(chain);
    const requiredChainIdMismatch = !isOnExpectedChain;

    const renderNetworkMismatchModal = () => {
        if (isMobile && requiredChainIdMismatch) {
            return <NetworkMismatchModal />;
        }
    };

    return (
        <>
            {renderNetworkMismatchModal()}
            {renderLoadingOverlayJSX()}
            <OAuthButton
                Icon={MdOutlineWallet}
                label={
                    isLoggingInWallet ? "Logging in..." : "Login with Wallet"
                }
                onClick={handleLogin}
                color="white"
                isLoading={isLoggingInWallet}
                isDisabled={isLoggingInWallet}
                {...buttonProps}
            />
        </>
    );
};

export default WalletConnectButton;
