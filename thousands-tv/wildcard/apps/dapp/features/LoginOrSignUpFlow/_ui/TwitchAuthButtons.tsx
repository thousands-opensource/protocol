import React from "react";
import { Flex } from "@chakra-ui/react";
import { FaTwitch } from "react-icons/fa";
import OAuthButton from "./OAuthButton";
import { THEME_COLOR_FONT_PRIMARY } from "@/constants";

interface TwitchAuthButtonsProps {
    onContinueWith: (provider: string) => void;
    isLoggingIn: boolean;
}

/**
 * TwitchAuthButtons component renders a button to continue with Twitch authentication.
 * @param param0
 * @returns
 */
const TwitchAuthButtons: React.FC<TwitchAuthButtonsProps> = ({
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
                Icon={FaTwitch}
                label="Continue with Twitch"
                onClick={() => onContinueWith("twitch")}
                color={THEME_COLOR_FONT_PRIMARY}
                isDisabled={isLoggingIn}
            />
        </Flex>
    );
};

export default TwitchAuthButtons;
