import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button, ButtonProps, Icon, Box } from "@chakra-ui/react";
import { FaWallet } from "react-icons/fa";

interface RainbowkitCustomConnectButtonProps {
    color?: string;
    buttonProps?: Omit<ButtonProps, "onClick">;
}

/**
 * React component that displays Rainbowkit custom connect button.
 */
const RainbowkitCustomConnectButton = ({
    color = "orange.500",
    buttonProps,
}: RainbowkitCustomConnectButtonProps) => {
    return (
        <Box w="100%">
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
                        <Button
                            leftIcon={<Icon as={FaWallet} />}
                            color={color}
                            w="100%"
                            variant="outline"
                            mb={4}
                            onClick={openConnectModal}
                            {...buttonProps}
                        >
                            Connect Wallet
                        </Button>
                    );
                }}
            </ConnectButton.Custom>
        </Box>
    );
};

export default RainbowkitCustomConnectButton;
