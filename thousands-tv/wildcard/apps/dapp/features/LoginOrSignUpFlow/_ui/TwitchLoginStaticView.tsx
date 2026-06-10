import FadeInAnimation from "@/components/Animation/FadeInAnimation";
import MainLayout from "@/layouts/MainLayout";
import { Flex } from "@chakra-ui/react";
import { useState } from "react";
import TwitchContinueWithFlow from "./TwitchContinueWithFlow";

/**
 * Renders the static page view for the Twitch login page
 */
export function TwitchLoginStaticView() {
    const [isSignUp, setIsSignUp] = useState(false);

    return (
        <MainLayout>
            <Flex
                flexDirection="column"
                justifyContent="center"
                alignItems={"center"}
                p="20px"
                h="100%"
                minH="100vh"
                w="100%"
            >
                <FadeInAnimation>
                    <Flex
                        justifyContent="center"
                        flexDirection={"column"}
                        alignItems={"center"}
                        bg="unset"
                    >
                        <TwitchContinueWithFlow
                            setIsSignUp={setIsSignUp}
                            isSignUp={isSignUp}
                        />
                    </Flex>
                </FadeInAnimation>
            </Flex>
        </MainLayout>
    );
}