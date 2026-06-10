import React from "react";
import { Flex } from "@chakra-ui/react";
import { FaGoogle, FaDiscord, FaTwitch } from "react-icons/fa";
import OAuthButton from "./OAuthButton";
import WalletConnectButton from "./WalletConnectButton";
import { THEME_COLOR_FONT_PRIMARY } from "@/constants";

interface AuthButtonsProps {
    onEmailClick: () => void;
    onContinueWith: (provider: string) => void;
    isLoggingIn: boolean;
    validAccessCode?: string | null | undefined;
}

const AuthButtons: React.FC<AuthButtonsProps> = ({
    onEmailClick,
    onContinueWith,
    isLoggingIn,
    validAccessCode,
}) => {
    return (
        <Flex
            direction="column"
            align="start"
            justify="center"
            gap="15px"
            w="100%"
        >
            {/* <OAuthButton
                Icon={FaGoogle}
                label="Continue with Google"
                onClick={() => onContinueWith("google")}
                color={THEME_COLOR_FONT_PRIMARY}
            />
            <OAuthButton
                Icon={FaDiscord}
                label="Continue with Discord"
                onClick={() => onContinueWith("discord")}
                color={THEME_COLOR_FONT_PRIMARY}
            />
            <OAuthButton
                Icon={FaTwitch}
                label="Continue with Twitch"
                onClick={() => onContinueWith("twitch")}
                color={THEME_COLOR_FONT_PRIMARY}
            /> */}
            {/* Login via Wallet */}
            <WalletConnectButton
                isLoggingIn={isLoggingIn}
                validAccessCode={validAccessCode}
            />
        </Flex>
    );
};

export default AuthButtons;
