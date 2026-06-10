import FadeInAnimation from "@/components/Animation/FadeInAnimation";
import MainLayout from "@/layouts/MainLayout";
import { Box, Flex } from "@chakra-ui/react";
import { useState } from "react";
import ContinueWithFlow from "./ContinueWithFlow";

interface LoginStaticViewProps {
    useThousandsBackground?: boolean;
}

/**
 * Renders the static page view for the login page
 */
export function LoginStaticView({
    useThousandsBackground = false,
}: LoginStaticViewProps) {
    const [isSignUp, setIsSignUp] = useState(false);

    const content = (
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
                    <ContinueWithFlow
                        setIsSignUp={setIsSignUp}
                        isSignUp={isSignUp}
                    />
                </Flex>
            </FadeInAnimation>
        </Flex>
    );

    if (useThousandsBackground) {
        return (
            <Box
                minH="100vh"
                backgroundImage={
                    "linear-gradient(135deg, rgba(255, 0, 48, 0.9), rgba(43, 9, 81, 0.9) 70%, rgba(43, 9, 81, 0.9) 100%, rgba(43, 9, 81, 0.9)), url(/images/UserDashboard/dot_pattern_destop.svg)"
                }
                backgroundRepeat="no-repeat"
                backgroundPosition="top left"
                backgroundSize="100% 100%, 2100px auto"
            >
                {content}
            </Box>
        );
    }

    return <MainLayout>{content}</MainLayout>;
}
