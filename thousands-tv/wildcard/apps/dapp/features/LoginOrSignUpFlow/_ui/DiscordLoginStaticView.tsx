import FadeInAnimation from "@/components/Animation/FadeInAnimation";
import MainLayout from "@/layouts/MainLayout";
import { Flex } from "@chakra-ui/react";
import { useState } from "react";
import DiscordContinueWithFlow from "./DiscordContinueWithFlow";

/**
 * Renders the static page view for the Discord login page
 */
export function DiscordLoginStaticView() {
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
                        <DiscordContinueWithFlow
                            setIsSignUp={setIsSignUp}
                            isSignUp={isSignUp}
                        />
                    </Flex>
                </FadeInAnimation>
            </Flex>
        </MainLayout>
    );
}