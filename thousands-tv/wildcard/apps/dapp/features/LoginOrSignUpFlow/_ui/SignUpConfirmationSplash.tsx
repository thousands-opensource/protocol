import React, { useEffect } from "react";
import { Flex, Image, Heading, Text, Button } from "@chakra-ui/react";
import { getWebAppName } from "@/utils/environmentUtilWCA";
import { THEME_COLOR_FONT_PRIMARY, THEME_COLOR_SECONDARY } from "@/constants";
import { useRouter } from "next/navigation";
import FadeInAnimation from "@/components/Animation/FadeInAnimation";
import { useCursorEffect } from "@/contexts/cursorEffectContext";

const WEB_APP_NAME = getWebAppName();

interface ContinueWithFlowProps {}

export default function SignUpConfirmationSplash({}: ContinueWithFlowProps) {
    const router = useRouter();
    const { setIsBgChanged } = useCursorEffect();

    useEffect(() => {
        setIsBgChanged(false);
    }, []);

    const renderLandingPageUI = () => {
        return (
            <Flex
                justifyContent="center"
                flexDirection={"column"}
                alignItems={"center"}
                alignSelf={"center"}
                h="100%"
                gap="50px"
                mt={"300px"}
            >
                <Flex
                    flexDirection={"column"}
                    justifyContent={"center"}
                    alignItems={"center"}
                    gap="20px"
                    mt="30px"
                >
                    <Image
                        src="/images/thousands-tv.svg"
                        w={["auto", "auto", "auto", "550px", "650px", "650px"]}
                        objectFit={"cover"}
                        alt="thousands.tv"
                        loading="lazy"
                    />
                    <Text fontSize="lg" color={"white"} textAlign="center" style={{ maxWidth: "700px" }}>
                        {`No active events at the moment, but we'll be right back. In the meantime, join us in the `}<span style={{ textDecoration: "underline" }}><a href="https://discord.gg/playwildcard">Wildcard Discord</a></span>{`, stay tuned, and don't miss a moment of what comes next!`}
                    </Text>
                </Flex>
            </Flex>
        );
    };

    return (
        <FadeInAnimation>
            <Flex
                justifyContent="center"
                flexDirection={"column"}
                alignItems={"center"}
            >
                {renderLandingPageUI()}
            </Flex>
        </FadeInAnimation>
    );
}
