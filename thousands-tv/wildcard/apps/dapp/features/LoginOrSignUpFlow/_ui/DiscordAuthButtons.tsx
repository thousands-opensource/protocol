import React from "react";
import { Flex } from "@chakra-ui/react";
import { FaDiscord } from "react-icons/fa";
import OAuthButton from "./OAuthButton";
import { THEME_COLOR_FONT_PRIMARY } from "@/constants";

interface DiscordAuthButtonsProps {
    onContinueWith: (provider: string) => void;
    isLoggingIn: boolean;
}

/**
 * DiscordAuthButtons component renders a button to continue with Discord authentication.
 * @param param0
 * @returns
 */
const DiscordAuthButtons: React.FC<DiscordAuthButtonsProps> = ({
    onContinueWith,
    isLoggingIn,
}) => {
    return (
        <Flex
            direction="column"
            align="start"
            justify="center"
            gap="15px"
            w="100%"
        >
            <OAuthButton
                Icon={FaDiscord}
                label="Continue with Discord"
                onClick={() => onContinueWith("discord")}
                color={THEME_COLOR_FONT_PRIMARY}
                isDisabled={isLoggingIn}
            />
        </Flex>
    );
};

export default DiscordAuthButtons;