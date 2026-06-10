import { Flex, FlexProps } from "@chakra-ui/react";

export interface ConicalOvalBgProps extends FlexProps {}

export function ConicalOvalBg(props: ConicalOvalBgProps) {
    return (
        <Flex
            left="400"
            bottom="500"
            boxSize={{
                base: "250px",
                xl: "650px",
            }}
            position="absolute"
            sx={{
                background:
                    "conic-gradient(from 230.29deg at 51.63% 52.16%, rgba(36, 0, 255, 0.9) 0deg, rgba(0, 135, 255, 0.5) 67.5deg, rgba(255, 255, 255, 0.5) 198.75deg, rgba(24, 38, 163, 0.1) 251.25deg, rgba(54, 103, 196, 0.5) 301.88deg, rgba(144, 233, 252, 0.8) 360deg)",
                filter: "blur(70px)",
                transform: "translateZ(100px)",
                animation: "pulsate 4s infinite",
            }}
            overflow="hidden"
            {...props}
        />
    );
}
