import React from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button, ButtonProps, Flex, Text } from "@chakra-ui/react";

interface CustomWalletConnectButtonProps extends ButtonProps {
    accountStatus?: "full" | "avatar" | "address";
    showNetwork?: boolean;
}

interface RainbowkitChain {
    hasIcon: boolean;
    iconUrl?: string;
    iconBackground?: string;
    id: number;
    name?: string;
    unsupported?: boolean;
}

/**
 * Custom Styled Connect Button Component for Native UI Integration
 * @sev - https://www.rainbowkit.com/docs/custom-connect-button
 */
const CustomWalletConnectButton: React.FC<CustomWalletConnectButtonProps> = ({
    accountStatus = "full",
    showNetwork = false,
    ...buttonProps
}) => {
    // Render Connected Wallet Network Settings
    const renderNetworkSettingsJSX = (
        chain: RainbowkitChain,
        openChainModal: () => void
    ) => {
        if (!showNetwork) {
            return;
        }

        return (
            <Button
                onClick={openChainModal}
                style={{
                    display: "flex",
                    alignItems: "center",
                }}
                {...buttonProps}
            >
                {chain.name}
            </Button>
        );
    };

    return (
        <ConnectButton.Custom>
            {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                authenticationStatus,
                mounted,
            }) => {
                const ready = mounted && authenticationStatus !== "loading";
                const connected =
                    ready &&
                    account &&
                    chain &&
                    (!authenticationStatus ||
                        authenticationStatus === "authenticated");

                return (
                    <div
                        {...(!ready && {
                            "aria-hidden": true,
                            style: {
                                opacity: 0,
                                pointerEvents: "none",
                                userSelect: "none",
                            },
                        })}
                    >
                        {(() => {
                            if (!connected) {
                                return (
                                    <Button
                                        onClick={openConnectModal}
                                        {...buttonProps}
                                    >
                                        Connect Wallet
                                    </Button>
                                );
                            }

                            if (chain.unsupported) {
                                return (
                                    <Button
                                        onClick={openChainModal}
                                        {...buttonProps}
                                    >
                                        <Flex flexDirection={"column"}>
                                            <Text fontSize={"lg"}>
                                                {account.displayName}
                                            </Text>
                                            {/*<Text fontSize={"xs"}>
                                                Wrong Network
                                            </Text>*/}
                                        </Flex>
                                    </Button>
                                );
                            }

                            return (
                                <div style={{ display: "flex", gap: 12 }}>
                                    {renderNetworkSettingsJSX(
                                        chain,
                                        openChainModal
                                    )}

                                    <Button
                                        onClick={openAccountModal}
                                        {...buttonProps}
                                    >
                                        {account.displayName}
                                    </Button>
                                </div>
                            );
                        })()}
                    </div>
                );
            }}
        </ConnectButton.Custom>
    );
};

export default CustomWalletConnectButton;
